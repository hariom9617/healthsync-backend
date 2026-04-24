import { WorkoutTemplate } from '../../models/WorkoutTemplate.model.js'
import User from '../../../models/User.model.js'
import { successResponse, errorResponse } from '../../../utils/response.utils.js'

export const browseWorkouts = async (req, res) => {
  try {
    const { type, difficulty, duration, limit = 20, offset = 0 } = req.query
    const filter = {}

    if (type) filter.type = type
    if (difficulty) filter.difficulty = difficulty
    if (duration) filter.duration = duration

    const workouts = await WorkoutTemplate.find(filter)
      .sort({ difficulty: 1, name: 1 })
      .skip(parseInt(offset))
      .limit(parseInt(limit))
      .select('-exercises') // Exclude exercises for list view

    // Format workouts to match frontend expectations
    const formattedWorkouts = workouts.map((workout) => ({
      id: workout._id,
      name: workout.name,
      type: workout.type,
      difficulty: workout.difficulty || 'beginner',
      duration: workout.duration || 30,
      targetMuscles: workout.targetMuscles || [],
      equipment: workout.equipment || [],
      rating: workout.rating || 4.5,
      isFavorite: workout.isFavorite || false,
      imageUrl: workout.imageUrl,
      videoUrl: workout.videoUrl,
      instructions: workout.instructions,
    }))

    return successResponse(res, 200, 'Workouts fetched', formattedWorkouts)
  } catch (error) {
    return errorResponse(res, error.statusCode || 500, error.message)
  }
}

export const getRecommendedWorkouts = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
    const userProfile = user.healthProfile || {}

    const fitnessGoals = userProfile.fitnessGoals || ['general_health']
    const experienceLevel = userProfile.experienceLevel || 'beginner'
    const availableEquipment = userProfile.equipment || []

    // Build recommendation logic
    let recommendedTypes = []
    if (fitnessGoals.includes('weight_loss')) {
      recommendedTypes = ['cardio', 'hiit']
    } else if (fitnessGoals.includes('muscle_gain')) {
      recommendedTypes = ['strength']
    } else {
      recommendedTypes = ['strength', 'cardio', 'flexibility']
    }

    const filter = {
      type: { $in: recommendedTypes },
      difficulty: experienceLevel,
    }

    // If user has no equipment, prefer no-equipment workouts
    if (availableEquipment.length === 0 || availableEquipment.includes('none')) {
      filter.equipment = { $in: ['bodyweight'] }
    } else {
      filter.equipment = { $in: availableEquipment }
    }

    const workouts = await WorkoutTemplate.find(filter)
      .sort({ difficulty: 1, rating: -1 })
      .limit(10)

    // Format workouts to match frontend expectations
    const formattedWorkouts = workouts.map((workout) => ({
      id: workout._id,
      name: workout.name,
      type: workout.type,
      difficulty: workout.difficulty || 'beginner',
      duration: workout.duration || 30,
      targetMuscles: workout.targetMuscles || [],
      equipment: workout.equipment || [],
      rating: workout.rating || 4.5,
      isFavorite: workout.isFavorite || false,
      imageUrl: workout.imageUrl,
      videoUrl: workout.videoUrl,
      instructions: workout.instructions,
      isRecommended: true,
    }))

    return successResponse(res, 200, 'Recommended workouts fetched', formattedWorkouts)
  } catch (error) {
    return errorResponse(res, error.statusCode || 500, error.message)
  }
}

export const getWorkoutById = async (req, res) => {
  try {
    const { id } = req.params
    const workout = await WorkoutTemplate.findById(id)

    if (!workout) {
      return errorResponse(res, 404, 'Workout not found')
    }

    // Format workout to match frontend expectations
    const formattedWorkout = {
      id: workout._id,
      name: workout.name,
      type: workout.type,
      difficulty: workout.difficulty || 'beginner',
      duration: workout.duration || 30,
      targetMuscles: workout.targetMuscles || [],
      equipment: workout.equipment || [],
      rating: workout.rating || 4.5,
      isFavorite: workout.isFavorite || false,
      imageUrl: workout.imageUrl,
      videoUrl: workout.videoUrl,
      instructions: workout.instructions,
      exercises: workout.exercises || [],
    }

    return successResponse(res, 200, 'Workout details fetched', formattedWorkout)
  } catch (error) {
    return errorResponse(res, error.statusCode || 500, error.message)
  }
}
