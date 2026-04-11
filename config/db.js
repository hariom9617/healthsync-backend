import mongoose from 'mongoose'
import { config } from './env.js'

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(config.mongodbUri)
    console.log(`MongoDB Connected: ${conn.connection.host}`)
  } catch (error) {
    console.error('Database connection failed:', error.message)
    throw Object.assign(new Error('Database connection failed'), { statusCode: 500 })
  }
}
