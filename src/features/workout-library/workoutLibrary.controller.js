import { WorkoutTemplate } from '../../models/WorkoutTemplate.model.js'
import User from '../../../models/User.model.js'

export const browseWorkouts = async (req, res) => {
  try {
    const { type, level, equipment } = req.query
    const filter = {}

    if (type) filter.type = type
    if (level) filter.level = level
    if (equipment === 'none') {
      filter.equipment = { $size: 0 }
    } else if (equipment) {
      filter.equipment = equipment
    }

    const workouts = await WorkoutTemplate.find(filter)
      .sort({ difficulty: 1, name: 1 })
      .select('-exercises') // Exclude exercises for list view

    res.json({
      success: true,
      data: workouts,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to browse workouts',
    })
  }
}

export const getRecommendedWorkouts = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
    const userProfile = user.healthProfile || {}

    const fitnessGoals = userProfile.fitnessGoal || 'general_health'
    const experienceLevel = userProfile.experienceLevel || 'beginner'
    const availableEquipment = userProfile.equipment || []

    // Build recommendation logic
    let recommendedTypes = []
    if (fitnessGoals.includes('lose_weight')) {
      recommendedTypes = ['HIIT', 'Cardio']
    } else if (fitnessGoals.includes('build_muscle')) {
      recommendedTypes = ['Strength']
    } else {
      recommendedTypes = ['HIIT', 'Strength', 'Cardio']
    }

    const filter = {
      type: { $in: recommendedTypes },
      level: experienceLevel.charAt(0).toUpperCase() + experienceLevel.slice(1),
    }

    // If user has no equipment, prefer no-equipment workouts
    if (availableEquipment.length === 0) {
      filter.$or = [{ equipment: { $size: 0 } }, { equipment: { $in: ['bodyweight'] } }]
    } else {
      filter.equipment = { $in: availableEquipment }
    }

    const workouts = await WorkoutTemplate.find(filter).sort({ difficulty: 1, rating: -1 }).limit(3)

    res.json({
      success: true,
      data: workouts,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get recommended workouts',
    })
  }
}

export const getWorkoutById = async (req, res) => {
  try {
    const workout = await WorkoutTemplate.findById(req.params.id)

    if (!workout) {
      return res.status(404).json({
        success: false,
        message: 'Workout not found',
      })
    }

    res.json({
      success: true,
      data: workout,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get workout details',
    })
  }
}
