import express from 'express'
import { verifyToken } from '../middleware/auth.middleware.js'
import * as ctrl from '../src/workout/workout.controller.js'

const router = express.Router()

router.post('/', verifyToken, ctrl.logWorkout)
router.get('/', verifyToken, ctrl.getWorkouts)
router.get('/stats', verifyToken, ctrl.getWorkoutStats)
router.get('/:workoutId', verifyToken, ctrl.getWorkoutById)
router.patch('/:workoutId', verifyToken, ctrl.updateWorkout)
router.delete('/:workoutId', verifyToken, ctrl.deleteWorkout)

export default router
