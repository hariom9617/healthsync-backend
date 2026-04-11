import express from 'express'
import { verifyToken } from '../middleware/auth.middleware.js'
import * as ctrl from '../src/nutrition/nutrition.controller.js'

const router = express.Router()

router.post('/meal', verifyToken, ctrl.logMeal)
router.get('/daily', verifyToken, ctrl.getDailyNutrition)
router.get('/range', verifyToken, ctrl.getNutritionRange)
router.patch('/water', verifyToken, ctrl.updateWaterIntake)
router.delete('/meal/:mealId', verifyToken, ctrl.deleteMeal)
router.get('/search', ctrl.searchFood)

export default router
