import {
  logMetricSchema,
  bulkLogSchema,
  getMetricsSchema,
  summarySchema,
} from '../../validations/healthMetric.schema.js'
import { successResponse, errorResponse } from '../../utils/response.utils.js'
import * as healthMetricService from './healthMetric.service.js'

export const logMetric = async (req, res) => {
  try {
    const { error, value } = logMetricSchema.validate(req.body)
    if (error) {
      return errorResponse(
        res,
        400,
        'Validation failed',
        error.details.map((d) => d.message)
      )
    }

    const metric = await healthMetricService.logMetric({
      userId: req.user.id,
      ...value,
    })

    return successResponse(res, 201, 'Metric logged', metric)
  } catch (error) {
    return errorResponse(res, error.statusCode || 500, error.message)
  }
}

export const bulkLogMetrics = async (req, res) => {
  try {
    const { error, value } = bulkLogSchema.validate(req.body)
    if (error) {
      return errorResponse(
        res,
        400,
        'Validation failed',
        error.details.map((d) => d.message)
      )
    }

    const result = await healthMetricService.bulkLogMetrics({
      userId: req.user.id,
      metrics: value.metrics,
    })

    return successResponse(res, 201, 'Metrics bulk logged', result)
  } catch (error) {
    return errorResponse(res, error.statusCode || 500, error.message)
  }
}

export const getMetrics = async (req, res) => {
  try {
    const { error, value } = getMetricsSchema.validate(req.query)
    if (error) {
      return errorResponse(
        res,
        400,
        'Validation failed',
        error.details.map((d) => d.message)
      )
    }

    const result = await healthMetricService.getMetrics({
      userId: req.user.id,
      ...value,
    })

    return successResponse(res, 200, 'Metrics fetched', result)
  } catch (error) {
    return errorResponse(res, error.statusCode || 500, error.message)
  }
}

export const getLatestMetrics = async (req, res) => {
  try {
    const latest = await healthMetricService.getLatestMetrics(req.user.id)
    return successResponse(res, 200, 'Latest metrics fetched', latest)
  } catch (error) {
    return errorResponse(res, error.statusCode || 500, error.message)
  }
}

export const getMetricSummary = async (req, res) => {
  try {
    const { error, value } = summarySchema.validate(req.query)
    if (error) {
      return errorResponse(
        res,
        400,
        'Validation failed',
        error.details.map((d) => d.message)
      )
    }

    const summary = await healthMetricService.getMetricSummary({
      userId: req.user.id,
      ...value,
    })

    return successResponse(res, 200, 'Summary fetched', summary)
  } catch (error) {
    return errorResponse(res, error.statusCode || 500, error.message)
  }
}

export const deleteMetric = async (req, res) => {
  try {
    const { metricId } = req.params
    const result = await healthMetricService.deleteMetric({
      userId: req.user.id,
      metricId,
    })

    return successResponse(res, 200, 'Metric deleted', result)
  } catch (error) {
    return errorResponse(res, error.statusCode || 500, error.message)
  }
}
