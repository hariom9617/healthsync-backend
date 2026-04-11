import {
  createGoalSchema,
  updateProgressSchema,
  updateGoalSchema,
} from '../../validations/goal.schema.js'
import { successResponse, errorResponse } from '../../utils/response.utils.js'
import * as goalService from './goal.service.js'

export const createGoal = async (req, res) => {
  try {
    const { error, value } = createGoalSchema.validate(req.body)
    if (error) {
      return errorResponse(
        res,
        400,
        'Validation failed',
        error.details.map((d) => d.message)
      )
    }

    const goal = await goalService.createGoal({
      userId: req.user.id,
      ...value,
    })

    return successResponse(res, 201, 'Goal created', goal)
  } catch (error) {
    return errorResponse(res, error.statusCode || 500, error.message)
  }
}

export const getGoals = async (req, res) => {
  try {
    const { status, type, limit = 20, page = 1 } = req.query

    const result = await goalService.getGoals({
      userId: req.user.id,
      status,
      type,
      limit: parseInt(limit),
      page: parseInt(page),
    })

    return successResponse(res, 200, 'Goals fetched', result)
  } catch (error) {
    return errorResponse(res, error.statusCode || 500, error.message)
  }
}

export const getGoalById = async (req, res) => {
  try {
    const { goalId } = req.params
    const goal = await goalService.getGoalById({
      userId: req.user.id,
      goalId,
    })

    return successResponse(res, 200, 'Goal fetched', goal)
  } catch (error) {
    return errorResponse(res, error.statusCode || 500, error.message)
  }
}

export const updateProgress = async (req, res) => {
  try {
    const { goalId } = req.params
    const { error, value } = updateProgressSchema.validate(req.body)
    if (error) {
      return errorResponse(
        res,
        400,
        'Validation failed',
        error.details.map((d) => d.message)
      )
    }

    const goal = await goalService.updateGoalProgress({
      userId: req.user.id,
      goalId,
      currentValue: value.currentValue,
    })

    return successResponse(res, 200, 'Goal progress updated', goal)
  } catch (error) {
    return errorResponse(res, error.statusCode || 500, error.message)
  }
}

export const updateGoal = async (req, res) => {
  try {
    const { goalId } = req.params
    const { error, value } = updateGoalSchema.validate(req.body)
    if (error) {
      return errorResponse(
        res,
        400,
        'Validation failed',
        error.details.map((d) => d.message)
      )
    }

    const goal = await goalService.updateGoal({
      userId: req.user.id,
      goalId,
      updates: value,
    })

    return successResponse(res, 200, 'Goal updated', goal)
  } catch (error) {
    return errorResponse(res, error.statusCode || 500, error.message)
  }
}

export const deleteGoal = async (req, res) => {
  try {
    const { goalId } = req.params
    const result = await goalService.deleteGoal({
      userId: req.user.id,
      goalId,
    })

    return successResponse(res, 200, 'Goal deleted', result)
  } catch (error) {
    return errorResponse(res, error.statusCode || 500, error.message)
  }
}

export const getPublicGoals = async (req, res) => {
  try {
    const { limit = 20, page = 1 } = req.query

    const result = await goalService.getPublicGoals({
      limit: parseInt(limit),
      page: parseInt(page),
    })

    return successResponse(res, 200, 'Public goals fetched', result)
  } catch (error) {
    return errorResponse(res, error.statusCode || 500, error.message)
  }
}
