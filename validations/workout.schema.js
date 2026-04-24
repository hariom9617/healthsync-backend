import Joi from 'joi'

export const logWorkoutSchema = Joi.object({
  // Support both template-based logging and direct logging
  workoutId: Joi.string().optional(),
  type: Joi.string()
    .when('workoutId', {
      is: Joi.exist(),
      then: Joi.optional(),
      otherwise: Joi.required(),
    })
    .valid(
      'running',
      'cycling',
      'swimming',
      'weightlifting',
      'yoga',
      'hiit',
      'walking',
      'football',
      'basketball',
      'other',
      'strength',
      'cardio',
      'flexibility',
      'sports'
    ),
  title: Joi.string().when('workoutId', {
    is: Joi.exist(),
    then: Joi.optional(),
    otherwise: Joi.required(),
  }),
  name: Joi.string().optional(),
  duration: Joi.number().integer().min(1).required(),
  caloriesBurned: Joi.number().min(0).optional(),
  distance: Joi.number().min(0).optional(),
  pace: Joi.number().min(0).optional(),
  elevationGain: Joi.number().min(0).optional(),
  exercises: Joi.array()
    .items(
      Joi.object({
        name: Joi.string().required(),
        sets: Joi.number().integer().min(1).optional(),
        reps: Joi.number().integer().min(1).optional(),
        weightKg: Joi.number().min(0).optional(),
        durationSec: Joi.number().integer().min(1).optional(),
        notes: Joi.string().optional(),
      })
    )
    .optional(),
  heartRateAvg: Joi.number().min(0).optional(),
  heartRateMax: Joi.number().min(0).optional(),
  notes: Joi.string().max(1000).optional(),
  completed: Joi.boolean().default(true),
  sets: Joi.array().optional(), // For frontend logging format
  completedAt: Joi.date().required(),
  source: Joi.string().optional().valid('manual', 'apple_health', 'google_fit', 'strava'),
})

export const getWorkoutsSchema = Joi.object({
  type: Joi.string()
    .optional()
    .valid(
      'running',
      'cycling',
      'swimming',
      'weightlifting',
      'yoga',
      'hiit',
      'walking',
      'football',
      'basketball',
      'other',
      'strength',
      'cardio',
      'flexibility',
      'sports'
    ),
  difficulty: Joi.string().optional().valid('beginner', 'intermediate', 'advanced'),
  duration: Joi.number().integer().min(1).optional(), // Filter by duration in minutes
  from: Joi.date().optional(),
  to: Joi.date().optional(),
  limit: Joi.number().integer().min(1).max(100).default(20),
  offset: Joi.number().integer().min(0).default(0),
  page: Joi.number().integer().min(1).default(1),
})

export const updateWorkoutSchema = Joi.object({
  type: Joi.string()
    .optional()
    .valid(
      'running',
      'cycling',
      'swimming',
      'weightlifting',
      'yoga',
      'hiit',
      'walking',
      'football',
      'basketball',
      'other'
    ),
  title: Joi.string().optional(),
  duration: Joi.number().integer().min(1).optional(),
  caloriesBurned: Joi.number().min(0).optional(),
  distance: Joi.number().min(0).optional(),
  pace: Joi.number().min(0).optional(),
  elevationGain: Joi.number().min(0).optional(),
  exercises: Joi.array()
    .items(
      Joi.object({
        name: Joi.string().required(),
        sets: Joi.number().integer().min(1).optional(),
        reps: Joi.number().integer().min(1).optional(),
        weightKg: Joi.number().min(0).optional(),
        durationSec: Joi.number().integer().min(1).optional(),
        notes: Joi.string().optional(),
      })
    )
    .optional(),
  heartRateAvg: Joi.number().min(0).optional(),
  heartRateMax: Joi.number().min(0).optional(),
  notes: Joi.string().max(1000).optional(),
  completedAt: Joi.date().optional(),
  source: Joi.string().optional().valid('manual', 'apple_health', 'google_fit', 'strava'),
})
