import Nutrition from '../../../models/Nutrition.model.js'
import User from '../../../models/User.model.js'
import { buildUserHealthContext } from '../ai/context.builder.js'

export const getDailySummary = async (req, res) => {
  try {
    const today = new Date()
    today.setUTCHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const meals = await Nutrition.find({
      userId: req.user._id,
      recordedAt: { $gte: today, $lt: tomorrow },
    })

    const totalCalories = meals.reduce((sum, meal) => sum + meal.calories, 0)
    const totalCarbs = meals.reduce((sum, meal) => sum + (meal.macros?.carbs || 0), 0)
    const totalProtein = meals.reduce((sum, meal) => sum + (meal.macros?.protein || 0), 0)
    const totalFat = meals.reduce((sum, meal) => sum + (meal.macros?.fat || 0), 0)

    const totalMacros = totalCarbs + totalProtein + totalFat
    const macroPercentages =
      totalMacros > 0
        ? {
            carbs: Math.round((totalCarbs / totalMacros) * 100),
            protein: Math.round((totalProtein / totalMacros) * 100),
            fat: Math.round((totalFat / totalMacros) * 100),
          }
        : { carbs: 0, protein: 0, fat: 0 }

    const user = await User.findById(req.user._id)
    const calorieGoal = user.healthProfile?.dailyCalorieGoal || 2000
    const deficit = calorieGoal - totalCalories

    res.json({
      success: true,
      data: {
        date: today.toISOString().split('T')[0],
        totalCalories,
        macroPercentages,
        deficit,
        calorieGoal,
        mealsCount: meals.length,
      },
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch daily summary',
    })
  }
}

export const getMealsByDate = async (req, res) => {
  try {
    const { date } = req.query
    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'Date parameter is required',
      })
    }

    const targetDate = new Date(date)
    targetDate.setUTCHours(0, 0, 0, 0)
    const nextDay = new Date(targetDate)
    nextDay.setDate(nextDay.getDate() + 1)

    const meals = await Nutrition.find({
      userId: req.user._id,
      recordedAt: { $gte: targetDate, $lt: nextDay },
    }).sort({ recordedAt: 1 })

    const groupedMeals = meals.reduce((acc, meal) => {
      const type = meal.mealType || 'snack'
      if (!acc[type]) acc[type] = []
      acc[type].push(meal)
      return acc
    }, {})

    res.json({
      success: true,
      data: groupedMeals,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch meals',
    })
  }
}

export const logMeal = async (req, res) => {
  try {
    const { name, calories, carbs, protein, fat, mealType } = req.body

    const meal = await Nutrition.create({
      userId: req.user._id,
      name,
      calories,
      macros: { carbs, protein, fat },
      mealType,
      recordedAt: new Date(),
    })

    res.status(201).json({
      success: true,
      data: meal,
      message: 'Meal logged successfully',
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to log meal',
    })
  }
}

export const deleteMeal = async (req, res) => {
  try {
    const meal = await Nutrition.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    })

    if (!meal) {
      return res.status(404).json({
        success: false,
        message: 'Meal not found',
      })
    }

    res.json({
      success: true,
      message: 'Meal deleted successfully',
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete meal',
    })
  }
}

export const getNutritionTip = async (req, res) => {
  try {
    const userContext = await buildUserHealthContext(req.user._id)

    const response = await fetch(
      `${process.env.AI_SERVICE_URL || 'http://localhost:8000'}/ai/nutrition-tip`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_context: userContext }),
      }
    )

    const data = await response.json()

    res.json({
      success: true,
      data: data,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get nutrition tip',
    })
  }
}
