import { step1Schema, step2Schema, step3Schema } from '../../validations/onboarding.schema.js'
import { successResponse, errorResponse } from '../../utils/response.utils.js'
import * as onboardingService from './onboarding.service.js'

export const saveStep1 = async (req, res) => {
  try {
    const { error, value } = step1Schema.validate(req.body)
    if (error) {
      return errorResponse(
        res,
        400,
        'Validation failed',
        error.details.map((d) => d.message)
      )
    }

    const healthProfile = await onboardingService.saveStep1({
      userId: req.user._id,
      ...value,
    })

    return successResponse(res, 200, 'Step 1 saved', healthProfile)
  } catch (error) {
    return errorResponse(res, error.statusCode || 500, error.message)
  }
}

export const saveStep2 = async (req, res) => {
  try {
    const { error, value } = step2Schema.validate(req.body)
    if (error) {
      return errorResponse(
        res,
        400,
        'Validation failed',
        error.details.map((d) => d.message)
      )
    }

    const healthProfile = await onboardingService.saveStep2({
      userId: req.user._id,
      ...value,
    })

    return successResponse(res, 200, 'Step 2 saved', healthProfile)
  } catch (error) {
    return errorResponse(res, error.statusCode || 500, error.message)
  }
}

export const saveStep3 = async (req, res) => {
  try {
    const { error, value } = step3Schema.validate(req.body)
    if (error) {
      return errorResponse(
        res,
        400,
        'Validation failed',
        error.details.map((d) => d.message)
      )
    }

    const healthProfile = await onboardingService.saveStep3({
      userId: req.user._id,
      ...value,
    })

    return successResponse(res, 200, 'Step 3 saved', healthProfile)
  } catch (error) {
    return errorResponse(res, error.statusCode || 500, error.message)
  }
}

export const completeOnboarding = async (req, res) => {
  try {
    const result = await onboardingService.completeOnboarding(req.user._id)
    return successResponse(res, 200, 'Onboarding complete', result)
  } catch (error) {
    return errorResponse(res, error.statusCode || 500, error.message)
  }
}

export const getOnboardingStatus = async (req, res) => {
  try {
    const status = await onboardingService.getOnboardingStatus(req.user._id)
    return successResponse(res, 200, 'Onboarding status retrieved', status)
  } catch (error) {
    return errorResponse(res, error.statusCode || 500, error.message)
  }
}
