import {
  logWorkoutSchema,
  getWorkoutsSchema,
  updateWorkoutSchema,
} from '../../validations/workout.schema.js'
import { successResponse, errorResponse } from '../../utils/response.utils.js'
import * as workoutService from './workout.service.js'

export const logWorkout = async (req, res) => {
  try {
    const { error, value } = logWorkoutSchema.validate(req.body)
    if (error) {
      return errorResponse(
        res,
        400,
        'Validation failed',
        error.details.map((d) => d.message)
      )
    }

    const workout = await workoutService.logWorkout({
      userId: req.user.id,
      ...value,
    })

    return successResponse(res, 201, 'Workout logged', workout)
  } catch (error) {
    return errorResponse(res, error.statusCode || 500, error.message)
  }
}

export const getWorkouts = async (req, res) => {
  try {
    const { error, value } = getWorkoutsSchema.validate(req.query)
    if (error) {
      return errorResponse(
        res,
        400,
        'Validation failed',
        error.details.map((d) => d.message)
      )
    }

    const result = await workoutService.getWorkouts({
      userId: req.user.id,
      ...value,
    })

    // Format response to match frontend expectations
    const formattedWorkouts = result.workouts.map((workout) => ({
      id: workout._id,
      name: workout.name || workout.title,
      type: workout.type,
      difficulty: workout.difficulty || 'beginner',
      duration: workout.duration,
      targetMuscles: workout.targetMuscles || [],
      equipment: workout.equipment || [],
      rating: workout.rating || 4.5,
      isFavorite: workout.isFavorite || false,
      imageUrl: workout.imageUrl,
      videoUrl: workout.videoUrl,
      instructions: workout.instructions,
      caloriesBurned: workout.caloriesBurned,
      completedAt: workout.completedAt,
      notes: workout.notes,
    }))

    return successResponse(res, 200, 'Workouts fetched', formattedWorkouts)
  } catch (error) {
    return errorResponse(res, error.statusCode || 500, error.message)
  }
}

export const getWorkoutById = async (req, res) => {
  try {
    const { workoutId } = req.params
    const workout = await workoutService.getWorkoutById({
      userId: req.user.id,
      workoutId,
    })

    return successResponse(res, 200, 'Workout fetched', workout)
  } catch (error) {
    return errorResponse(res, error.statusCode || 500, error.message)
  }
}

export const updateWorkout = async (req, res) => {
  try {
    const { workoutId } = req.params
    const { error, value } = updateWorkoutSchema.validate(req.body)
    if (error) {
      return errorResponse(
        res,
        400,
        'Validation failed',
        error.details.map((d) => d.message)
      )
    }

    const workout = await workoutService.updateWorkout({
      userId: req.user.id,
      workoutId,
      updates: value,
    })

    return successResponse(res, 200, 'Workout updated', workout)
  } catch (error) {
    return errorResponse(res, error.statusCode || 500, error.message)
  }
}

export const deleteWorkout = async (req, res) => {
  try {
    const { workoutId } = req.params
    const result = await workoutService.deleteWorkout({
      userId: req.user.id,
      workoutId,
    })

    return successResponse(res, 200, 'Workout deleted', result)
  } catch (error) {
    return errorResponse(res, error.statusCode || 500, error.message)
  }
}

export const getWorkoutStats = async (req, res) => {
  try {
    const { from, to } = req.query
    const stats = await workoutService.getWorkoutStats({
      userId: req.user.id,
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
    })

    return successResponse(res, 200, 'Workout stats fetched', stats)
  } catch (error) {
    return errorResponse(res, error.statusCode || 500, error.message)
  }
}
