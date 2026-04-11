import AuditLog from '../models/AuditLog.model.js'

export const logAudit = (action, resource) => {
  return async (req, res, next) => {
    try {
      if (req.user) {
        await AuditLog.create({
          userId: req.user._id,
          action,
          resource,
          resourceId: req.params.id || req.body.id || null,
          ipAddress: req.ip || req.connection.remoteAddress,
          userAgent: req.get('User-Agent'),
          metadata: {
            method: req.method,
            url: req.originalUrl,
            body: req.body,
          },
        })
      }
      next()
    } catch (error) {
      console.error('Audit logging failed:', error)
      next()
    }
  }
}
