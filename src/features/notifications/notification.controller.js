import { Notification } from '../../models/Notification.model.js'
import { PushToken } from '../../models/PushToken.model.js'
import { sendPushNotification } from '../../services/push.service.js'

export const registerToken = async (req, res) => {
  try {
    const { token, platform = 'android' } = req.body

    await PushToken.findOneAndUpdate(
      { token },
      {
        userId: req.user._id,
        token,
        platform,
        active: true,
      },
      { upsert: true }
    )

    res.json({ success: true })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to register push token',
    })
  }
}

export const getNotifications = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 20
    const skip = (page - 1) * limit

    const notifications = await Notification.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)

    const unreadCount = await Notification.countDocuments({
      userId: req.user._id,
      read: false,
    })

    res.json({
      success: true,
      data: notifications,
      unreadCount,
      pagination: {
        page,
        limit,
        total: await Notification.countDocuments({ userId: req.user._id }),
      },
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications',
    })
  }
}

export const markAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params

    if (notificationId === 'all') {
      await Notification.updateMany({ userId: req.user._id, read: false }, { read: true })
    } else {
      await Notification.findOneAndUpdate(
        { _id: notificationId, userId: req.user._id },
        { read: true }
      )
    }

    res.json({ success: true })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to mark notification as read',
    })
  }
}

export const deleteNotification = async (req, res) => {
  try {
    const { notificationId } = req.params

    const notification = await Notification.findOneAndDelete({
      _id: notificationId,
      userId: req.user._id,
    })

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found',
      })
    }

    res.json({ success: true })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete notification',
    })
  }
}

export const sendTestNotification = async (req, res) => {
  try {
    const notification = await sendPushNotification({
      userId: req.user._id,
      title: 'Test Notification',
      body: 'HealthSync push notifications working!',
      type: 'system',
    })

    res.json({ success: true, data: notification })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to send test notification',
    })
  }
}
