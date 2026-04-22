import mongoose from 'mongoose'

const workoutTemplateSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ['HIIT', 'Strength', 'Cardio', 'Yoga', 'Pilates'],
      required: true,
    },
    level: {
      type: String,
      enum: ['Beginner', 'Intermediate', 'Advanced'],
      required: true,
    },
    equipment: [
      {
        type: String,
        trim: true,
      },
    ],
    duration: {
      type: Number, // in minutes
      required: true,
    },
    sets: {
      type: Number,
      default: 3,
    },
    reps: {
      type: Number,
      default: 12,
    },
    rest: {
      type: Number, // in seconds
      default: 60,
    },
    imageUrl: {
      type: String,
      default: '',
    },
    exercises: [
      {
        name: {
          type: String,
          required: true,
        },
        sets: {
          type: Number,
          default: 3,
        },
        reps: {
          type: Number,
          default: 12,
        },
        rest: {
          type: Number,
          default: 60,
        },
        description: {
          type: String,
          default: '',
        },
      },
    ],
    difficulty: {
      type: Number,
      min: 1,
      max: 10,
      default: 5,
    },
    muscleGroups: [
      {
        type: String,
        enum: [
          'chest',
          'back',
          'shoulders',
          'biceps',
          'triceps',
          'legs',
          'core',
          'glutes',
          'hamstrings',
          'quads',
          'obliques',
        ],
      },
    ],
    caloriesBurned: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
)

workoutTemplateSchema.index({ type: 1, level: 1, equipment: 1 })
workoutTemplateSchema.index({ difficulty: 1 })

export const WorkoutTemplate = mongoose.model('WorkoutTemplate', workoutTemplateSchema)
