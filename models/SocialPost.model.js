import mongoose from 'mongoose'

const { Schema } = mongoose

const socialPostSchema = new Schema(
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
      enum: ['workout', 'run', 'pr', 'achievement', 'general'],
    },
    title: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
    imageUrl: {
      type: String,
    },
    kudos: [
      {
        userId: {
          type: Schema.Types.ObjectId,
          ref: 'User',
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
)

socialPostSchema.index({ userId: 1, createdAt: -1 })

export default mongoose.model('SocialPost', socialPostSchema)
