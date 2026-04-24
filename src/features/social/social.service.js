import Activity from '../../../models/Activity.model.js'
import User from '../../../models/User.model.js'

const formatTimeAgo = (date) => {
  const seconds = Math.floor((new Date() - date) / 1000)

  let interval = seconds / 31536000
  if (interval > 1) return Math.floor(interval) + 'y ago'

  interval = seconds / 2592000
  if (interval > 1) return Math.floor(interval) + 'mo ago'

  interval = seconds / 86400
  if (interval > 1) return Math.floor(interval) + 'd ago'

  interval = seconds / 3600
  if (interval > 1) return Math.floor(interval) + 'h ago'

  interval = seconds / 60
  if (interval > 1) return Math.floor(interval) + 'm ago'

  return 'just now'
}

export const getFeed = async (userId) => {
  // Get user's connections (for now, return all public activities)
  const activities = await Activity.find({
    isPublic: true,
  })
    .sort({ createdAt: -1 })
    .limit(20)
    .populate('userId', 'firstName lastName avatar')
    .populate('kudos.userId', 'firstName lastName')

  return activities.map((activity) => ({
    _id: activity._id,
    userId: activity.userId._id,
    userName: `${activity.userId.firstName} ${activity.userId.lastName}`,
    userInitials: `${activity.userId.firstName[0]}${activity.userId.lastName[0]}`,
    activity: activity.type,
    description: activity.description,
    time: formatTimeAgo(activity.createdAt),
    location: activity.location,
    kudosCount: activity.kudos?.length || 0,
    isRecord: activity.isRecord,
    metrics: activity.metrics,
    userKudos: activity.kudos.some((kudo) => kudo.userId.toString() === userId),
  }))
}

export const giveKudos = async (userId, postId) => {
  const activity = await Activity.findById(postId)

  if (!activity) {
    throw Object.assign(new Error('Activity not found'), { statusCode: 404 })
  }

  // Check if user already gave kudos
  const existingKudos = activity.kudos.find((kudo) => kudo.userId.toString() === userId)

  if (existingKudos) {
    // Remove kudos
    activity.kudos = activity.kudos.filter((kudo) => kudo.userId.toString() !== userId)
  } else {
    // Add kudos
    activity.kudos.push({ userId })
  }

  await activity.save()

  return {
    kudosCount: activity.kudos.length,
    userKudos: !existingKudos,
  }
}

export const getWeeklyStepsLeaderboard = async () => {
  const weekStart = new Date()
  weekStart.setDate(weekStart.getDate() - weekStart.getDay())
  weekStart.setHours(0, 0, 0, 0)

  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekEnd.getDate() + 7)

  // Get steps metrics for the week
  const stepsAggregation = await Activity.aggregate([
    {
      $match: {
        type: 'workout',
        'metrics.steps': { $exists: true, $gt: 0 },
        createdAt: { $gte: weekStart, $lt: weekEnd },
      },
    },
    {
      $group: {
        _id: '$userId',
        totalSteps: { $sum: '$metrics.steps' },
        activityCount: { $sum: 1 },
      },
    },
    {
      $sort: { totalSteps: -1 },
    },
    {
      $limit: 10,
    },
  ])

  // Populate user information
  const leaderboard = await Promise.all(
    stepsAggregation.map(async (entry, index) => {
      const user = await User.findById(entry._id).select('firstName lastName avatar')

      // Calculate trend (simplified - compare to previous week)
      const previousWeekStart = new Date(weekStart)
      previousWeekStart.setDate(previousWeekStart.getDate() - 7)

      const previousWeekEnd = new Date(weekEnd)
      previousWeekEnd.setDate(previousWeekEnd.getDate() - 7)

      const previousWeekSteps = await Activity.aggregate([
        {
          $match: {
            userId: entry._id,
            type: 'workout',
            'metrics.steps': { $exists: true, $gt: 0 },
            createdAt: { $gte: previousWeekStart, $lt: previousWeekEnd },
          },
        },
        {
          $group: {
            _id: null,
            totalSteps: { $sum: '$metrics.steps' },
          },
        },
      ])

      const previousSteps = previousWeekSteps[0]?.totalSteps || 0
      const trend =
        previousSteps > 0
          ? Math.round(((entry.totalSteps - previousSteps) / previousSteps) * 100)
          : 0

      return {
        rank: index + 1,
        userId: entry._id,
        userName: user ? `${user.firstName} ${user.lastName}` : 'Unknown User',
        steps: entry.totalSteps,
        trend: trend > 0 ? `+${trend}%` : `${trend}%`,
        avatar: user?.avatar || '',
      }
    })
  )

  return leaderboard
}
