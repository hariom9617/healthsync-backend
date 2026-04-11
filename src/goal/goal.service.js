import Goal from '../../models/Goal.model.js'

export const createGoal = async ({
  userId,
  type,
  title,
  description,
  targetValue,
  unit,
  period,
  deadline,
  isPublic,
}) => {
  const goal = await Goal.create({
    userId,
    type,
    title,
    description,
    targetValue,
    unit,
    period,
    deadline,
    isPublic: isPublic || false,
  })

  return goal
}

export const getGoals = async ({ userId, status, type, limit, page }) => {
  const filter = { userId }

  if (status) {
    filter.status = status
  }

  if (type) {
    filter.type = type
  }

  const skip = (page - 1) * limit

  const [goals, total] = await Promise.all([
    Goal.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Goal.countDocuments(filter),
  ])

  return {
    goals,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  }
}

export const getGoalById = async ({ userId, goalId }) => {
  const goal = await Goal.findOne({ _id: goalId, userId })

  if (!goal) {
    throw Object.assign(new Error('Goal not found'), { statusCode: 404 })
  }

  return goal
}

export const updateGoalProgress = async ({ userId, goalId, currentValue }) => {
  const goal = await Goal.findOne({ _id: goalId, userId })

  if (!goal) {
    throw Object.assign(new Error('Goal not found'), { statusCode: 404 })
  }

  goal.currentValue = currentValue
  await goal.save()

  return goal
}

export const updateGoal = async ({ userId, goalId, updates }) => {
  const goal = await Goal.findOne({ _id: goalId, userId })

  if (!goal) {
    throw Object.assign(new Error('Goal not found'), { statusCode: 404 })
  }

  const allowedFields = ['title', 'description', 'targetValue', 'deadline', 'status', 'isPublic']
  const validUpdates = {}

  Object.keys(updates).forEach((key) => {
    if (allowedFields.includes(key)) {
      validUpdates[key] = updates[key]
    }
  })

  Object.assign(goal, validUpdates)
  await goal.save()

  return goal
}

export const deleteGoal = async ({ userId, goalId }) => {
  const goal = await Goal.findOne({ _id: goalId, userId })

  if (!goal) {
    throw Object.assign(new Error('Goal not found'), { statusCode: 404 })
  }

  await Goal.deleteOne({ _id: goalId })
  return { deleted: true }
}

export const getPublicGoals = async ({ limit, page }) => {
  const filter = { isPublic: true, status: 'active' }
  const skip = (page - 1) * limit

  const [goals, total] = await Promise.all([
    Goal.find(filter)
      .populate('userId', 'firstName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Goal.countDocuments(filter),
  ])

  return {
    goals,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  }
}
