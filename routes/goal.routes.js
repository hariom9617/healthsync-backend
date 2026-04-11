import express from 'express'
import { verifyToken } from '../middleware/auth.middleware.js'
import * as ctrl from '../src/goal/goal.controller.js'

const router = express.Router()

router.get('/public', ctrl.getPublicGoals)
router.post('/', verifyToken, ctrl.createGoal)
router.get('/', verifyToken, ctrl.getGoals)
router.get('/:goalId', verifyToken, ctrl.getGoalById)
router.patch('/:goalId/progress', verifyToken, ctrl.updateProgress)
router.patch('/:goalId', verifyToken, ctrl.updateGoal)
router.delete('/:goalId', verifyToken, ctrl.deleteGoal)

export default router
