import mongoose from 'mongoose'

const { Schema } = mongoose

const healthMetricSchema = new Schema(
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
        'steps',
        'heart_rate',
        'sleep',
        'stress',
        'weight',
        'blood_pressure',
        'blood_oxygen',
        'calories_burned',
      ],
    },
    value: {
      type: Number,
      required: true,
    },
    unit: {
      type: String,
      required: true,
    },
    source: {
      type: String,
      enum: ['manual', 'apple_health', 'google_fit', 'fitbit', 'garmin', 'samsung_health'],
      default: 'manual',
    },
    metadata: {
      systolic: Number,
      diastolic: Number,
      sleepStages: {
        deep: Number,
        light: Number,
        rem: Number,
        awake: Number,
      },
      heartRateZone: {
        type: String,
        enum: ['rest', 'fat_burn', 'cardio', 'peak'],
      },
    },
    recordedAt: {
      type: Date,
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
)

healthMetricSchema.index({ userId: 1, type: 1, recordedAt: -1 })

export default mongoose.model('HealthMetric', healthMetricSchema)
