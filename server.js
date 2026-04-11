import dotenv from 'dotenv'
import { connectDB } from './config/db.js'
import app from './app.js'
import { config } from './config/env.js'
import { startGoalCheckerJob } from './jobs/goalChecker.job.js'

dotenv.config()

const startServer = async () => {
  try {
    await connectDB()
    startGoalCheckerJob()

    const port = config.port
    app.listen(port, () => {
      console.log(`HealthSync API running on port ${port}`)
    })
  } catch (error) {
    console.error('Failed to start server:', error.message)
    process.exit(1)
  }
}

startServer()
