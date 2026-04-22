import mongoose from 'mongoose'

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    body: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: [
        'workout_reminder',
        'goal_milestone',
        'step_target',
        'ai_insight',
        'water_reminder',
        'achievement',
        'system',
      ],
      required: true,
    },
    data: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    read: {
      type: Boolean,
      default: false,
      index: true,
    },
    sent: {
      type: Boolean,
      default: false,
    },
    sentAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
)

// Compound indexes
notificationSchema.index({ userId: 1, createdAt: -1 })
notificationSchema.index({ userId: 1, read: 1 })

export const Notification = mongoose.model('Notification', notificationSchema)
