import Nutrition from '../../../models/Nutrition.model.js'
import { buildUserHealthContext } from '../ai/context.builder.js'
import { successResponse, errorResponse } from '../../../utils/response.utils.js'

export const getDailySummary = async (req, res) => {
  try {
    const { date } = req.query
    const targetDate = date ? new Date(date) : new Date()
    targetDate.setUTCHours(0, 0, 0, 0)
    const tomorrow = new Date(targetDate)
    tomorrow.setDate(tomorrow.getDate() + 1)

    // Get nutrition data for the date
    let nutritionData = await Nutrition.findOne({
      userId: req.user._id,
      date: targetDate,
    })

    if (!nutritionData) {
      nutritionData = {
        meals: [],
        waterIntakeMl: 0,
        dailySummary: {
          totalCalories: 0,
          totalProtein: 0,
          totalCarbs: 0,
          totalFat: 0,
          totalFiber: 0,
        },
      }
    }

    const calorieGoal = 2200 // Default - should come from user profile
    const proteinGoal = 150
    const carbsGoal = 275
    const fatGoal = 73
    const waterGoal = 8

    return successResponse(res, 200, 'Daily summary fetched', {
      today: {
        calories: {
          consumed: nutritionData.dailySummary.totalCalories,
          goal: calorieGoal,
          remaining: Math.max(0, calorieGoal - nutritionData.dailySummary.totalCalories),
        },
        macros: {
          protein: {
            consumed: nutritionData.dailySummary.totalProtein,
            goal: proteinGoal,
            unit: 'g',
          },
          carbs: {
            consumed: nutritionData.dailySummary.totalCarbs,
            goal: carbsGoal,
            unit: 'g',
          },
          fat: {
            consumed: nutritionData.dailySummary.totalFat,
            goal: fatGoal,
            unit: 'g',
          },
        },
        water: {
          consumed: Math.round(nutritionData.waterIntakeMl / 250), // Convert to glasses
          goal: waterGoal,
          unit: 'glasses',
        },
      },
      weekly: {
        averageCalories: 1950, // Calculate from week data
        averageProtein: 80,
        trend: 'improving',
      },
    })
  } catch (error) {
    return errorResponse(res, error.statusCode || 500, error.message)
  }
}

export const getMealsByDate = async (req, res) => {
  try {
    const { date } = req.query
    if (!date) {
      return errorResponse(res, 400, 'Date parameter is required')
    }

    const targetDate = new Date(date)
    targetDate.setUTCHours(0, 0, 0, 0)

    const nutritionData = await Nutrition.findOne({
      userId: req.user._id,
      date: targetDate,
    })

    const meals = nutritionData?.meals || []

    return successResponse(res, 200, 'Meals fetched', meals)
  } catch (error) {
    return errorResponse(res, error.statusCode || 500, error.message)
  }
}

export const logMeal = async (req, res) => {
  try {
    const { type, name, calories, macros, foods, date } = req.body

    const targetDate = date ? new Date(date) : new Date()
    targetDate.setUTCHours(0, 0, 0, 0)

    // Find or create nutrition record for the date
    let nutritionData = await Nutrition.findOne({
      userId: req.user._id,
      date: targetDate,
    })

    if (!nutritionData) {
      nutritionData = await Nutrition.create({
        userId: req.user._id,
        date: targetDate,
        meals: [],
        waterIntakeMl: 0,
      })
    }

    // Add the new meal
    const newMeal = {
      mealType: type,
      name,
      calories,
      protein: macros?.protein || 0,
      carbs: macros?.carbs || 0,
      fat: macros?.fat || 0,
      fiber: macros?.fiber || 0,
      sugar: macros?.sugar || 0,
      sodium: macros?.sodium || 0,
      servingSize: '',
      source: 'manual',
      loggedAt: new Date(),
      foods: foods || [],
    }

    nutritionData.meals.push(newMeal)
    await nutritionData.save()

    return successResponse(res, 201, 'Meal logged successfully', {
      id: nutritionData._id,
      type,
      name,
      calories,
      macros,
      date: targetDate,
      createdAt: newMeal.loggedAt,
    })
  } catch (error) {
    return errorResponse(res, error.statusCode || 500, error.message)
  }
}

export const deleteMeal = async (req, res) => {
  try {
    const { id } = req.params
    const { date } = req.query

    const targetDate = date ? new Date(date) : new Date()
    targetDate.setUTCHours(0, 0, 0, 0)

    const nutritionData = await Nutrition.findOne({
      userId: req.user._id,
      date: targetDate,
    })

    if (!nutritionData) {
      return errorResponse(res, 404, 'Nutrition data not found')
    }

    // Remove the meal from the meals array
    nutritionData.meals = nutritionData.meals.filter((meal) => meal._id.toString() !== id)
    await nutritionData.save()

    return successResponse(res, 200, 'Meal deleted successfully')
  } catch (error) {
    return errorResponse(res, error.statusCode || 500, error.message)
  }
}

export const getNutritionTip = async (req, res) => {
  try {
    const { query } = req.body

    const userContext = await buildUserHealthContext(req.user._id)

    const response = await fetch(
      `${process.env.AI_SERVICE_URL || 'http://localhost:8000'}/ai/nutrition-tip`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          user_context: userContext,
        }),
      }
    )

    const data = await response.json()

    return successResponse(res, 200, 'Nutrition tip generated', data.data)
  } catch (error) {
    return errorResponse(res, error.statusCode || 500, error.message)
  }
}
