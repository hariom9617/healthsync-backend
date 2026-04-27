import Joi from 'joi'

export const logMealSchema = Joi.object({
  date: Joi.date().required(),
  mealType: Joi.string().required().valid('breakfast', 'lunch', 'dinner', 'snack'),
  name: Joi.string().max(200).required(),
  calories: Joi.number().min(0).max(10000).optional(),
  protein: Joi.number().min(0).max(1000).optional(),
  carbs: Joi.number().min(0).max(1000).optional(),
  fat: Joi.number().min(0).max(1000).optional(),
  fiber: Joi.number().min(0).max(500).optional(),
  sugar: Joi.number().min(0).max(500).optional(),
  sodium: Joi.number().min(0).max(10000).optional(),
  servingSize: Joi.string().max(100).optional(),
  barcode: Joi.string().max(50).optional(),
  source: Joi.string().optional().valid('manual', 'openfoodfacts', 'usda'),
  // foods array must be explicitly allowed and validated (never pass-through)
  foods: Joi.array()
    .items(
      Joi.object({
        name: Joi.string().max(200).required(),
        calories: Joi.number().min(0).max(10000).optional(),
        protein: Joi.number().min(0).max(1000).optional(),
        carbs: Joi.number().min(0).max(1000).optional(),
        fat: Joi.number().min(0).max(1000).optional(),
      })
    )
    .max(50)
    .optional(),
})

export const waterSchema = Joi.object({
  date: Joi.date().required(),
  waterIntakeMl: Joi.number().min(0).max(10000).required(),
})

export const dateSchema = Joi.object({
  date: Joi.date().required(),
})

export const dateRangeSchema = Joi.object({
  from: Joi.date().required(),
  to: Joi.date().required(),
})
