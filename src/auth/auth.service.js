import crypto from 'crypto'
import bcrypt from 'bcryptjs'
import { OAuth2Client } from 'google-auth-library'
import User from '../../models/User.model.js'
import Token from '../../models/Token.model.js'
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from '../../utils/jwt.utils.js'
import {
  sendEmail,
  verificationEmail,
  passwordResetEmail,
  welcomeEmail,
} from '../../utils/email.utils.js'

const GOOGLE_CLIENT = new OAuth2Client(process.env.GOOGLE_CLIENT_ID)
const OTP_SALT_ROUNDS = 10
const MAX_FAILED_ATTEMPTS = 5
const LOCKOUT_DURATION_MS = 15 * 60 * 1000 // 15 minutes

// ── Token helpers ─────────────────────────────────────────────────────────────

// Cryptographically secure 6-digit OTP
function generateOTP() {
  return crypto.randomInt(100000, 1000000).toString()
}

// SHA-256 hash for long random tokens (refresh tokens are already high-entropy JWTs;
// hashing prevents DB-dump session hijacking without the bcrypt cost on every refresh)
function hashRefreshToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex')
}

// bcrypt hash for short OTPs (brute-force protection even with DB compromise)
async function hashOTP(otp) {
  return bcrypt.hash(otp, OTP_SALT_ROUNDS)
}

// Store a new refresh token (hashed) and return the raw token to send to client
async function storeRefreshToken(userId, rawToken) {
  await Token.create({
    userId,
    token: hashRefreshToken(rawToken),
    type: 'refresh',
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  })
}

// ── Auth flows ────────────────────────────────────────────────────────────────

export const register = async ({ name, firstName, lastName, email, password, consent }) => {
  const existingUser = await User.findOne({ email: email.toLowerCase() })
  if (existingUser) {
    throw Object.assign(new Error('Email already registered'), { statusCode: 409 })
  }

  let userFirstName = firstName
  let userLastName = lastName
  if (name && !firstName && !lastName) {
    const parts = name.trim().split(' ')
    userFirstName = parts[0] || name
    userLastName = parts.slice(1).join(' ') || ''
  }

  const user = await User.create({
    firstName: userFirstName,
    lastName: userLastName,
    email: email.toLowerCase(),
    password,
    consent: { ...consent, consentDate: new Date() },
  })

  const otp = generateOTP()
  await Token.deleteMany({ userId: user._id, type: 'otp' })
  await Token.create({
    userId: user._id,
    token: await hashOTP(otp),
    type: 'otp',
    expiresAt: new Date(Date.now() + 10 * 60 * 1000),
  })

  const emailContent = verificationEmail(user.getFullName(), otp)
  await sendEmail({ to: user.email, subject: emailContent.subject, html: emailContent.html })

  return user.toJSON()
}

export const login = async ({ email, password }) => {
  const user = await User.findOne({ email: email.toLowerCase() }).select(
    '+password +failedLoginAttempts +lockoutUntil'
  )

  // Uniform error — never confirm whether the email exists
  if (!user || !user.password) {
    throw Object.assign(new Error('Invalid credentials'), { statusCode: 401 })
  }

  // Account lockout check
  if (user.lockoutUntil && user.lockoutUntil > new Date()) {
    const minutesLeft = Math.ceil((user.lockoutUntil - Date.now()) / 60000)
    throw Object.assign(new Error(`Account locked. Try again in ${minutesLeft} minute(s).`), {
      statusCode: 429,
    })
  }

  const isPasswordValid = await user.comparePassword(password)

  if (!isPasswordValid) {
    const attempts = (user.failedLoginAttempts || 0) + 1
    const update =
      attempts >= MAX_FAILED_ATTEMPTS
        ? { failedLoginAttempts: 0, lockoutUntil: new Date(Date.now() + LOCKOUT_DURATION_MS) }
        : { failedLoginAttempts: attempts }

    await User.updateOne({ _id: user._id }, update)
    throw Object.assign(new Error('Invalid credentials'), { statusCode: 401 })
  }

  if (!user.isVerified) {
    throw Object.assign(new Error('Please verify your email first'), { statusCode: 401 })
  }

  if (!user.isActive) {
    throw Object.assign(new Error('Account is deactivated'), { statusCode: 401 })
  }

  // Reset lockout state and record login — use updateOne to skip re-encryption pre-save hooks
  await User.updateOne(
    { _id: user._id },
    { failedLoginAttempts: 0, lockoutUntil: null, lastLogin: new Date() }
  )

  const payload = { userId: user._id, role: user.role }
  const accessToken = generateAccessToken(payload)
  const refreshToken = generateRefreshToken(payload)
  await storeRefreshToken(user._id, refreshToken)

  const userJSON = user.toJSON()
  return {
    user: { ...userJSON, isOnboardingComplete: user.isOnboardingComplete },
    accessToken,
    refreshToken,
  }
}

export const googleAuthCallback = async (googleProfile) => {
  const user = googleProfile
  const payload = { userId: user._id, role: user.role }
  const accessToken = generateAccessToken(payload)
  const refreshToken = generateRefreshToken(payload)
  await storeRefreshToken(user._id, refreshToken)
  return { user: user.toJSON(), accessToken, refreshToken }
}

export const refreshTokens = async (refreshToken) => {
  const decoded = verifyRefreshToken(refreshToken)
  const tokenHash = hashRefreshToken(refreshToken)

  const tokenDoc = await Token.findOne({
    token: tokenHash,
    userId: decoded.userId,
    type: 'refresh',
    isRevoked: false,
    expiresAt: { $gt: new Date() },
  })

  if (!tokenDoc) {
    throw Object.assign(new Error('Invalid refresh token'), { statusCode: 401 })
  }

  // Rotate: revoke old, issue new
  tokenDoc.isRevoked = true
  await tokenDoc.save()

  const user = await User.findById(decoded.userId)
  if (!user || !user.isActive) {
    throw Object.assign(new Error('User not found or inactive'), { statusCode: 401 })
  }

  const payload = { userId: user._id, role: user.role }
  const newAccessToken = generateAccessToken(payload)
  const newRefreshToken = generateRefreshToken(payload)
  await storeRefreshToken(user._id, newRefreshToken)

  return { accessToken: newAccessToken, refreshToken: newRefreshToken }
}

export const logout = async (refreshToken) => {
  if (!refreshToken) return
  try {
    const tokenHash = hashRefreshToken(refreshToken)
    const tokenDoc = await Token.findOne({ token: tokenHash, type: 'refresh' })
    if (tokenDoc) {
      tokenDoc.isRevoked = true
      await tokenDoc.save()
    }
  } catch {
    // Invalid token shape — logout still succeeds
  }
}

export const verifyOTP = async ({ email, otp }) => {
  const user = await User.findOne({ email: email.toLowerCase() })

  // Don't reveal user existence — use same error message regardless
  if (!user) {
    throw Object.assign(new Error('Invalid or expired OTP'), { statusCode: 400 })
  }

  const tokenDocs = await Token.find({
    userId: user._id,
    type: 'otp',
    isRevoked: false,
    expiresAt: { $gt: new Date() },
  })

  let matchingTokenId = null
  for (const tokenDoc of tokenDocs) {
    if (await bcrypt.compare(otp, tokenDoc.token)) {
      matchingTokenId = tokenDoc._id
      break
    }
  }

  if (!matchingTokenId) {
    throw Object.assign(new Error('Invalid or expired OTP'), { statusCode: 400 })
  }

  // Atomic compare-and-swap: only proceed if WE are the one who flipped isRevoked
  const claimed = await Token.findOneAndUpdate(
    { _id: matchingTokenId, isRevoked: false },
    { isRevoked: true }
  )
  if (!claimed) {
    // Another concurrent request already consumed this token
    throw Object.assign(new Error('Invalid or expired OTP'), { statusCode: 400 })
  }

  await User.updateOne({ _id: user._id }, { isVerified: true })

  const emailContent = welcomeEmail(user.getFullName())
  await sendEmail({ to: user.email, subject: emailContent.subject, html: emailContent.html })

  return user
}

export const forgotPassword = async (email) => {
  const user = await User.findOne({ email: email.toLowerCase() })

  // Always succeed silently — never confirm whether the email exists
  if (!user) return

  const otp = generateOTP()
  await Token.deleteMany({ userId: user._id, type: 'otp', purpose: 'reset' })
  await Token.create({
    userId: user._id,
    token: await hashOTP(otp),
    type: 'otp',
    purpose: 'reset',
    expiresAt: new Date(Date.now() + 10 * 60 * 1000),
  })

  const emailContent = passwordResetEmail(user.getFullName(), otp)
  await sendEmail({ to: user.email, subject: emailContent.subject, html: emailContent.html })
}

export const resetPassword = async ({ email, otp, newPassword }) => {
  const user = await User.findOne({ email: email.toLowerCase() })
  if (!user) {
    throw Object.assign(new Error('Invalid or expired code'), { statusCode: 400 })
  }

  const tokenDocs = await Token.find({
    userId: user._id,
    type: 'otp',
    purpose: 'reset',
    isRevoked: false,
    expiresAt: { $gt: new Date() },
  })

  let matchingTokenId = null
  for (const tokenDoc of tokenDocs) {
    if (await bcrypt.compare(otp, tokenDoc.token)) {
      matchingTokenId = tokenDoc._id
      break
    }
  }

  if (!matchingTokenId) {
    throw Object.assign(new Error('Invalid or expired code'), { statusCode: 400 })
  }

  // Atomic compare-and-swap prevents concurrent reuse of the same reset code
  const claimed = await Token.findOneAndUpdate(
    { _id: matchingTokenId, isRevoked: false },
    { isRevoked: true }
  )
  if (!claimed) {
    throw Object.assign(new Error('Invalid or expired code'), { statusCode: 400 })
  }

  user.password = newPassword
  await user.save()

  // Revoke all refresh tokens on password reset (force re-login everywhere)
  await Token.updateMany(
    { userId: user._id, type: 'refresh', isRevoked: false },
    { isRevoked: true }
  )

  return user
}

export const googleMobileAuth = async (idToken) => {
  let ticket
  try {
    ticket = await GOOGLE_CLIENT.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    })
  } catch {
    throw Object.assign(new Error('Invalid Google token'), { statusCode: 401 })
  }

  const googlePayload = ticket.getPayload()
  if (!googlePayload?.email) {
    throw Object.assign(new Error('Invalid Google token'), { statusCode: 401 })
  }

  let user = await User.findOne({ email: googlePayload.email.toLowerCase() })

  if (!user) {
    const parts = (googlePayload.name || '').split(' ')
    user = await User.create({
      firstName: parts[0] || 'User',
      lastName: parts.slice(1).join(' ') || '',
      email: googlePayload.email.toLowerCase(),
      googleId: googlePayload.sub,
      isVerified: true,
      isActive: true,
    })
  } else if (!user.googleId) {
    await User.updateOne({ _id: user._id }, { googleId: googlePayload.sub })
  }

  if (!user.isActive) {
    throw Object.assign(new Error('Account is deactivated'), { statusCode: 401 })
  }

  await User.updateOne({ _id: user._id }, { lastLogin: new Date() })

  const payload = { userId: user._id, role: user.role }
  const accessToken = generateAccessToken(payload)
  const refreshToken = generateRefreshToken(payload)
  await storeRefreshToken(user._id, refreshToken)

  return { user: user.toJSON(), accessToken, refreshToken }
}

export const resendOTP = async (email) => {
  const user = await User.findOne({ email: email.toLowerCase() })
  if (!user) {
    throw Object.assign(new Error('User not found'), { statusCode: 404 })
  }
  if (user.isVerified) {
    throw Object.assign(new Error('Email already verified'), { statusCode: 400 })
  }

  const otp = generateOTP()
  await Token.deleteMany({ userId: user._id, type: 'otp' })
  await Token.create({
    userId: user._id,
    token: await hashOTP(otp),
    type: 'otp',
    expiresAt: new Date(Date.now() + 10 * 60 * 1000),
  })

  const emailContent = verificationEmail(user.getFullName(), otp)
  await sendEmail({ to: user.email, subject: emailContent.subject, html: emailContent.html })

  return { message: 'OTP sent' }
}

// Legacy verifyEmail path (kept for backward compat — delegates to verifyOTP)
export const verifyEmail = verifyOTP
