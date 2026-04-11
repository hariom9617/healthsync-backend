import Joi from 'joi'

export const logMealSchema = Joi.object({
  date: Joi.date().required(),
  mealType: Joi.string().required().valid('breakfast', 'lunch', 'dinner', 'snack'),
  name: Joi.string().required(),
  calories: Joi.number().min(0).optional(),
  protein: Joi.number().min(0).optional(),
  carbs: Joi.number().min(0).optional(),
  fat: Joi.number().min(0).optional(),
  fiber: Joi.number().min(0).optional(),
  sugar: Joi.number().min(0).optional(),
  sodium: Joi.number().min(0).optional(),
  servingSize: Joi.string().optional(),
  barcode: Joi.string().optional(),
  source: Joi.string().optional().valid('manual', 'openfoodfacts', 'usda'),
})

export const waterSchema = Joi.object({
  date: Joi.date().required(),
  waterIntakeMl: Joi.number().min(0).required(),
})

export const dateSchema = Joi.object({
  date: Joi.date().required(),
})

export const dateRangeSchema = Joi.object({
  from: Joi.date().required(),
  to: Joi.date().required(),
})
