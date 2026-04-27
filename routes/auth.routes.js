import express from 'express'
import passport from '../config/passport.js'
import { verifyToken } from '../middleware/auth.middleware.js'
import { logAudit } from '../middleware/audit.middleware.js'
import { otpLimiter } from '../src/middleware/security.js'
import * as authController from '../src/auth/auth.controller.js'

const router = express.Router()

router.post('/register', logAudit('register', 'user'), authController.register)
router.post('/login', logAudit('login', 'user'), authController.login)
router.post('/logout', logAudit('logout', 'user'), authController.logout)
router.post('/refresh-token', authController.refreshToken)
router.post('/verify-otp', otpLimiter, logAudit('verify_otp', 'user'), authController.verifyOTP)
router.post('/resend-otp', otpLimiter, logAudit('resend_otp', 'user'), authController.resendOTP)
router.post('/forgot-password', logAudit('forgot_password', 'user'), authController.forgotPassword)
router.post('/reset-password', logAudit('reset_password', 'user'), authController.resetPassword)

router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }))
router.get(
  '/google/callback',
  passport.authenticate('google', {
    session: false,
    failureRedirect: `${process.env.CLIENT_URL}/auth/failure`,
  }),
  authController.googleCallback
)

router.post('/google/mobile', logAudit('google_login', 'user'), authController.googleMobile)
router.get('/me', verifyToken, authController.getMe)

export default router
