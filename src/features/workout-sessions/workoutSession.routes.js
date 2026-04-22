import express from 'express'
import { verifyToken } from '../../../middleware/auth.middleware.js'
import {
  startSession,
  updateProgress,
  completeSession,
  pauseSession,
  resumeSession,
  getActiveSession,
} from './workoutSession.controller.js'

const router = express.Router()

router.post('/sessions/start', verifyToken, startSession)
router.get('/sessions/active', verifyToken, getActiveSession)
router.patch('/sessions/:id/progress', verifyToken, updateProgress)
router.patch('/sessions/:id/pause', verifyToken, pauseSession)
router.patch('/sessions/:id/resume', verifyToken, resumeSession)
router.post('/sessions/:id/complete', verifyToken, completeSession)

export default router
