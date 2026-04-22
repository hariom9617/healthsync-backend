import mongoose from 'mongoose'

const pushTokenSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    token: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    platform: {
      type: String,
      enum: ['android', 'ios'],
      default: 'android',
    },
    active: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
)

// Index for efficient lookups
pushTokenSchema.index({ userId: 1, active: 1 })

export const PushToken = mongoose.model('PushToken', pushTokenSchema)
