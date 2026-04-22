import mongoose from 'mongoose'

const workoutSessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    workoutTemplateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'WorkoutTemplate',
      required: true,
    },
    status: {
      type: String,
      enum: ['active', 'completed', 'paused'],
      default: 'active',
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    completedAt: {
      type: Date,
    },
    duration: {
      type: Number, // in minutes
      default: 0,
    },
    currentSet: {
      type: Number,
      default: 1,
    },
    currentRep: {
      type: Number,
      default: 0,
    },
    currentExercise: {
      type: Number,
      default: 0,
    },
    heartRate: {
      type: Number,
    },
    caloriesBurned: {
      type: Number,
      default: 0,
    },
    setsCompleted: [
      {
        exerciseIndex: Number,
        setNumber: Number,
        reps: Number,
        weight: Number,
        completedAt: Date,
      },
    ],
    notes: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
)

workoutSessionSchema.index({ userId: 1, status: 1 })
workoutSessionSchema.index({ startedAt: -1 })

export const WorkoutSession = mongoose.model('WorkoutSession', workoutSessionSchema)
