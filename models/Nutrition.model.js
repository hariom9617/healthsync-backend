import mongoose from 'mongoose'
import { encryptField, decryptField } from '../src/utils/encryption.js'

const { Schema } = mongoose

const nutritionSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    date: {
      type: Date,
      required: true,
    },
    meals: [
      {
        mealType: {
          type: String,
          enum: ['breakfast', 'lunch', 'dinner', 'snack'],
          required: true,
        },
        name: {
          type: String, // stored as AES-256-GCM encrypted JSON string (HIPAA)
          required: true,
        },
        calories: {
          type: Number,
          default: 0,
        },
        protein: {
          type: Number,
          default: 0,
        },
        carbs: {
          type: Number,
          default: 0,
        },
        fat: {
          type: Number,
          default: 0,
        },
        fiber: {
          type: Number,
          default: 0,
        },
        sugar: {
          type: Number,
          default: 0,
        },
        sodium: {
          type: Number,
          default: 0,
        },
        servingSize: String,
        barcode: String,
        source: {
          type: String,
          enum: ['manual', 'openfoodfacts', 'usda'],
          default: 'manual',
        },
        loggedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    waterIntakeMl: {
      type: Number,
      default: 0,
    },
    dailySummary: {
      totalCalories: {
        type: Number,
        default: 0,
      },
      totalProtein: {
        type: Number,
        default: 0,
      },
      totalCarbs: {
        type: Number,
        default: 0,
      },
      totalFat: {
        type: Number,
        default: 0,
      },
      totalFiber: {
        type: Number,
        default: 0,
      },
    },
  },
  {
    timestamps: true,
  }
)

nutritionSchema.index({ userId: 1, date: 1 }, { unique: true })

// ── Daily summary rollup ──────────────────────────────────────────────────────

nutritionSchema.pre('save', function (next) {
  const summary = this.meals.reduce(
    (acc, meal) => {
      acc.totalCalories += meal.calories || 0
      acc.totalProtein += meal.protein || 0
      acc.totalCarbs += meal.carbs || 0
      acc.totalFat += meal.fat || 0
      acc.totalFiber += meal.fiber || 0
      return acc
    },
    {
      totalCalories: 0,
      totalProtein: 0,
      totalCarbs: 0,
      totalFat: 0,
      totalFiber: 0,
    }
  )

  this.dailySummary = summary
  next()
})

// ── Meal name encryption: pre-save ────────────────────────────────────────────

nutritionSchema.pre('save', function (next) {
  if (!this.isModified('meals')) return next()

  for (const meal of this.meals) {
    if (meal.name !== null) {
      meal.name = encryptField(meal.name)
    }
  }
  next()
})

// ── Meal name decryption: post-find ──────────────────────────────────────────

function decryptMeals(doc) {
  if (!doc?.meals?.length) return
  for (const meal of doc.meals) {
    if (meal.name !== null) meal.name = decryptField(meal.name)
  }
}

nutritionSchema.post('find', function (docs) {
  docs.forEach(decryptMeals)
})

nutritionSchema.post('findOne', function (doc) {
  if (doc) decryptMeals(doc)
})

nutritionSchema.post('findOneAndUpdate', function (doc) {
  if (doc) decryptMeals(doc)
})

export default mongoose.model('Nutrition', nutritionSchema)
