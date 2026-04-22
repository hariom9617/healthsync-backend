import mongoose from 'mongoose'

const socialPostSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['workout_logged', 'goal_achieved', 'personal_record', 'milestone', 'achievement'],
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    metadata: {
      workoutId: mongoose.Schema.Types.ObjectId,
      goalId: mongoose.Schema.Types.ObjectId,
      value: Number,
      unit: String,
      targetValue: Number,
    },
    imageUrl: {
      type: String,
      default: '',
    },
    kudos: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        givenAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    kudosCount: {
      type: Number,
      default: 0,
    },
    visibility: {
      type: String,
      enum: ['public', 'friends', 'private'],
      default: 'public',
    },
  },
  {
    timestamps: true,
  }
)

socialPostSchema.index({ createdAt: -1 })
socialPostSchema.index({ userId: 1, createdAt: -1 })
socialPostSchema.index({ type: 1, createdAt: -1 })

export const SocialPost = mongoose.model('SocialPost', socialPostSchema)
