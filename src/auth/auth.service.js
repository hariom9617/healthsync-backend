import bcrypt from 'bcryptjs'
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

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export const register = async ({ name, firstName, lastName, email, password, consent }) => {
  const existingUser = await User.findOne({ email: email.toLowerCase() })
  if (existingUser) {
    throw Object.assign(new Error('Email already registered'), { statusCode: 409 })
  }

  // Handle both name formats
  let userFirstName = firstName
  let userLastName = lastName

  if (name && !firstName && !lastName) {
    const nameParts = name.trim().split(' ')
    userFirstName = nameParts[0] || name
    userLastName = nameParts.slice(1).join(' ') || ''
  }

  const user = await User.create({
    firstName: userFirstName,
    lastName: userLastName,
    email: email.toLowerCase(),
    password,
    consent: {
      ...consent,
      consentDate: new Date(),
    },
  })

  const otp = generateOTP()

  await Token.deleteMany({ userId: user._id, type: 'otp' })

  await Token.create({
    userId: user._id,
    token: otp,
    type: 'otp',
    expiresAt: new Date(Date.now() + 10 * 60 * 1000),
  })

  const emailContent = verificationEmail(user.getFullName(), otp)
  await sendEmail({
    to: user.email,
    subject: emailContent.subject,
    html: emailContent.html,
  })

  return user.toJSON()
}

export const login = async ({ email, password }) => {
  const user = await User.findOne({ email: email.toLowerCase() }).select('+password')

  if (!user) {
    throw Object.assign(new Error('Invalid credentials'), { statusCode: 401 })
  }

  if (!user.password) {
    throw Object.assign(new Error('Please use OAuth login'), { statusCode: 401 })
  }

  const isPasswordValid = await user.comparePassword(password)
  if (!isPasswordValid) {
    throw Object.assign(new Error('Invalid credentials'), { statusCode: 401 })
  }

  // if (!user.isVerified) {
  //   throw Object.assign(new Error('Please verify your email first'), { statusCode: 401 })
  // }

  if (!user.isActive) {
    throw Object.assign(new Error('Account is deactivated'), { statusCode: 401 })
  }

  user.lastLogin = new Date()
  await user.save()

  const payload = { userId: user._id, role: user.role }
  const accessToken = generateAccessToken(payload)
  const refreshToken = generateRefreshToken(payload)

  await Token.create({
    userId: user._id,
    token: refreshToken,
    type: 'refresh',
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  })

  const userJSON = user.toJSON()
  return {
    user: {
      ...userJSON,
      isOnboardingComplete: user.isOnboardingComplete,
    },
    accessToken,
    refreshToken,
  }
}

export const googleAuthCallback = async (googleProfile) => {
  const user = googleProfile

  const payload = { userId: user._id, role: user.role }
  const accessToken = generateAccessToken(payload)
  const refreshToken = generateRefreshToken(payload)

  await Token.create({
    userId: user._id,
    token: refreshToken,
    type: 'refresh',
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  })

  return {
    user: user.toJSON(),
    accessToken,
    refreshToken,
  }
}

export const refreshTokens = async (refreshToken) => {
  const decoded = verifyRefreshToken(refreshToken)

  const tokenDoc = await Token.findOne({
    token: refreshToken,
    userId: decoded.userId,
    type: 'refresh',
    isRevoked: false,
    expiresAt: { $gt: new Date() },
  })

  if (!tokenDoc) {
    throw Object.assign(new Error('Invalid refresh token'), { statusCode: 401 })
  }

  tokenDoc.isRevoked = true
  await tokenDoc.save()

  const user = await User.findById(decoded.userId)
  if (!user || !user.isActive) {
    throw Object.assign(new Error('User not found or inactive'), { statusCode: 401 })
  }

  const payload = { userId: user._id, role: user.role }
  const newAccessToken = generateAccessToken(payload)
  const newRefreshToken = generateRefreshToken(payload)

  await Token.create({
    userId: user._id,
    token: newRefreshToken,
    type: 'refresh',
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  })

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  }
}

export const logout = async (refreshToken) => {
  const tokenDoc = await Token.findOne({ token: refreshToken, type: 'refresh' })

  if (tokenDoc) {
    tokenDoc.isRevoked = true
    await tokenDoc.save()
  }
}

export const verifyEmail = async (token) => {
  const tokens = await Token.find({
    type: 'verification',
    isRevoked: false,
    expiresAt: { $gt: new Date() },
  })

  let matchingToken = null
  for (const tokenDoc of tokens) {
    const isMatch = await bcrypt.compare(token, tokenDoc.token)
    if (isMatch) {
      matchingToken = tokenDoc
      break
    }
  }

  if (!matchingToken) {
    throw Object.assign(new Error('Invalid or expired verification token'), { statusCode: 400 })
  }

  const user = await User.findById(matchingToken.userId)
  if (!user) {
    throw Object.assign(new Error('User not found'), { statusCode: 404 })
  }

  user.isVerified = true
  await user.save()

  await Token.deleteOne({ _id: matchingToken._id })

  return user
}

export const verifyOTP = async ({ email, otp }) => {
  const user = await User.findOne({ email: email.toLowerCase() })

  if (!user) {
    throw Object.assign(new Error('User not found'), { statusCode: 404 })
  }

  const tokenDoc = await Token.findOne({
    userId: user._id,
    type: 'otp',
    token: otp,
    isRevoked: false,
    expiresAt: { $gt: new Date() },
  })

  if (!tokenDoc) {
    throw Object.assign(new Error('Invalid or expired OTP'), { statusCode: 400 })
  }

  user.isVerified = true
  await user.save()

  tokenDoc.isRevoked = true
  await tokenDoc.save()

  const emailContent = welcomeEmail(user.getFullName())
  await sendEmail({
    to: user.email,
    subject: emailContent.subject,
    html: emailContent.html,
  })

  return user
}

export const forgotPassword = async (email) => {
  const user = await User.findOne({ email: email.toLowerCase() })

  if (!user) {
    throw Object.assign(new Error('If an account exists, a reset link has been sent'), {
      statusCode: 200,
    })
  }

  const otp = generateOTP()

  await Token.deleteMany({ userId: user._id, type: 'otp', purpose: 'reset' })

  await Token.create({
    userId: user._id,
    token: otp,
    type: 'otp',
    purpose: 'reset',
    expiresAt: new Date(Date.now() + 10 * 60 * 1000),
  })

  const emailContent = passwordResetEmail(user.getFullName(), otp)

  await sendEmail({
    to: user.email,
    subject: emailContent.subject,
    html: emailContent.html,
  })
}

export const resetPassword = async ({ email, otp, newPassword }) => {
  const user = await User.findOne({ email: email.toLowerCase() })

  if (!user) {
    throw Object.assign(new Error('User not found'), { statusCode: 404 })
  }

  const tokenDoc = await Token.findOne({
    userId: user._id,
    type: 'otp',
    token: otp,
    purpose: 'reset',
    isRevoked: false,
    expiresAt: { $gt: new Date() },
  })

  if (!tokenDoc) {
    throw Object.assign(new Error('Invalid or expired code'), { statusCode: 400 })
  }

  user.password = newPassword
  await user.save()

  tokenDoc.isRevoked = true
  await tokenDoc.save()

  return user
}

export const googleMobileAuth = async (idToken) => {
  // For now, we'll implement a basic verification
  // In production, you should use Google's OAuth2 client library to verify the token
  try {
    // This is a simplified version - in production, verify the token with Google
    const decoded = JSON.parse(Buffer.from(idToken.split('.')[1], 'base64').toString())

    if (!decoded.email) {
      throw Object.assign(new Error('Invalid token'), { statusCode: 401 })
    }

    let user = await User.findOne({ email: decoded.email.toLowerCase() })

    if (!user) {
      // Create new user from Google data
      const nameParts = (decoded.name || '').split(' ')
      user = await User.create({
        firstName: nameParts[0] || 'User',
        lastName: nameParts.slice(1).join(' ') || '',
        email: decoded.email.toLowerCase(),
        googleId: decoded.sub,
        isVerified: true,
        isActive: true,
      })
    } else if (!user.googleId) {
      // Link Google account to existing user
      user.googleId = decoded.sub
      await user.save()
    }

    if (!user.isActive) {
      throw Object.assign(new Error('Account is deactivated'), { statusCode: 401 })
    }

    user.lastLogin = new Date()
    await user.save()

    const payload = { userId: user._id, role: user.role }
    const accessToken = generateAccessToken(payload)
    const refreshToken = generateRefreshToken(payload)

    await Token.create({
      userId: user._id,
      token: refreshToken,
      type: 'refresh',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    })

    return {
      user: user.toJSON(),
      accessToken,
      refreshToken,
    }
  } catch (error) {
    throw Object.assign(new Error('Invalid Google token'), { statusCode: 401 })
  }
}

export const resendOTP = async (email) => {
  const user = await User.findOne({ email: email.toLowerCase() })

  if (!user) {
    throw Object.assign(new Error('User not found'), { statusCode: 404 })
  }

  if (user.isVerified) {
    throw Object.assign(new Error('Email already verified'), { statusCode: 400 })
  }

  await Token.deleteMany({ userId: user._id, type: 'otp' })

  const otp = generateOTP()

  await Token.create({
    userId: user._id,
    token: otp,
    type: 'otp',
    expiresAt: new Date(Date.now() + 10 * 60 * 1000),
  })

  const emailContent = verificationEmail(user.getFullName(), otp)
  await sendEmail({
    to: user.email,
    subject: emailContent.subject,
    html: emailContent.html,
  })

  return { message: 'OTP sent' }
}
