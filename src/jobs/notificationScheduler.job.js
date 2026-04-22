import cron from 'node-cron'
import User from '../../models/User.model.js'
import HealthMetric from '../../models/HealthMetric.model.js'
import { sendPushNotification } from '../services/push.service.js'

export const startNotificationScheduler = () => {
  try {
    // 1. Water reminder - every 2hrs 8am-8pm UTC
    cron.schedule('0 8,10,12,14,16,18,20 * * *', async () => {
      try {
        const users = await User.find({ 'settings.waterReminders': true, isActive: true })

        for (const user of users) {
          await sendPushNotification({
            userId: user._id,
            title: 'Hydration Reminder',
            body: 'Time to drink water! Staying hydrated improves performance.',
            type: 'water_reminder',
          })
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Water reminder job error:', error)
      }
    })

    // 2. Step target check - 8pm UTC daily
    cron.schedule('0 20 * * *', async () => {
      try {
        const users = await User.find({ isActive: true })

        for (const user of users) {
          const today = new Date()
          today.setUTCHours(0, 0, 0, 0)

          const todaySteps = await HealthMetric.findOne({
            userId: user._id,
            type: 'steps',
            recordedAt: { $gte: today },
          }).sort({ recordedAt: -1 })

          const currentSteps = todaySteps?.value || 0
          const stepGoal = user.healthProfile?.dailyStepGoal || 10000

          if (currentSteps < stepGoal) {
            const remaining = stepGoal - currentSteps
            await sendPushNotification({
              userId: user._id,
              title: 'Step Goal Alert',
              body: `You need ${remaining.toLocaleString()} more steps!`,
              type: 'step_target',
              data: { currentSteps, stepGoal, remaining },
            })
          } else {
            await sendPushNotification({
              userId: user._id,
              title: 'Step Goal Achieved!',
              body: `Amazing! ${currentSteps.toLocaleString()} steps today!`,
              type: 'achievement',
              data: { currentSteps, stepGoal },
            })
          }
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Step target check job error:', error)
      }
    })

    // 3. Workout reminder - 6pm UTC
    cron.schedule('0 18 * * *', async () => {
      try {
        const users = await User.find({ 'settings.workoutReminders': true, isActive: true })

        for (const user of users) {
          await sendPushNotification({
            userId: user._id,
            title: 'Workout Time!',
            body: "Don't skip today's workout. Your future self will thank you!",
            type: 'workout_reminder',
          })
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Workout reminder job error:', error)
      }
    })

    // 4. Morning motivation - 7am UTC
    cron.schedule('0 7 * * *', async () => {
      try {
        const users = await User.find({
          isActive: true,
          'settings.morningMotivation': { $ne: false },
        })

        const motivationalMessages = [
          "Every workout counts. You're stronger than yesterday!",
          'Your health is an investment, not an expense. Keep going!',
          "Small progress is still progress. You've got this!",
        ]

        for (const user of users) {
          const randomMessage =
            motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)]

          await sendPushNotification({
            userId: user._id,
            title: 'Good Morning, HealthSync!',
            body: randomMessage,
            type: 'system',
          })
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Morning motivation job error:', error)
      }
    })

    // eslint-disable-next-line no-console
    console.log('Notification scheduler started')
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to start notification scheduler:', error)
  }
}
