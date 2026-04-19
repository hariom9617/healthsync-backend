import Joi from 'joi'

export const step1Schema = Joi.object({
  age: Joi.number().integer().min(10).max(120).required(),
  gender: Joi.string().valid('male', 'female', 'non_binary', 'prefer_not_to_say').required(),
  heightCm: Joi.number().min(50).max(300).required(),
  weightKg: Joi.number().min(20).max(500).required(),
})

export const step2Schema = Joi.object({
  experienceLevel: Joi.string().valid('beginner', 'intermediate', 'advanced').required(),
  activityLevel: Joi.string()
    .valid('sedentary', 'lightly_active', 'moderately_active', 'very_active', 'extremely_active')
    .required(),
  fitnessGoals: Joi.array()
    .items(
      Joi.string().valid(
        'weight_loss',
        'muscle_gain',
        'endurance',
        'tone',
        'flexibility',
        'general_health'
      )
    )
    .min(1)
    .required(),
  equipment: Joi.array()
    .items(
      Joi.string().valid(
        'dumbbells',
        'yoga_mat',
        'full_gym',
        'resistance_bands',
        'kettlebells',
        'none'
      )
    )
    .min(1)
    .required(),
})

export const step3Schema = Joi.object({
  parQ: Joi.object({
    chronicConditions: Joi.boolean().required(),
    chronicConditionsDetail: Joi.string().allow('').default(''),
    currentInjuries: Joi.boolean().required(),
    regularMedications: Joi.boolean().required(),
    heartOrChestPain: Joi.boolean().required(),
    dizzinessOrFainting: Joi.boolean().required(),
  }).required(),
  dietaryPreferences: Joi.array()
    .items(
      Joi.string().valid('none', 'vegan', 'keto', 'paleo', 'vegetarian', 'gluten_free', 'halal')
    )
    .min(1)
    .required(),
})

export const completeOnboardingSchema = Joi.object({
  step1: step1Schema,
  step2: step2Schema,
  step3: step3Schema,
})
