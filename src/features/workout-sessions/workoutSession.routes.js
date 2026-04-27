import express from 'express'
import { verifyToken } from '../../../middleware/auth.middleware.js'
import {
  getActiveSession,
  startWorkoutSession,
  updateSessionProgress,
  completeWorkoutSession,
  getSessionHistory,
} from './workoutSession.controller.js'

const router = express.Router()

router.get('/active', verifyToken, getActiveSession)
router.get('/history', verifyToken, getSessionHistory)
router.post('/start', verifyToken, startWorkoutSession)
router.patch('/:id/progress', verifyToken, updateSessionProgress)
router.post('/:id/complete', verifyToken, completeWorkoutSession)

export default router
