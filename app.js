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
import { applySecurityMiddleware } from './src/middleware/security.js'

dotenv.config()

const app = express()
app.set('trust proxy', 1)

// Phase 7: comprehensive security hardening (helmet, rate limiters, hpp, mongo-sanitize, X-Request-ID)
applySecurityMiddleware(app)

app.use((req, res, next) => {
  res.setHeader('ngrok-skip-browser-warning', 'true')
  next()
})

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true)
      const allowed = [
        config.clientUrl,
        /\.ngrok-free\.app$/,
        /\.ngrok-free\.dev$/,
        /\.ngrok\.io$/,
        /^http:\/\/localhost/,
        /^http:\/\/10\./,
        /^http:\/\/192\.168\./,
      ]
      const isAllowed = allowed.some((pattern) =>
        pattern instanceof RegExp ? pattern.test(origin) : origin === pattern
      )
      callback(null, isAllowed)
    },
    credentials: true,
  })
)

app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())

if (config.nodeEnv === 'development') {
  app.use(morgan('dev'))
}

app.use(xssClean())

app.use(passport.initialize())

registerRoutes(app)

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  })
})

app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  })
})

app.use(errorHandler)

export default app
