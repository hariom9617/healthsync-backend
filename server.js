import { createServer } from 'http'
import dotenv from 'dotenv'
import { connectDB } from './config/db.js'
import app from './app.js'
import { config } from './config/env.js'
import { startGoalCheckerJob } from './jobs/goalChecker.job.js'
import { startNotificationScheduler } from './src/jobs/notificationScheduler.job.js'
import { initializeSocket } from './src/socket/index.js'
import { seedWorkoutTemplates } from './src/data/workoutTemplates.seed.js'

dotenv.config()

const startServer = async () => {
  try {
    await connectDB()
    await seedWorkoutTemplates()
    startGoalCheckerJob()
    startNotificationScheduler()

    const server = createServer(app)
    initializeSocket(server)

    const port = config.port
    server.listen(port, () => {
      // eslint-disable-next-line no-console
      console.log(`HealthSync API running on port ${port}`)
      // eslint-disable-next-line no-console
      console.log(`Socket.io server initialized`)
    })
  } catch (error) {
    console.error('Failed to start server:', error.message)
    process.exit(1)
  }
}

startServer()
