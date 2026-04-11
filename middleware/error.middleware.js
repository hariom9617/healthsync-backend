import mongoose from 'mongoose'
import { errorResponse } from '../utils/response.utils.js'

export const errorHandler = (err, req, res, next) => {
  let error = { ...err }
  error.message = err.message

  if (process.env.NODE_ENV === 'development') {
    console.error(err.stack)
  }

  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors)
      .map((val) => val.message)
      .join(', ')
    error = Object.assign(new Error(message), { statusCode: 400 })
  }

  if (err.name === 'CastError') {
    const message = 'Resource not found'
    error = Object.assign(new Error(message), { statusCode: 400 })
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0]
    const message = `${field} already exists`
    error = Object.assign(new Error(message), { statusCode: 409 })
  }

  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token'
    error = Object.assign(new Error(message), { statusCode: 401 })
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Token expired'
    error = Object.assign(new Error(message), { statusCode: 401 })
  }

  const statusCode = error.statusCode || 500
  const message = error.message || 'Internal Server Error'

  return errorResponse(res, statusCode, message)
}
