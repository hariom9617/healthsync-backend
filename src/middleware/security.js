import { rateLimit } from 'express-rate-limit'
import helmet from 'helmet'
import hpp from 'hpp'
import mongoSanitize from 'express-mongo-sanitize'
import { v4 as uuidv4 } from 'uuid'

// ── Helmet: full security header suite ───────────────────────────────────────

export const helmetMiddleware = helmet({
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true,
  },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      frameSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  xContentTypeOptions: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  crossOriginEmbedderPolicy: false, // allow CDN assets in health dashboard
})

// ── Rate limiters (separate per route group) ─────────────────────────────────

export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' },
})

// Auth routes: strict — 5 per 15 min, successful requests don't count
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: {
    success: false,
    message: 'Too many authentication attempts. Please wait 15 minutes.',
  },
})

// AI routes: 10 per minute (token-expensive)
export const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'AI request limit reached. Slow down.' },
})

// Upload / scan routes: 20 per minute
export const uploadLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Upload limit reached. Please wait a moment.' },
})

// OTP endpoints: 3 per 15 min — tight limit to slow brute force on 6-digit codes
export const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many OTP attempts. Please wait 15 minutes.',
  },
})

// ── Request tracing ───────────────────────────────────────────────────────────

export const requestIdMiddleware = (req, res, next) => {
  req.requestId = uuidv4()
  res.setHeader('X-Request-ID', req.requestId)
  next()
}

// ── HPP + Mongo sanitize ──────────────────────────────────────────────────────

export const hppMiddleware = hpp()

export const mongoSanitizeMiddleware = mongoSanitize({
  replaceWith: '_',
  allowDots: false,
})

// ── Phase 1: runs BEFORE body parsing (helmet, tracing, rate limits) ─────────

export function applyPreBodyMiddleware(app) {
  app.use(helmetMiddleware)
  app.use(requestIdMiddleware)
  app.use(globalLimiter)
  app.use('/api/auth', authLimiter)
  app.use('/api/ai', aiLimiter)
  app.use('/api/food-scanner', uploadLimiter)
  app.use('/api/integrations', uploadLimiter)
}

// ── Phase 2: runs AFTER body parsing (HPP, mongo-sanitize inspect req.body) ──

export function applyPostBodyMiddleware(app) {
  app.use(hppMiddleware)
  app.use(mongoSanitizeMiddleware)
}
