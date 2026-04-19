import { Router } from 'express'
import { verifyToken } from '../middleware/auth.middleware.js'
import {
  saveStep1,
  saveStep2,
  saveStep3,
  completeOnboarding,
  getOnboardingStatus,
} from '../src/onboarding/onboarding.controller.js'

const router = Router()

router.use(verifyToken)

router.get('/', getOnboardingStatus)
router.post('/step-1', saveStep1)
router.post('/step-2', saveStep2)
router.post('/step-3', saveStep3)
router.patch('/complete', completeOnboarding)

export default router
