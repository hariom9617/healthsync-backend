import express from 'express'
import Joi from 'joi'
import { verifyToken } from '../../../middleware/auth.middleware.js'
import { sendPushNotification } from '../../services/push.service.js'
import { buildUserHealthContext } from './context.builder.js'

const router = express.Router()

// Validate AI_SERVICE_URL is localhost or a trusted host — block SSRF via env injection
const RAW_AI_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000'
let AI_SERVICE_URL
try {
  const parsed = new URL(RAW_AI_URL)
  if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error('bad protocol')
  AI_SERVICE_URL = RAW_AI_URL
} catch {
  console.error('Invalid AI_SERVICE_URL — falling back to localhost')
  AI_SERVICE_URL = 'http://localhost:8000'
}

async function fetchWithTimeout(url, options, timeoutMs = 10000) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    return await fetch(url, { ...options, signal: controller.signal })
  } finally {
    clearTimeout(timer)
  }
}

const chatSchema = Joi.object({
  message: Joi.string().max(4000).required(),
  conversationHistory: Joi.array()
    .items(
      Joi.object({
        role: Joi.string().valid('user', 'assistant').required(),
        content: Joi.string().max(4000).required(),
      })
    )
    .max(50)
    .default([]),
})

const symptomsSchema = Joi.object({
  symptoms: Joi.string().max(2000).required(),
})

const workoutPlanSchema = Joi.object({
  goals: Joi.array().items(Joi.string().max(100)).max(10).required(),
  experienceLevel: Joi.string().valid('beginner', 'intermediate', 'advanced').required(),
  availableDays: Joi.number().integer().min(1).max(7).required(),
  sessionDuration: Joi.number().integer().min(15).max(180).required(),
})

const insightsSchema = Joi.object({
  weeklyStats: Joi.object().required(),
})

function validateBody(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, { abortEarly: false })
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: error.details.map((d) => d.message),
      })
    }
    req.body = value
    next()
  }
}

router.post('/chat', verifyToken, validateBody(chatSchema), async (req, res) => {
  try {
    const { message, conversationHistory = [] } = req.body
    const userContext = await buildUserHealthContext(req.user._id)

    const response = await fetchWithTimeout(`${AI_SERVICE_URL}/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        user_context: userContext,
        conversation_history: conversationHistory,
      }),
    })

    if (!response.ok) {
      return res.status(502).json({ success: false, message: 'AI service unavailable' })
    }
    const data = await response.json()
    res.json(data)
  } catch (error) {
    console.error('AI Chat Error:', error)
    res.status(500).json({
      success: false,
      message: 'AI service unavailable',
    })
  }
})

// SSE streaming proxy
router.post('/chat/stream', verifyToken, validateBody(chatSchema), async (req, res) => {
  try {
    const { message, conversationHistory = [] } = req.body
    const userContext = await buildUserHealthContext(req.user._id)

    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')

    const response = await fetchWithTimeout(`${AI_SERVICE_URL}/ai/chat/stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        user_context: userContext,
        conversation_history: conversationHistory,
      }),
    })

    if (response.body) {
      response.body.pipe(res)
    } else {
      res.end()
    }
  } catch (error) {
    console.error('AI Chat Stream Error:', error)
    res.status(500).json({
      success: false,
      message: 'AI streaming service unavailable',
    })
  }
})

router.post('/symptoms', verifyToken, validateBody(symptomsSchema), async (req, res) => {
  try {
    const { symptoms } = req.body
    const userContext = await buildUserHealthContext(req.user._id)

    const response = await fetchWithTimeout(`${AI_SERVICE_URL}/ai/symptoms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        symptoms,
        user_context: userContext,
      }),
    })

    if (!response.ok) {
      return res.status(502).json({ success: false, message: 'AI symptoms service unavailable' })
    }
    const data = await response.json()
    res.json(data)
  } catch (error) {
    console.error('AI Symptoms Error:', error)
    res.status(500).json({
      success: false,
      message: 'AI symptoms service unavailable',
    })
  }
})

router.post('/workout-plan', verifyToken, validateBody(workoutPlanSchema), async (req, res) => {
  try {
    const { goals, experienceLevel, availableDays, sessionDuration } = req.body
    const userContext = await buildUserHealthContext(req.user._id)

    const response = await fetchWithTimeout(`${AI_SERVICE_URL}/ai/workout-plan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_context: userContext,
        goals,
        experience_level: experienceLevel,
        available_days: availableDays,
        session_duration: sessionDuration,
      }),
    })

    if (!response.ok) {
      return res
        .status(502)
        .json({ success: false, message: 'AI workout plan service unavailable' })
    }
    const data = await response.json()
    res.json(data)
  } catch (error) {
    console.error('AI Workout Plan Error:', error)
    res.status(500).json({
      success: false,
      message: 'AI workout plan service unavailable',
    })
  }
})

router.post('/insights', verifyToken, validateBody(insightsSchema), async (req, res) => {
  try {
    const { weeklyStats } = req.body
    const userContext = await buildUserHealthContext(req.user._id)

    const response = await fetchWithTimeout(`${AI_SERVICE_URL}/ai/insights`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        weekly_stats: weeklyStats,
        user_context: userContext,
      }),
    })

    if (!response.ok) {
      return res.status(502).json({ success: false, message: 'AI insights service unavailable' })
    }
    const data = await response.json()

    // Send notification for successful insights generation
    if (data.success && data.data?.insights?.length > 0) {
      await sendPushNotification({
        userId: req.user._id,
        title: 'Your Weekly Insights Are Ready',
        body: 'HealthSync AI has analyzed your health data. Tap to view personalized insights.',
        type: 'ai_insight',
        data: { insightsCount: data.data.insights.length },
      })
    }

    res.json(data)
  } catch (error) {
    console.error('AI Insights Error:', error)
    res.status(500).json({
      success: false,
      message: 'AI insights service unavailable',
    })
  }
})

export default router
