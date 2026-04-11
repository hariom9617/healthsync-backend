import Joi from 'joi'

export const createGoalSchema = Joi.object({
  type: Joi.string()
    .required()
    .valid(
      'daily_steps',
      'weekly_workouts',
      'weight_target',
      'sleep_hours',
      'calorie_burn',
      'water_intake',
      'custom'
    ),
  title: Joi.string().max(100).required(),
  description: Joi.string().max(500).optional(),
  targetValue: Joi.number().min(0.1).required(),
  unit: Joi.string().required(),
  period: Joi.string().required().valid('daily', 'weekly', 'monthly', 'one_time'),
  deadline: Joi.date().min('now').optional(),
  isPublic: Joi.boolean().default(false),
})

export const updateProgressSchema = Joi.object({
  currentValue: Joi.number().min(0).required(),
})

export const updateGoalSchema = Joi.object({
  title: Joi.string().max(100).optional(),
  description: Joi.string().max(500).optional(),
  targetValue: Joi.number().min(0.1).optional(),
  deadline: Joi.date().min('now').optional(),
  status: Joi.string().optional().valid('active', 'completed', 'failed', 'paused'),
  isPublic: Joi.boolean().optional(),
})
