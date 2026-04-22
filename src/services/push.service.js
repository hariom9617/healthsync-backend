import { Notification } from '../models/Notification.model.js'
import { PushToken } from '../models/PushToken.model.js'
import { emitNotificationToUser } from '../socket/index.js'

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send'

const getChannelId = (type) => {
  if (['workout_reminder', 'water_reminder', 'step_target'].includes(type)) {
    return 'reminders'
  }
  if (['goal_milestone', 'achievement'].includes(type)) {
    return 'achievements'
  }
  return 'default'
}

export const sendPushNotification = async ({ userId, title, body, type, data = {} }) => {
  try {
    // 1. Save Notification to DB first
    const notification = await Notification.create({
      userId,
      title,
      body,
      type,
      data,
    })

    // 2. Find all PushToken where { userId, active: true }
    const pushTokens = await PushToken.find({ userId, active: true })

    // 3. If no tokens, return the notification
    if (pushTokens.length === 0) {
      // eslint-disable-next-line no-console
      console.log(`No active push tokens found for user ${userId}`)
      return notification
    }

    // 4. Build messages array
    const messages = pushTokens.map((token) => ({
      to: token.token,
      sound: 'default',
      title,
      body,
      data: {
        type,
        notificationId: notification._id.toString(),
        ...data,
      },
      channelId: getChannelId(type),
    }))

    // 5. POST to EXPO_PUSH_URL
    const response = await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(messages),
    })

    const responseData = await response.json()

    // 6. Parse response and handle DeviceNotRegistered errors
    if (responseData.data) {
      const tokensToDeactivate = []

      responseData.data.forEach((result, index) => {
        if (result.status === 'error' && result.details?.error === 'DeviceNotRegistered') {
          tokensToDeactivate.push(pushTokens[index]._id)
        }
      })

      if (tokensToDeactivate.length > 0) {
        await PushToken.updateMany({ _id: { $in: tokensToDeactivate } }, { active: false })
        // eslint-disable-next-line no-console
        console.log(`Deactivated ${tokensToDeactivate.length} invalid push tokens`)
      }
    }

    // 7. Update notification: sent: true, sentAt: new Date()
    await Notification.findByIdAndUpdate(notification._id, {
      sent: true,
      sentAt: new Date(),
    })

    // 8. Emit notification to online users
    emitNotificationToUser(userId, notification)

    return notification
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error sending push notification:', error)
    throw error
  }
}

export const sendToMultipleUsers = async (userIds, { title, body, type, data }) => {
  const promises = userIds.map((userId) =>
    sendPushNotification({ userId, title, body, type, data })
  )

  const results = await Promise.allSettled(promises)

  return results.map((result, index) => ({
    userId: userIds[index],
    success: result.status === 'fulfilled',
    notification: result.status === 'fulfilled' ? result.value : null,
    error: result.status === 'rejected' ? result.reason : null,
  }))
}
