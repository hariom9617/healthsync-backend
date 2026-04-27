import Joi from 'joi'
import { WorkoutSession } from '../../models/WorkoutSession.model.js'
import { WorkoutTemplate } from '../../models/WorkoutTemplate.model.js'

const startSchema = Joi.object({
  workoutTemplateId: Joi.string().required(),
})

const progressSchema = Joi.object({
  currentExerciseIndex: Joi.number().integer().min(0),
  currentSet: Joi.number().integer().min(1),
  currentRep: Joi.number().integer().min(0),
  heartRate: Joi.number().min(30).max(250),
  status: Joi.string().valid('active', 'paused'),
})

const completeSchema = Joi.object({
  caloriesBurned: Joi.number().min(0),
  notes: Joi.string().max(1000),
})

function validateBody(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, { abortEarly: false })
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: error.details.map((d) => d.message),
      })
    }
    req.body = value
    next()
  }
}

export const getActiveSession = async (req, res) => {
  try {
    const session = await WorkoutSession.findOne({
      userId: req.user._id,
      status: 'active',
    }).populate('workoutTemplateId', 'name imageUrl')

    return res.json({ success: true, data: session || null })
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message })
  }
}

export const startWorkoutSession = [
  validateBody(startSchema),
  async (req, res) => {
    try {
      const { workoutTemplateId } = req.body

      const existingSession = await WorkoutSession.findOne({
        userId: req.user._id,
        status: 'active',
      })

      if (existingSession) {
        return res.status(409).json({
          success: false,
          message: 'You already have an active workout session',
          sessionId: existingSession._id,
        })
      }

      const template = await WorkoutTemplate.findById(workoutTemplateId)
      if (!template) {
        return res.status(404).json({ success: false, message: 'Workout template not found' })
      }

      const session = await WorkoutSession.create({
        userId: req.user._id,
        workoutTemplateId: template._id,
        status: 'active',
        startedAt: new Date(),
        exercises: (template.exercises || []).map((ex) => ({
          name: ex.name,
          sets: ex.sets,
          reps: ex.reps,
          rest: ex.rest,
          completed: false,
        })),
      })

      return res.status(201).json({
        success: true,
        data: {
          sessionId: session._id,
          workoutTemplate: template.toObject(),
        },
      })
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message })
    }
  },
]

export const updateSessionProgress = [
  validateBody(progressSchema),
  async (req, res) => {
    try {
      const { id } = req.params
      const { currentExerciseIndex, currentSet, currentRep, heartRate, status } = req.body

      const session = await WorkoutSession.findById(id)
      if (!session) {
        return res.status(404).json({ success: false, message: 'Session not found' })
      }
      if (session.userId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ success: false, message: 'Forbidden' })
      }

      const update = {}
      if (currentExerciseIndex !== undefined) update.currentExerciseIndex = currentExerciseIndex
      if (currentSet !== undefined) update.currentSet = currentSet
      if (currentRep !== undefined) update.currentRep = currentRep
      if (status !== undefined) update.status = status

      if (heartRate !== undefined) {
        await WorkoutSession.updateOne(
          { _id: id },
          { $push: { heartRateSamples: { value: heartRate, recordedAt: new Date() } } }
        )
      }

      const updated = await WorkoutSession.findByIdAndUpdate(id, { $set: update }, { new: true })

      return res.json({ success: true, data: updated })
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message })
    }
  },
]

export const completeWorkoutSession = [
  validateBody(completeSchema),
  async (req, res) => {
    try {
      const { id } = req.params
      const { caloriesBurned, notes } = req.body

      const session = await WorkoutSession.findById(id).populate('workoutTemplateId')
      if (!session) {
        return res.status(404).json({ success: false, message: 'Session not found' })
      }
      if (session.userId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ success: false, message: 'Forbidden' })
      }
      if (session.status === 'completed') {
        return res.status(400).json({ success: false, message: 'Session already completed' })
      }

      const completedAt = new Date()
      const durationSeconds = Math.floor((completedAt - session.startedAt) / 1000)

      const samples = session.heartRateSamples || []
      const heartRateAvg =
        samples.length > 0
          ? Math.round(samples.reduce((sum, s) => sum + s.value, 0) / samples.length)
          : undefined

      const finalCalories = caloriesBurned ?? session.workoutTemplateId?.caloriesBurned ?? undefined

      const completedExercises = session.exercises.map((ex) => ({
        ...ex.toObject(),
        completed: true,
      }))

      const completed = await WorkoutSession.findByIdAndUpdate(
        id,
        {
          $set: {
            status: 'completed',
            completedAt,
            durationSeconds,
            heartRateAvg,
            caloriesBurned: finalCalories,
            notes: notes ?? session.notes,
            exercises: completedExercises,
          },
        },
        { new: true }
      )

      return res.json({
        success: true,
        data: { session: completed, durationSeconds, caloriesBurned: finalCalories },
      })
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message })
    }
  },
]

export const getSessionHistory = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1)
    const limit = 20
    const skip = (page - 1) * limit

    const sessions = await WorkoutSession.find({
      userId: req.user._id,
      status: 'completed',
    })
      .sort({ completedAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('workoutTemplateId', 'name type imageUrl')

    return res.json({ success: true, data: sessions })
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message })
  }
}
