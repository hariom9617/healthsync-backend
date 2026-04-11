import Joi from 'joi'

export const logMetricSchema = Joi.object({
  type: Joi.string()
    .required()
    .valid(
      'steps',
      'heart_rate',
      'sleep',
      'stress',
      'weight',
      'blood_pressure',
      'blood_oxygen',
      'calories_burned'
    ),
  value: Joi.number().required(),
  unit: Joi.string().required(),
  source: Joi.string()
    .optional()
    .valid('manual', 'apple_health', 'google_fit', 'fitbit', 'garmin', 'samsung_health'),
  recordedAt: Joi.date().required(),
  metadata: Joi.object().optional(),
})

export const bulkLogSchema = Joi.object({
  metrics: Joi.array().items(logMetricSchema).min(1).max(500).required(),
})

export const getMetricsSchema = Joi.object({
  type: Joi.string()
    .optional()
    .valid(
      'steps',
      'heart_rate',
      'sleep',
      'stress',
      'weight',
      'blood_pressure',
      'blood_oxygen',
      'calories_burned'
    ),
  from: Joi.date().optional(),
  to: Joi.date().optional(),
  limit: Joi.number().integer().min(1).max(500).default(100),
  page: Joi.number().integer().min(1).default(1),
})

export const summarySchema = Joi.object({
  type: Joi.string()
    .required()
    .valid(
      'steps',
      'heart_rate',
      'sleep',
      'stress',
      'weight',
      'blood_pressure',
      'blood_oxygen',
      'calories_burned'
    ),
  from: Joi.date().required(),
  to: Joi.date().required(),
  period: Joi.string().valid('daily', 'weekly', 'monthly').default('daily'),
})
