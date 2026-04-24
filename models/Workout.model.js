import mongoose from 'mongoose'

const { Schema } = mongoose

const workoutSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      required: true,
      enum: [
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
        'sports',
      ],
    },
    title: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    duration: {
      type: Number,
      required: true,
    },
    caloriesBurned: {
      type: Number,
      default: 0,
    },
    distance: {
      type: Number,
      default: 0,
    },
    pace: {
      type: Number,
      default: 0,
    },
    elevationGain: {
      type: Number,
      default: 0,
    },
    exercises: [
      {
        name: String,
        sets: Number,
        reps: Number,
        weightKg: Number,
        durationSec: Number,
        notes: String,
      },
    ],
    gpsRoute: {
      type: {
        type: String,
        enum: ['LineString'],
        default: 'LineString',
      },
      coordinates: [[Number]],
    },
    heartRateAvg: Number,
    heartRateMax: Number,
    notes: String,
    difficulty: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'beginner',
    },
    targetMuscles: [String],
    equipment: [String],
    instructions: String,
    imageUrl: String,
    videoUrl: String,
    rating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0,
    },
    isFavorite: {
      type: Boolean,
      default: false,
    },
    completedAt: {
      type: Date,
      required: true,
    },
    source: {
      type: String,
      enum: ['manual', 'apple_health', 'google_fit', 'strava'],
      default: 'manual',
    },
  },
  {
    timestamps: true,
  }
)

workoutSchema.index({ userId: 1, completedAt: -1 })
workoutSchema.index({ gpsRoute: '2dsphere' }, { sparse: true })

export default mongoose.model('Workout', workoutSchema)
