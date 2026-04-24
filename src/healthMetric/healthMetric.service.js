import HealthMetric from '../../models/HealthMetric.model.js'

export const logMetric = async ({ userId, type, value, unit, source, metadata, recordedAt }) => {
  if (recordedAt > new Date()) {
    throw Object.assign(new Error('recordedAt cannot be in the future'), { statusCode: 400 })
  }

  const metric = await HealthMetric.create({
    userId,
    type,
    value,
    unit,
    source: source || 'manual',
    metadata,
    recordedAt,
  })

  return metric
}

export const getMetrics = async ({ userId, type, from, to, limit, page, offset }) => {
  const filter = { userId }

  if (type) {
    filter.type = type
  }

  if (from || to) {
    filter.recordedAt = {}
    if (from) filter.recordedAt.$gte = from
    if (to) filter.recordedAt.$lte = to
  }

  const skip = offset || (page ? (page - 1) * limit : 0)

  const [metrics, total] = await Promise.all([
    HealthMetric.find(filter).sort({ recordedAt: -1 }).skip(skip).limit(limit),
    HealthMetric.countDocuments(filter),
  ])

  return {
    metrics,
    total,
    limit,
    offset: skip,
    page: page ? page : Math.floor(skip / limit) + 1,
    totalPages: Math.ceil(total / limit),
  }
}

export const getLatestMetrics = async (userId) => {
  const types = [
    'steps',
    'heart_rate',
    'sleep',
    'stress',
    'weight',
    'blood_pressure',
    'blood_oxygen',
    'calories_burned',
  ]

  const promises = types.map((type) =>
    HealthMetric.findOne({ userId, type }).sort({ recordedAt: -1 }).exec()
  )

  const results = await Promise.all(promises)

  const latest = {}
  types.forEach((type, index) => {
    latest[type] = results[index]
  })

  return latest
}

export const getMetricSummary = async ({ userId, type, from, to, period }) => {
  const matchStage = {
    $match: {
      userId,
      type,
      recordedAt: { $gte: from, $lte: to },
    },
  }

  let groupId
  switch (period) {
    case 'daily':
      groupId = {
        year: { $year: '$recordedAt' },
        month: { $month: '$recordedAt' },
        day: { $dayOfMonth: '$recordedAt' },
      }
      break
    case 'weekly':
      groupId = {
        year: { $year: '$recordedAt' },
        week: { $week: '$recordedAt' },
      }
      break
    case 'monthly':
      groupId = {
        year: { $year: '$recordedAt' },
        month: { $month: '$recordedAt' },
      }
      break
    default:
      groupId = {
        year: { $year: '$recordedAt' },
        month: { $month: '$recordedAt' },
        day: { $dayOfMonth: '$recordedAt' },
      }
  }

  const groupStage = {
    $group: {
      _id: groupId,
      avg: { $avg: '$value' },
      min: { $min: '$value' },
      max: { $max: '$value' },
      sum: { $sum: '$value' },
      count: { $sum: 1 },
    },
  }

  const sortStage = {
    $sort: { _id: 1 },
  }

  const summary = await HealthMetric.aggregate([matchStage, groupStage, sortStage])

  return summary
}

export const deleteMetric = async ({ userId, metricId }) => {
  const metric = await HealthMetric.findOne({ _id: metricId, userId })

  if (!metric) {
    throw Object.assign(new Error('Metric not found'), { statusCode: 404 })
  }

  await HealthMetric.deleteOne({ _id: metricId })
  return { deleted: true }
}

export const bulkLogMetrics = async ({ userId, metrics }) => {
  const metricsWithUserId = metrics.map((metric) => ({
    ...metric,
    userId,
  }))

  const result = await HealthMetric.insertMany(metricsWithUserId)
  return { inserted: result.length }
}
