import express from 'express'
import { verifyToken } from '../../../middleware/auth.middleware.js'
import {
  getDailySummary,
  getMealsByDate,
  logMeal,
  deleteMeal,
  getNutritionTip,
} from './nutrition.controller.js'

const router = express.Router()

router.get('/daily-summary', verifyToken, getDailySummary)
router.get('/meals', verifyToken, getMealsByDate)
router.post('/meals', verifyToken, logMeal)
router.delete('/meals/:id', verifyToken, deleteMeal)
router.post('/ai/nutrition-tip', verifyToken, getNutritionTip)

export default router
