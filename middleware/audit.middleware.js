import AuditLog from '../models/AuditLog.model.js'

// Fields that must never appear in audit logs
const REDACTED_KEYS = new Set([
  'password',
  'currentPassword',
  'newPassword',
  'confirmPassword',
  'token',
  'otp',
  'refreshToken',
  'accessToken',
  'idToken',
  'secret',
  'apiKey',
  'authorization',
])

function sanitizeBody(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return {}
  const clean = {}
  for (const [key, value] of Object.entries(body)) {
    clean[key] = REDACTED_KEYS.has(key.toLowerCase()) ? '[REDACTED]' : value
  }
  return clean
}

export const logAudit = (action, resource) => {
  return async (req, res, next) => {
    try {
      await AuditLog.create({
        userId: req.user?._id ?? null,
        action,
        resource,
        resourceId:
          req.params.id ||
          req.params.goalId ||
          req.params.workoutId ||
          req.params.metricId ||
          req.body?.id ||
          null,
        ipAddress: req.ip || req.socket?.remoteAddress,
        userAgent: req.get('User-Agent'),
        metadata: {
          method: req.method,
          url: req.originalUrl,
          body: sanitizeBody(req.body),
          requestId: req.requestId,
        },
      })
    } catch (error) {
      // Audit failure must never block the request
      console.error('Audit logging failed:', error.message)
    }
    next()
  }
}
