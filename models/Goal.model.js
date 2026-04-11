import mongoose from 'mongoose'

const { Schema } = mongoose

const goalSchema = new Schema(
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
        'daily_steps',
        'weekly_workouts',
        'weight_target',
        'sleep_hours',
        'calorie_burn',
        'water_intake',
        'custom',
      ],
    },
    title: {
      type: String,
      required: true,
    },
    description: String,
    targetValue: {
      type: Number,
      required: true,
    },
    currentValue: {
      type: Number,
      default: 0,
    },
    unit: {
      type: String,
      required: true,
    },
    period: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'one_time'],
      required: true,
    },
    deadline: Date,
    status: {
      type: String,
      enum: ['active', 'completed', 'failed', 'paused'],
      default: 'active',
    },
    completedAt: Date,
    progress: {
      type: Number,
      default: 0,
    },
    milestones: [
      {
        percentage: Number,
        achievedAt: Date,
        notified: {
          type: Boolean,
          default: false,
        },
      },
    ],
    isPublic: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
)

goalSchema.index({ userId: 1, status: 1 })

goalSchema.pre('save', function (next) {
  this.progress = Math.min(Math.round((this.currentValue / this.targetValue) * 100), 100)
  if (this.progress >= 100 && this.status === 'active') {
    this.status = 'completed'
    this.completedAt = new Date()
  }
  next()
})

export default mongoose.model('Goal', goalSchema)
