import express from 'express'
import { verifyToken } from '../../../middleware/auth.middleware.js'
import {
  browseWorkouts,
  getRecommendedWorkouts,
  getWorkoutById,
} from './workoutLibrary.controller.js'

const router = express.Router()

router.get('/library', verifyToken, browseWorkouts)
router.get('/library/recommended', verifyToken, getRecommendedWorkouts)
router.get('/library/:id', verifyToken, getWorkoutById)

export default router
