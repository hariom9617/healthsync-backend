import dotenv from 'dotenv'
import express from 'express'
import cors from 'cors'
import xssClean from 'xss-clean'
import morgan from 'morgan'
import cookieParser from 'cookie-parser'
import passport from './config/passport.js'
import { config } from './config/env.js'
import { registerRoutes } from './routes/index.js'
import { errorHandler } from './middleware/error.middleware.js'
import { applyPreBodyMiddleware, applyPostBodyMiddleware } from './src/middleware/security.js'

dotenv.config()

const app = express()
app.set('trust proxy', 1)

// ── Phase 1: pre-body middleware (helmet, request ID, rate limiters) ──────────
// These run before body parsing so rate limiting is cheaper (no body allocated yet)
applyPreBodyMiddleware(app)

app.use((req, res, next) => {
  res.setHeader('ngrok-skip-browser-warning', 'true')
  next()
})

// Only allow localhost origins in non-production environments
const localhostPatterns =
  config.nodeEnv !== 'production'
    ? [/^http:\/\/localhost/, /^http:\/\/10\./, /^http:\/\/192\.168\./]
    : []

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true)
      const allowed = [
        config.clientUrl,
        /\.ngrok-free\.app$/,
        /\.ngrok-free\.dev$/,
        /\.ngrok\.io$/,
        ...localhostPatterns,
      ]
      const isAllowed = allowed.some((pattern) =>
        pattern instanceof RegExp ? pattern.test(origin) : origin === pattern
      )
      callback(null, isAllowed)
    },
    credentials: true,
  })
)

// ── Phase 2: body parsing ─────────────────────────────────────────────────────
// 256kb is sufficient for all health data payloads; 10mb was a DoS risk
app.use(express.json({ limit: '256kb' }))
app.use(express.urlencoded({ extended: true, limit: '256kb' }))
app.use(cookieParser())

// ── Phase 3: post-body middleware (HPP, mongo-sanitize, XSS) ─────────────────
// Must run AFTER body parsing so req.body is populated for inspection
applyPostBodyMiddleware(app)
app.use(xssClean())

// Prevent health/personal data from being cached by browsers or proxies
app.use('/api', (req, res, next) => {
  res.setHeader('Cache-Control', 'private, no-store, no-cache')
  res.setHeader('Pragma', 'no-cache')
  next()
})

if (config.nodeEnv === 'development') {
  app.use(morgan('dev'))
}

app.use(passport.initialize())

registerRoutes(app)

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.use('*', (req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' })
})

app.use(errorHandler)

export default app
