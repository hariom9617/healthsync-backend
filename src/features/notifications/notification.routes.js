import express from 'express'
import { verifyToken } from '../../../middleware/auth.middleware.js'
import {
  registerToken,
  getNotifications,
  markAsRead,
  deleteNotification,
  sendTestNotification,
} from './notification.controller.js'

const router = express.Router()

router.post('/register-token', verifyToken, registerToken)
router.get('/', verifyToken, getNotifications)
router.patch('/:notificationId/read', verifyToken, markAsRead)
router.delete('/:notificationId', verifyToken, deleteNotification)
router.post('/test', verifyToken, sendTestNotification)

export default router
