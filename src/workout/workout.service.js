import Workout from '../../models/Workout.model.js'

export const logWorkout = async ({ userId, ...workoutFields }) => {
  const workout = await Workout.create({
    userId,
    ...workoutFields,
  })

  return workout
}

export const getWorkouts = async ({ userId, type, from, to, limit, page }) => {
  const filter = { userId }

  if (type) {
    filter.type = type
  }

  if (from || to) {
    filter.completedAt = {}
    if (from) filter.completedAt.$gte = from
    if (to) filter.completedAt.$lte = to
  }

  const skip = (page - 1) * limit

  const [workouts, total] = await Promise.all([
    Workout.find(filter).sort({ completedAt: -1 }).skip(skip).limit(limit),
    Workout.countDocuments(filter),
  ])

  return {
    workouts,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  }
}

export const getWorkoutById = async ({ userId, workoutId }) => {
  const workout = await Workout.findOne({ _id: workoutId, userId })

  if (!workout) {
    throw Object.assign(new Error('Workout not found'), { statusCode: 404 })
  }

  return workout
}

export const updateWorkout = async ({ userId, workoutId, updates }) => {
  const workout = await Workout.findOne({ _id: workoutId, userId })

  if (!workout) {
    throw Object.assign(new Error('Workout not found'), { statusCode: 404 })
  }

  Object.assign(workout, updates)
  await workout.save()

  return workout
}

export const deleteWorkout = async ({ userId, workoutId }) => {
  const workout = await Workout.findOne({ _id: workoutId, userId })

  if (!workout) {
    throw Object.assign(new Error('Workout not found'), { statusCode: 404 })
  }

  await Workout.deleteOne({ _id: workoutId })
  return { deleted: true }
}

export const getWorkoutStats = async ({ userId, from, to }) => {
  const matchFilter = { userId }

  if (from || to) {
    matchFilter.completedAt = {}
    if (from) matchFilter.completedAt.$gte = from
    if (to) matchFilter.completedAt.$lte = to
  }

  const summaryPipeline = [
    { $match: matchFilter },
    {
      $group: {
        _id: null,
        totalWorkouts: { $sum: 1 },
        totalDuration: { $sum: '$duration' },
        totalCalories: { $sum: '$caloriesBurned' },
        totalDistance: { $sum: '$distance' },
        avgHeartRate: { $avg: '$heartRateAvg' },
      },
    },
  ]

  const byTypePipeline = [
    { $match: matchFilter },
    {
      $group: {
        _id: '$type',
        count: { $sum: 1 },
        totalDuration: { $sum: '$duration' },
      },
    },
  ]

  const [summaryResult, byTypeResult] = await Promise.all([
    Workout.aggregate(summaryPipeline),
    Workout.aggregate(byTypePipeline),
  ])

  const summary = summaryResult[0] || {
    totalWorkouts: 0,
    totalDuration: 0,
    totalCalories: 0,
    totalDistance: 0,
    avgHeartRate: 0,
  }

  return {
    summary,
    byType: byTypeResult,
  }
}
