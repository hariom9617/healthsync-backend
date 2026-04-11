import cron from 'node-cron'
import Goal from '../models/Goal.model.js'

export const startGoalCheckerJob = () => {
  cron.schedule('0 0 * * *', async () => {
    try {
      const result = await Goal.updateMany(
        {
          status: 'active',
          deadline: { $lt: new Date() },
          progress: { $lt: 100 },
        },
        { $set: { status: 'failed' } }
      )

      if (result.modifiedCount > 0) {
        console.warn(`Goal checker ran. ${result.modifiedCount} goals marked as failed.`)
      }
    } catch (error) {
      console.error('Goal checker job failed:', error)
    }
  })
}
