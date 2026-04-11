import {
  logMealSchema,
  waterSchema,
  dateSchema,
  dateRangeSchema,
} from '../../validations/nutrition.schema.js'
import { successResponse, errorResponse } from '../../utils/response.utils.js'
import * as nutritionService from './nutrition.service.js'

export const logMeal = async (req, res) => {
  try {
    const { error, value } = logMealSchema.validate(req.body)
    if (error) {
      return errorResponse(
        res,
        400,
        'Validation failed',
        error.details.map((d) => d.message)
      )
    }

    const nutrition = await nutritionService.logMeal({
      userId: req.user.id,
      ...value,
    })

    return successResponse(res, 201, 'Meal logged', nutrition)
  } catch (error) {
    return errorResponse(res, error.statusCode || 500, error.message)
  }
}

export const getDailyNutrition = async (req, res) => {
  try {
    const { error, value } = dateSchema.validate(req.query)
    if (error) {
      return errorResponse(
        res,
        400,
        'Validation failed',
        error.details.map((d) => d.message)
      )
    }

    const nutrition = await nutritionService.getDailyNutrition({
      userId: req.user.id,
      date: value.date,
    })

    return successResponse(res, 200, 'Daily nutrition fetched', nutrition)
  } catch (error) {
    return errorResponse(res, error.statusCode || 500, error.message)
  }
}

export const getNutritionRange = async (req, res) => {
  try {
    const { error, value } = dateRangeSchema.validate(req.query)
    if (error) {
      return errorResponse(
        res,
        400,
        'Validation failed',
        error.details.map((d) => d.message)
      )
    }

    const nutrition = await nutritionService.getNutritionRange({
      userId: req.user.id,
      from: value.from,
      to: value.to,
    })

    return successResponse(res, 200, 'Nutrition range fetched', nutrition)
  } catch (error) {
    return errorResponse(res, error.statusCode || 500, error.message)
  }
}

export const updateWaterIntake = async (req, res) => {
  try {
    const { error, value } = waterSchema.validate(req.body)
    if (error) {
      return errorResponse(
        res,
        400,
        'Validation failed',
        error.details.map((d) => d.message)
      )
    }

    const nutrition = await nutritionService.updateWaterIntake({
      userId: req.user.id,
      ...value,
    })

    return successResponse(res, 200, 'Water intake updated', nutrition)
  } catch (error) {
    return errorResponse(res, error.statusCode || 500, error.message)
  }
}

export const deleteMeal = async (req, res) => {
  try {
    const { mealId } = req.params
    const { date } = req.query

    if (!date) {
      return errorResponse(res, 400, 'Date query parameter is required')
    }

    const nutrition = await nutritionService.deleteMeal({
      userId: req.user.id,
      date: new Date(date),
      mealId,
    })

    return successResponse(res, 200, 'Meal deleted', nutrition)
  } catch (error) {
    return errorResponse(res, error.statusCode || 500, error.message)
  }
}

export const searchFood = async (req, res) => {
  try {
    const { q } = req.query

    if (!q || q.length < 2) {
      return errorResponse(res, 400, 'Search query must be at least 2 characters')
    }

    const results = await nutritionService.searchFood(q)
    return successResponse(res, 200, 'Food search results', results)
  } catch (error) {
    return errorResponse(res, error.statusCode || 500, error.message)
  }
}
