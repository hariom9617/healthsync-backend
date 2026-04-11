import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  refreshSchema,
} from '../../validations/auth.schema.js'
import { successResponse, errorResponse } from '../../utils/response.utils.js'
import { logAudit } from '../../middleware/audit.middleware.js'
import * as authService from './auth.service.js'

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
    return successResponse(res, 200, 'Login successful', result)
  } catch (error) {
    return errorResponse(res, error.statusCode || 500, error.message)
  }
}

export const logout = async (req, res) => {
  try {
    const { refreshToken } = req.body
    if (!refreshToken) {
      return errorResponse(res, 400, 'Refresh token required')
    }

    await authService.logout(refreshToken)
    return successResponse(res, 200, 'Logout successful')
  } catch (error) {
    return errorResponse(res, error.statusCode || 500, error.message)
  }
}

export const refreshToken = async (req, res) => {
  try {
    const { error, value } = refreshSchema.validate(req.body)
    if (error) {
      return errorResponse(
        res,
        400,
        'Validation failed',
        error.details.map((d) => d.message)
      )
    }

    const result = await authService.refreshTokens(value.refreshToken)
    return successResponse(res, 200, 'Tokens refreshed successfully', result)
  } catch (error) {
    return errorResponse(res, error.statusCode || 500, error.message)
  }
}

export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params
    if (!token) {
      return errorResponse(res, 400, 'Verification token required')
    }

    const user = await authService.verifyEmail(token)
    return successResponse(res, 200, 'Email verified successfully', user.toJSON())
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
    return successResponse(
      res,
      200,
      'If an account exists, a password reset link has been sent to your email'
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

    await authService.resetPassword(value.token, value.password)
    return successResponse(res, 200, 'Password reset successfully')
  } catch (error) {
    return errorResponse(res, error.statusCode || 500, error.message)
  }
}

export const googleCallback = async (req, res) => {
  try {
    const result = await authService.googleAuthCallback(req.user)
    const redirectUrl = `${process.env.CLIENT_URL}/auth/callback?accessToken=${result.accessToken}&refreshToken=${result.refreshToken}`
    return res.redirect(redirectUrl)
  } catch (error) {
    const redirectUrl = `${process.env.CLIENT_URL}/auth/callback?error=authentication_failed`
    return res.redirect(redirectUrl)
  }
}

export const getMe = async (req, res) => {
  try {
    return successResponse(res, 200, 'User profile retrieved successfully', req.user.toJSON())
  } catch (error) {
    return errorResponse(res, error.statusCode || 500, error.message)
  }
}
