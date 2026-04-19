import express from 'express'
import { verifyToken } from '../../../middleware/auth.middleware.js'
import { buildUserHealthContext } from './context.builder.js'

const router = express.Router()
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000'

router.post('/chat', verifyToken, async (req, res) => {
  try {
    const { message, conversationHistory = [] } = req.body
    const userContext = await buildUserHealthContext(req.user._id)

    const response = await fetch(`${AI_SERVICE_URL}/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        user_context: userContext,
        conversation_history: conversationHistory,
      }),
    })

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
router.post('/chat/stream', verifyToken, async (req, res) => {
  try {
    const { message, conversationHistory = [] } = req.body
    const userContext = await buildUserHealthContext(req.user._id)

    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')

    const response = await fetch(`${AI_SERVICE_URL}/ai/chat/stream`, {
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

router.post('/symptoms', verifyToken, async (req, res) => {
  try {
    const { symptoms } = req.body
    const userContext = await buildUserHealthContext(req.user._id)

    const response = await fetch(`${AI_SERVICE_URL}/ai/symptoms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        symptoms,
        user_context: userContext,
      }),
    })

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

router.post('/workout-plan', verifyToken, async (req, res) => {
  try {
    const { goals, experienceLevel, availableDays, sessionDuration } = req.body
    const userContext = await buildUserHealthContext(req.user._id)

    const response = await fetch(`${AI_SERVICE_URL}/ai/workout-plan`, {
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

router.post('/insights', verifyToken, async (req, res) => {
  try {
    const { weeklyStats } = req.body
    const userContext = await buildUserHealthContext(req.user._id)

    const response = await fetch(`${AI_SERVICE_URL}/ai/insights`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        weekly_stats: weeklyStats,
        user_context: userContext,
      }),
    })

    const data = await response.json()
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
