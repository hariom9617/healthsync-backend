import express from 'express'
import { verifyToken } from '../../../middleware/auth.middleware.js'
import { scanFood, getFoodSuggestions } from './foodScanner.controller.js'

const router = express.Router()

router.post('/scan', verifyToken, scanFood)
router.get('/suggestions', verifyToken, getFoodSuggestions)

export default router
