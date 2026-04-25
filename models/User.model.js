import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
import { encryptField, decryptField } from '../src/utils/encryption.js'

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      select: false,
    },
    googleId: String,
    appleId: String,
    avatar: {
      type: String,
      default: '',
    },
    role: {
      type: String,
      enum: ['user', 'admin', 'coach'],
      default: 'user',
    },
    // PII fields — stored AES-256-GCM encrypted (HIPAA/GDPR)
    dateOfBirth: {
      type: String,
    },
    phoneNumber: {
      type: String,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    verificationToken: String,
    verificationTokenExpiry: Date,
    passwordResetToken: String,
    passwordResetExpiry: Date,
    healthProfile: {
      age: { type: Number, min: 10, max: 120 },
      gender: { type: String, enum: ['male', 'female', 'non_binary', 'prefer_not_to_say'] },
      heightCm: { type: Number, min: 50, max: 300 },
      weightKg: { type: Number, min: 20, max: 500 },
      bmi: { type: Number },

      experienceLevel: {
        type: String,
        enum: ['beginner', 'intermediate', 'advanced'],
      },
      activityLevel: {
        type: String,
        enum: [
          'sedentary',
          'lightly_active',
          'moderately_active',
          'very_active',
          'extremely_active',
        ],
      },
      fitnessGoals: [
        {
          type: String,
          enum: [
            'weight_loss',
            'muscle_gain',
            'endurance',
            'tone',
            'flexibility',
            'general_health',
          ],
        },
      ],
      equipment: [
        {
          type: String,
          enum: ['dumbbells', 'yoga_mat', 'full_gym', 'resistance_bands', 'kettlebells', 'none'],
        },
      ],

      parQ: {
        chronicConditions: { type: Boolean, default: false },
        chronicConditionsDetail: { type: String, default: '' },
        currentInjuries: { type: Boolean, default: false },
        regularMedications: { type: Boolean, default: false },
        heartOrChestPain: { type: Boolean, default: false },
        dizzinessOrFainting: { type: Boolean, default: false },
        consultDoctorRecommended: { type: Boolean, default: false },
      },

      dietaryPreferences: [
        {
          type: String,
          enum: ['none', 'vegan', 'keto', 'paleo', 'vegetarian', 'gluten_free', 'halal'],
        },
      ],
    },
    isOnboardingComplete: { type: Boolean, default: false },
    consent: {
      dataCollection: {
        type: Boolean,
        default: false,
      },
      marketing: {
        type: Boolean,
        default: false,
      },
      consentDate: Date,
    },
    twoFactorEnabled: {
      type: Boolean,
      default: false,
    },
    lastLogin: Date,
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
)

// ── Existing pre-save hooks ───────────────────────────────────────────────────

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next()

  this.password = await bcrypt.hash(this.password, 12)
  next()
})

userSchema.pre('save', function (next) {
  if (this.healthProfile?.heightCm && this.healthProfile?.weightKg) {
    const heightM = this.healthProfile.heightCm / 100
    this.healthProfile.bmi = parseFloat(
      (this.healthProfile.weightKg / (heightM * heightM)).toFixed(1)
    )
  }
  next()
})

userSchema.pre('save', function (next) {
  if (this.healthProfile?.parQ) {
    const parQ = this.healthProfile.parQ
    const anyRisk =
      parQ.chronicConditions ||
      parQ.currentInjuries ||
      parQ.regularMedications ||
      parQ.heartOrChestPain ||
      parQ.dizzinessOrFainting
    this.healthProfile.parQ.consultDoctorRecommended = anyRisk
  }
  next()
})

// ── PII encryption: pre-save ──────────────────────────────────────────────────

userSchema.pre('save', function (next) {
  if (this.isModified('dateOfBirth') && this.dateOfBirth !== null) {
    this.dateOfBirth = encryptField(this.dateOfBirth)
  }
  if (this.isModified('phoneNumber') && this.phoneNumber !== null) {
    this.phoneNumber = encryptField(this.phoneNumber)
  }
  next()
})

// ── PII decryption: post-find ─────────────────────────────────────────────────

function decryptUser(doc) {
  if (!doc) return
  if (doc.dateOfBirth !== null) doc.dateOfBirth = decryptField(doc.dateOfBirth)
  if (doc.phoneNumber !== null) doc.phoneNumber = decryptField(doc.phoneNumber)
}

userSchema.post('find', function (docs) {
  docs.forEach(decryptUser)
})

userSchema.post('findOne', function (doc) {
  decryptUser(doc)
})

userSchema.post('findOneAndUpdate', function (doc) {
  decryptUser(doc)
})

// ── Instance methods ──────────────────────────────────────────────────────────

userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password)
}

userSchema.methods.getFullName = function () {
  return `${this.firstName} ${this.lastName}`
}

export default mongoose.model('User', userSchema)
