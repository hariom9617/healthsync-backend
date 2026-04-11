import { verifyAccessToken } from '../utils/jwt.utils.js'
import { errorResponse } from '../utils/response.utils.js'
import User from '../models/User.model.js'

export const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return errorResponse(res, 401, 'Access token required')
    }

    const token = authHeader.split(' ')[1]
    const decoded = verifyAccessToken(token)

    const user = await User.findById(decoded.userId).select('-password')
    if (!user || !user.isActive) {
      return errorResponse(res, 401, 'Invalid token or user not found')
    }

    req.user = user
    next()
  } catch (error) {
    return errorResponse(res, 401, 'Invalid or expired token')
  }
}

export const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return errorResponse(res, 401, 'Authentication required')
    }

    if (!roles.includes(req.user.role)) {
      return errorResponse(res, 403, 'Insufficient permissions')
    }

    next()
  }
}
