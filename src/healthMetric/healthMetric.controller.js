import {
  logMetricSchema,
  bulkLogSchema,
  getMetricsSchema,
  summarySchema,
} from '../../validations/healthMetric.schema.js'
import { successResponse, errorResponse } from '../../utils/response.utils.js'
import HealthMetric from '../../models/HealthMetric.model.js'
import Goal from '../../models/Goal.model.js'
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

export const getMetricsList = async (req, res) => {
  try {
    const { type, from, to, limit = 100, offset = 0 } = req.query

    const result = await healthMetricService.getMetrics({
      userId: req.user.id,
      type,
      startDate: from,
      endDate: to,
      limit: parseInt(limit),
      offset: parseInt(offset),
    })

    return successResponse(res, 200, 'Metrics list fetched', {
      data: result.metrics,
      pagination: {
        total: result.total,
        limit: parseInt(limit),
        offset: parseInt(offset),
      },
    })
  } catch (error) {
    return errorResponse(res, error.statusCode || 500, error.message)
  }
}

export const getWeeklySummary = async (req, res) => {
  try {
    const userId = req.user.id

    const now = new Date()
    const todayStart = new Date(now)
    todayStart.setHours(0, 0, 0, 0)

    const currentWeekStart = new Date(todayStart)
    currentWeekStart.setDate(currentWeekStart.getDate() - 6)

    const prevWeekStart = new Date(currentWeekStart)
    prevWeekStart.setDate(prevWeekStart.getDate() - 7)

    const [currentMetrics, prevMetrics, stepsGoal, weightGoal] = await Promise.all([
      HealthMetric.find({ userId, recordedAt: { $gte: currentWeekStart } }).lean(),
      HealthMetric.find({
        userId,
        recordedAt: { $gte: prevWeekStart, $lt: currentWeekStart },
      }).lean(),
      Goal.findOne({ userId, type: 'daily_steps', status: 'active' }).lean(),
      Goal.findOne({ userId, type: 'weight_target', status: 'active' }).lean(),
    ])

    const stepTarget = stepsGoal?.targetValue || 10000
    const goalWeight = weightGoal?.targetValue ?? null

    const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const dayMap = {}
    for (let i = 6; i >= 0; i--) {
      const d = new Date(todayStart)
      d.setDate(d.getDate() - i)
      const dateStr = d.toISOString().split('T')[0]
      dayMap[dateStr] = { day: DAYS[d.getDay()], date: dateStr, steps: 0, activeMinutes: 0 }
    }

    let totalSteps = 0
    const totalActiveMinutes = 0
    let totalCalories = 0
    let latestWeight = null
    let latestWeightDate = null

    for (const m of currentMetrics) {
      const dateStr = new Date(m.recordedAt).toISOString().split('T')[0]
      if (m.type === 'steps') {
        totalSteps += m.value
        if (dayMap[dateStr]) dayMap[dateStr].steps += m.value
      } else if (m.type === 'calories_burned') {
        totalCalories += m.value
      } else if (m.type === 'weight') {
        if (!latestWeightDate || m.recordedAt > latestWeightDate) {
          latestWeightDate = m.recordedAt
          latestWeight = m.value
        }
      }
    }

    const todayStr = todayStart.toISOString().split('T')[0]
    const todaySteps = dayMap[todayStr]?.steps || 0
    const dailyTargetProgress = Math.min(Math.round((todaySteps / stepTarget) * 100), 100)

    let prevTotalSteps = 0
    const prevTotalActiveMinutes = 0
    let prevTotalCalories = 0
    for (const m of prevMetrics) {
      if (m.type === 'steps') prevTotalSteps += m.value
      else if (m.type === 'calories_burned') prevTotalCalories += m.value
    }

    const pctChange = (curr, prev) => {
      if (prev === 0) return curr > 0 ? 100 : 0
      return Math.round(((curr - prev) / prev) * 100)
    }

    const formatDate = (d) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    const dateRange = `${formatDate(currentWeekStart)} - ${formatDate(todayStart)}`

    return successResponse(res, 200, 'Weekly summary fetched', {
      dateRange,
      steps: totalSteps,
      activeMinutes: totalActiveMinutes,
      calories: totalCalories,
      currentWeight: latestWeight,
      goalWeight,
      stepsImprovement: pctChange(totalSteps, prevTotalSteps),
      dailyTargetProgress,
      stepsTrend: Object.values(dayMap),
      vsLastWeek: {
        steps: pctChange(totalSteps, prevTotalSteps),
        activeMinutes: pctChange(totalActiveMinutes, prevTotalActiveMinutes),
        calories: pctChange(totalCalories, prevTotalCalories),
      },
    })
  } catch (error) {
    return errorResponse(res, error.statusCode || 500, error.message)
  }
}

export const getStreaks = async (req, res) => {
  try {
    const userId = req.user.id

    const metrics = await HealthMetric.find({ userId }, { recordedAt: 1 }).lean()

    const dateSet = new Set(metrics.map((m) => new Date(m.recordedAt).toISOString().split('T')[0]))

    if (dateSet.size === 0) {
      return successResponse(res, 200, 'Streaks fetched', {
        current: 0,
        longest: 0,
        lastActive: null,
      })
    }

    const sortedDates = Array.from(dateSet).sort().reverse()

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayStr = today.toISOString().split('T')[0]
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = yesterday.toISOString().split('T')[0]

    let current = 0
    const startDate = dateSet.has(todayStr) ? today : dateSet.has(yesterdayStr) ? yesterday : null

    if (startDate) {
      const cursor = new Date(startDate)
      while (dateSet.has(cursor.toISOString().split('T')[0])) {
        current++
        cursor.setDate(cursor.getDate() - 1)
      }
    }

    const ascDates = [...sortedDates].reverse()
    let longest = 1
    let run = 1
    for (let i = 1; i < ascDates.length; i++) {
      const diff = Math.round((new Date(ascDates[i]) - new Date(ascDates[i - 1])) / 86400000)
      if (diff === 1) {
        run++
        if (run > longest) longest = run
      } else {
        run = 1
      }
    }

    return successResponse(res, 200, 'Streaks fetched', {
      current,
      longest,
      lastActive: sortedDates[0],
    })
  } catch (error) {
    return errorResponse(res, error.statusCode || 500, error.message)
  }
}

export const deleteMetric = async (req, res) => {
  try {
    const { metricId, id } = req.params
    const metricIdToDelete = metricId || id
    const result = await healthMetricService.deleteMetric({
      userId: req.user.id,
      metricId: metricIdToDelete,
    })

    return successResponse(res, 200, 'Metric deleted', result)
  } catch (error) {
    return errorResponse(res, error.statusCode || 500, error.message)
  }
}
