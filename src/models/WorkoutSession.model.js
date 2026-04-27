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
      enum: ['active', 'paused', 'completed', 'abandoned'],
      default: 'active',
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    completedAt: {
      type: Date,
    },
    durationSeconds: {
      type: Number,
    },
    currentExerciseIndex: {
      type: Number,
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
    heartRateAvg: {
      type: Number,
    },
    heartRateSamples: [
      {
        value: { type: Number },
        recordedAt: { type: Date, default: Date.now },
      },
    ],
    caloriesBurned: {
      type: Number,
    },
    notes: {
      type: String,
    },
    exercises: [
      {
        name: { type: String },
        sets: { type: Number },
        reps: { type: Number },
        rest: { type: Number },
        completed: { type: Boolean, default: false },
      },
    ],
  },
  {
    timestamps: true,
  }
)

workoutSessionSchema.index({ userId: 1, status: 1 })

export const WorkoutSession = mongoose.model('WorkoutSession', workoutSessionSchema)
