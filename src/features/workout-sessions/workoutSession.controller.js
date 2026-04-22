import { WorkoutSession } from '../../models/WorkoutSession.model.js'
import { WorkoutTemplate } from '../../models/WorkoutTemplate.model.js'
import Workout from '../../../models/Workout.model.js'
import { SocialPost } from '../../models/SocialPost.model.js'

export const startSession = async (req, res) => {
  try {
    const { workoutTemplateId } = req.body

    // Check if user has an active session
    const activeSession = await WorkoutSession.findOne({
      userId: req.user._id,
      status: 'active',
    })

    if (activeSession) {
      return res.status(400).json({
        success: false,
        message: 'You already have an active workout session',
      })
    }

    const workoutTemplate = await WorkoutTemplate.findById(workoutTemplateId)
    if (!workoutTemplate) {
      return res.status(404).json({
        success: false,
        message: 'Workout template not found',
      })
    }

    const session = await WorkoutSession.create({
      userId: req.user._id,
      workoutTemplateId,
      status: 'active',
      startedAt: new Date(),
    })

    res.status(201).json({
      success: true,
      data: session,
      message: 'Workout session started',
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to start workout session',
    })
  }
}

export const updateProgress = async (req, res) => {
  try {
    const { currentSet, currentRep, currentExercise, heartRate } = req.body
    const sessionId = req.params.id

    const session = await WorkoutSession.findOne({
      _id: sessionId,
      userId: req.user._id,
      status: 'active',
    })

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Active session not found',
      })
    }

    const updateData = {}
    if (currentSet !== undefined) updateData.currentSet = currentSet
    if (currentRep !== undefined) updateData.currentRep = currentRep
    if (currentExercise !== undefined) updateData.currentExercise = currentExercise
    if (heartRate !== undefined) updateData.heartRate = heartRate

    const updatedSession = await WorkoutSession.findByIdAndUpdate(
      sessionId,
      { $set: updateData },
      { new: true }
    )

    res.json({
      success: true,
      data: updatedSession,
      message: 'Progress updated',
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update progress',
    })
  }
}

export const completeSession = async (req, res) => {
  try {
    const { notes, setsCompleted } = req.body
    const sessionId = req.params.id

    const session = await WorkoutSession.findOne({
      _id: sessionId,
      userId: req.user._id,
      status: 'active',
    })

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Active session not found',
      })
    }

    const completedAt = new Date()
    const duration = Math.round((completedAt - session.startedAt) / (1000 * 60)) // in minutes

    const updateData = {
      status: 'completed',
      completedAt,
      duration,
      notes: notes || '',
    }

    if (setsCompleted && Array.isArray(setsCompleted)) {
      updateData.setsCompleted = setsCompleted
    }

    const completedSession = await WorkoutSession.findByIdAndUpdate(
      sessionId,
      { $set: updateData },
      { new: true }
    ).populate('workoutTemplateId')

    // Auto-log to workout history
    const workoutTemplate = completedSession.workoutTemplateId
    const loggedWorkout = await Workout.create({
      userId: req.user._id,
      name: workoutTemplate.name,
      type: workoutTemplate.type,
      duration: duration,
      calories: workoutTemplate.caloriesBurned || 0,
      exercises: workoutTemplate.exercises,
      completedAt: completedAt,
      sessionId: sessionId,
    })

    // Create social feed post for workout completion
    await SocialPost.create({
      userId: req.user._id,
      type: 'workout_logged',
      title: `Completed ${workoutTemplate.name}!`,
      description: `Just finished a ${duration}-minute ${workoutTemplate.type} workout. Burned ${workoutTemplate.caloriesBurned || 0} calories!`,
      metadata: {
        workoutId: loggedWorkout._id,
        value: duration,
        unit: 'minutes',
        targetValue: workoutTemplate.duration,
      },
    })

    res.json({
      success: true,
      data: completedSession,
      message: 'Workout session completed and logged',
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to complete workout session',
    })
  }
}

export const pauseSession = async (req, res) => {
  try {
    const sessionId = req.params.id

    const session = await WorkoutSession.findOneAndUpdate(
      {
        _id: sessionId,
        userId: req.user._id,
        status: 'active',
      },
      { status: 'paused' },
      { new: true }
    )

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Active session not found',
      })
    }

    res.json({
      success: true,
      data: session,
      message: 'Workout session paused',
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to pause workout session',
    })
  }
}

export const resumeSession = async (req, res) => {
  try {
    const sessionId = req.params.id

    const session = await WorkoutSession.findOneAndUpdate(
      {
        _id: sessionId,
        userId: req.user._id,
        status: 'paused',
      },
      { status: 'active' },
      { new: true }
    )

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Paused session not found',
      })
    }

    res.json({
      success: true,
      data: session,
      message: 'Workout session resumed',
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to resume workout session',
    })
  }
}

export const getActiveSession = async (req, res) => {
  try {
    const session = await WorkoutSession.findOne({
      userId: req.user._id,
      status: { $in: ['active', 'paused'] },
    }).populate('workoutTemplateId')

    res.json({
      success: true,
      data: session,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get active session',
    })
  }
}
