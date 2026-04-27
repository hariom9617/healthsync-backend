import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  refreshSchema,
  verifyOTPSchema,
  googleMobileSchema,
} from '../../validations/auth.schema.js'
import { successResponse, errorResponse } from '../../utils/response.utils.js'
import * as authService from './auth.service.js'

// Shared cookie options — HttpOnly prevents JS access, Secure enforced in prod
const refreshCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
}

const clearCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
}

export const register = async (req, res) => {
  try {
    const { error, value } = registerSchema.validate(req.body)
    if (error) {
      return errorResponse(
        res,
        400,
        'Validation failed',
        error.details.map((d) => d.message)
      )
    }

    const user = await authService.register(value)
    return successResponse(
      res,
      201,
      'Registration successful. Please check your email to verify your account.',
      user
    )
  } catch (error) {
    return errorResponse(res, error.statusCode || 500, error.message)
  }
}

export const login = async (req, res) => {
  try {
    const { error, value } = loginSchema.validate(req.body)
    if (error) {
      return errorResponse(
        res,
        400,
        'Validation failed',
        error.details.map((d) => d.message)
      )
    }

    const result = await authService.login(value)

    // Set refresh token as HttpOnly cookie — inaccessible to JavaScript
    res.cookie('refreshToken', result.refreshToken, refreshCookieOptions)

    // Return refresh token in body too for mobile clients (RN SecureStore)
    return successResponse(res, 200, 'Login successful', result)
  } catch (error) {
    return errorResponse(res, error.statusCode || 500, error.message)
  }
}

export const logout = async (req, res) => {
  try {
    // Accept token from cookie (web) or body (mobile)
    const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken

    res.clearCookie('refreshToken', clearCookieOptions)

    if (refreshToken) {
      await authService.logout(refreshToken)
    }

    return successResponse(res, 200, 'Logout successful')
  } catch (error) {
    return errorResponse(res, error.statusCode || 500, error.message)
  }
}

export const refreshToken = async (req, res) => {
  try {
    // Accept from cookie (web) or body (mobile)
    const tokenFromCookie = req.cookies?.refreshToken
    const tokenFromBody = req.body?.refreshToken

    const token = tokenFromCookie || tokenFromBody

    if (!token) {
      return errorResponse(res, 400, 'Refresh token required')
    }

    const result = await authService.refreshTokens(token)

    // Rotate cookie
    res.cookie('refreshToken', result.refreshToken, refreshCookieOptions)

    return successResponse(res, 200, 'Token refreshed', result)
  } catch (error) {
    return errorResponse(res, error.statusCode || 500, error.message)
  }
}

export const verifyOTP = async (req, res) => {
  try {
    const { error, value } = verifyOTPSchema.validate(req.body)
    if (error) {
      return errorResponse(
        res,
        400,
        'Validation failed',
        error.details.map((d) => d.message)
      )
    }

    const user = await authService.verifyOTP({ email: value.email, otp: value.otp })
    return successResponse(res, 200, 'Email verified successfully', { user })
  } catch (error) {
    return errorResponse(res, error.statusCode || 500, error.message)
  }
}

export const resendOTP = async (req, res) => {
  try {
    const { error, value } = forgotPasswordSchema.validate(req.body)
    if (error) {
      return errorResponse(
        res,
        400,
        'Validation failed',
        error.details.map((d) => d.message)
      )
    }

    const result = await authService.resendOTP(value.email)
    return successResponse(res, 200, 'OTP sent', result)
  } catch (error) {
    return errorResponse(res, error.statusCode || 500, error.message)
  }
}

export const verifyEmail = async (req, res) => {
  try {
    const { error, value } = verifyOTPSchema.validate(req.body)
    if (error) {
      return errorResponse(
        res,
        400,
        'Validation failed',
        error.details.map((d) => d.message)
      )
    }

    const user = await authService.verifyOTP({ email: value.email, otp: value.otp })
    return successResponse(res, 200, 'Email verified successfully', { user })
  } catch (error) {
    return errorResponse(res, error.statusCode || 500, error.message)
  }
}

export const forgotPassword = async (req, res) => {
  try {
    const { error, value } = forgotPasswordSchema.validate(req.body)
    if (error) {
      return errorResponse(
        res,
        400,
        'Validation failed',
        error.details.map((d) => d.message)
      )
    }

    await authService.forgotPassword(value.email)
    // Always return 200 regardless of whether the email exists (no enumeration)
    return successResponse(
      res,
      200,
      'If an account exists with that email, a password reset code has been sent.'
    )
  } catch (error) {
    return errorResponse(res, error.statusCode || 500, error.message)
  }
}

export const resetPassword = async (req, res) => {
  try {
    const { error, value } = resetPasswordSchema.validate(req.body)
    if (error) {
      return errorResponse(
        res,
        400,
        'Validation failed',
        error.details.map((d) => d.message)
      )
    }

    await authService.resetPassword({
      email: value.email,
      otp: value.otp,
      newPassword: value.password,
    })

    // Clear any existing refresh token cookie — force fresh login after password reset
    res.clearCookie('refreshToken', clearCookieOptions)

    return successResponse(res, 200, 'Password reset successfully')
  } catch (error) {
    return errorResponse(res, error.statusCode || 500, error.message)
  }
}

export const googleCallback = async (req, res) => {
  try {
    const result = await authService.googleAuthCallback(req.user)

    // Set refresh token as HttpOnly cookie — NEVER put it in the redirect URL
    res.cookie('refreshToken', result.refreshToken, {
      ...refreshCookieOptions,
      sameSite: 'lax', // 'lax' required for cross-origin OAuth redirect
    })

    // Only the short-lived access token goes in the URL
    const redirectUrl = `${process.env.CLIENT_URL}/auth/callback?accessToken=${result.accessToken}`
    return res.redirect(redirectUrl)
  } catch (error) {
    return res.redirect(`${process.env.CLIENT_URL}/auth/callback?error=authentication_failed`)
  }
}

export const googleMobile = async (req, res) => {
  try {
    const { error, value } = googleMobileSchema.validate(req.body)
    if (error) {
      return errorResponse(
        res,
        400,
        'Validation failed',
        error.details.map((d) => d.message)
      )
    }

    const result = await authService.googleMobileAuth(value.idToken)
    return successResponse(res, 200, 'Google authentication successful', result)
  } catch (error) {
    return errorResponse(res, error.statusCode || 500, error.message)
  }
}

export const getMe = async (req, res) => {
  try {
    const userJSON = req.user.toJSON()
    return successResponse(res, 200, 'User profile retrieved successfully', {
      ...userJSON,
      isOnboardingComplete: req.user.isOnboardingComplete,
    })
  } catch (error) {
    return errorResponse(res, error.statusCode || 500, error.message)
  }
}
