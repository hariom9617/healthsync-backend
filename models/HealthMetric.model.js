import mongoose from 'mongoose'
import { encryptField, decryptField } from '../src/utils/encryption.js'

const { Schema } = mongoose

// Sensitive metric types whose raw values are encrypted at rest
const ENCRYPTED_TYPES = new Set(['blood_pressure', 'blood_oxygen'])

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
      // Stored as encrypted JSON strings for blood_pressure records (HIPAA)
      systolic: Schema.Types.Mixed,
      diastolic: Schema.Types.Mixed,
      // Blood glucose — encrypted at rest
      bloodGlucose: Schema.Types.Mixed,
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

// ── Encryption: pre-save ──────────────────────────────────────────────────────

healthMetricSchema.pre('save', function (next) {
  if (!ENCRYPTED_TYPES.has(this.type) || !this.metadata) return next()

  if (this.isModified('metadata.systolic') && this.metadata.systolic !== null) {
    this.metadata.systolic = encryptField(this.metadata.systolic)
  }
  if (this.isModified('metadata.diastolic') && this.metadata.diastolic !== null) {
    this.metadata.diastolic = encryptField(this.metadata.diastolic)
  }
  if (this.isModified('metadata.bloodGlucose') && this.metadata.bloodGlucose !== null) {
    this.metadata.bloodGlucose = encryptField(this.metadata.bloodGlucose)
  }
  next()
})

// ── Decryption: post-find/findOne (also fires on .lean() results in Mongoose v8) ─

function decryptDoc(doc) {
  if (!doc?.metadata) return
  const m = doc.metadata
  if (m.systolic !== null) m.systolic = decryptField(m.systolic)
  if (m.diastolic !== null) m.diastolic = decryptField(m.diastolic)
  if (m.bloodGlucose !== null) m.bloodGlucose = decryptField(m.bloodGlucose)
}

healthMetricSchema.post('find', function (docs) {
  docs.forEach(decryptDoc)
})

healthMetricSchema.post('findOne', function (doc) {
  if (doc) decryptDoc(doc)
})

healthMetricSchema.post('findOneAndUpdate', function (doc) {
  if (doc) decryptDoc(doc)
})

export default mongoose.model('HealthMetric', healthMetricSchema)
