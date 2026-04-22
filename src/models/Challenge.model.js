import mongoose from 'mongoose'

const challengeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    goal: {
      type: String,
      required: true,
      enum: ['steps', 'workouts', 'calories', 'water', 'sleep', 'weight_loss', 'custom'],
    },
    unit: {
      type: String,
      required: true,
    },
    targetValue: {
      type: Number,
      required: true,
    },
    durationDays: {
      type: Number,
      required: true,
      min: 1,
      max: 365,
    },
    reward_xp: {
      type: Number,
      required: true,
      min: 0,
    },
    difficulty: {
      type: String,
      enum: ['Easy', 'Medium', 'Hard', 'Extreme'],
      default: 'Medium',
    },
    category: {
      type: String,
      enum: ['fitness', 'nutrition', 'wellness', 'custom'],
      default: 'custom',
    },
    imageUrl: {
      type: String,
      default: '',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    isPublic: {
      type: Boolean,
      default: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    endDate: {
      type: Date,
      default: function () {
        const endDate = new Date(this.startDate)
        endDate.setDate(endDate.getDate() + this.durationDays)
        return endDate
      },
    },
    participants: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        progress: {
          type: Number,
          default: 0,
        },
        joinedAt: {
          type: Date,
          default: Date.now,
        },
        completedAt: {
          type: Date,
        },
        lastProgressUpdate: {
          type: Date,
        },
        xpAwarded: {
          type: Boolean,
          default: false,
        },
      },
    ],
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
  },
  {
    timestamps: true,
  }
)

challengeSchema.index({ createdBy: 1, createdAt: -1 })
challengeSchema.index({ isActive: 1, isPublic: 1 })
challengeSchema.index({ category: 1, difficulty: 1 })
challengeSchema.index({ 'participants.userId': 1 })

export const Challenge = mongoose.model('Challenge', challengeSchema)
