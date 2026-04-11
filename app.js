import dotenv from 'dotenv'
import express from 'express'
import helmet from 'helmet'
import cors from 'cors'
import rateLimit from 'express-rate-limit'
import mongoSanitize from 'express-mongo-sanitize'
import xssClean from 'xss-clean'
import morgan from 'morgan'
import cookieParser from 'cookie-parser'
import passport from './config/passport.js'
import { config } from './config/env.js'
import { registerRoutes } from './routes/index.js'
import { errorHandler } from './middleware/error.middleware.js'

dotenv.config()

const app = express()

app.use(helmet())

app.use(
  cors({
    origin: config.clientUrl,
    credentials: true,
  })
)

app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())

if (config.nodeEnv === 'development') {
  app.use(morgan('dev'))
}

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
})

app.use('/api/auth/*', authLimiter)

app.use(mongoSanitize())
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
