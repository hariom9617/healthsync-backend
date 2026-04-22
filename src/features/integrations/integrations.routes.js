import express from 'express'
import { verifyToken } from '../../../middleware/auth.middleware.js'
import {
  getIntegrationStatus,
  triggerSync,
  updateIntegrationSettings,
  connectHealthConnect,
  disconnectHealthConnect,
  getSyncHistory,
} from './integrations.controller.js'

const router = express.Router()

router.get('/status', verifyToken, getIntegrationStatus)
router.post('/sync', verifyToken, triggerSync)
router.patch('/settings', verifyToken, updateIntegrationSettings)
router.post('/connect', verifyToken, connectHealthConnect)
router.post('/disconnect', verifyToken, disconnectHealthConnect)
router.get('/sync-history', verifyToken, getSyncHistory)

export default router
