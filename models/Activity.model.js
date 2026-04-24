import mongoose from 'mongoose'

const { Schema } = mongoose

const activitySchema = new Schema(
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
      enum: ['workout', 'run', 'pr', 'achievement'],
    },
    description: {
      type: String,
      required: true,
    },
    location: String,
    isRecord: {
      type: Boolean,
      default: false,
    },
    metrics: {
      distance: Number,
      duration: Number,
      pace: String,
      steps: Number,
      calories: Number,
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
    isPublic: {
      type: Boolean,
      default: true,
    },
    media: [String], // URLs to images/videos
  },
  {
    timestamps: true,
  }
)

activitySchema.index({ userId: 1, createdAt: -1 })
activitySchema.index({ isPublic: 1, createdAt: -1 })

export default mongoose.model('Activity', activitySchema)
