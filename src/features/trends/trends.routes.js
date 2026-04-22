import express from 'express'
import { verifyToken } from '../../../middleware/auth.middleware.js'
import { getWeeklySummary, getStreaks, exportMonthlyData } from './trends.controller.js'

const router = express.Router()

router.get('/weekly-summary', verifyToken, getWeeklySummary)
router.get('/streaks', verifyToken, getStreaks)
router.get('/export/monthly', verifyToken, exportMonthlyData)

export default router
