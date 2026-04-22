import HealthMetric from '../../../models/HealthMetric.model.js'
import Workout from '../../../models/Workout.model.js'
import Nutrition from '../../../models/Nutrition.model.js'

export const getWeeklySummary = async (req, res) => {
  try {
    const now = new Date()
    const currentWeekStart = new Date(now)
    currentWeekStart.setDate(now.getDate() - now.getDay() + 1) // Monday
    currentWeekStart.setUTCHours(0, 0, 0, 0)

    const lastWeekStart = new Date(currentWeekStart)
    lastWeekStart.setDate(lastWeekStart.getDate() - 7)
    const lastWeekEnd = new Date(currentWeekStart)
    lastWeekEnd.setMilliseconds(lastWeekEnd.getMilliseconds() - 1)

    // Get current week metrics
    const currentWeekMetrics = await HealthMetric.aggregate([
      {
        $match: {
          userId: req.user._id,
          recordedAt: { $gte: currentWeekStart },
        },
      },
      {
        $group: {
          _id: '$type',
          avgValue: { $avg: '$value' },
          totalValue: { $sum: '$value' },
          count: { $sum: 1 },
          latest: { $max: '$recordedAt' },
        },
      },
    ])

    // Get last week metrics for comparison
    const lastWeekMetrics = await HealthMetric.aggregate([
      {
        $match: {
          userId: req.user._id,
          recordedAt: { $gte: lastWeekStart, $lt: lastWeekEnd },
        },
      },
      {
        $group: {
          _id: '$type',
          avgValue: { $avg: '$value' },
          totalValue: { $sum: '$value' },
          count: { $sum: 1 },
        },
      },
    ])

    // Get current week workouts
    const currentWeekWorkouts = await Workout.find({
      userId: req.user._id,
      completedAt: { $gte: currentWeekStart },
    })

    const lastWeekWorkouts = await Workout.find({
      userId: req.user._id,
      completedAt: { $gte: lastWeekStart, $lt: lastWeekEnd },
    })

    // Process metrics data
    const currentWeekData = {}
    currentWeekMetrics.forEach((metric) => {
      currentWeekData[metric._id] = metric
    })

    const lastWeekData = {}
    lastWeekMetrics.forEach((metric) => {
      lastWeekData[metric._id] = metric
    })

    // Calculate comparisons
    const stepsCurrent = currentWeekData.steps?.totalValue || 0
    const stepsLast = lastWeekData.steps?.totalValue || 0
    const stepsDelta = stepsCurrent - stepsLast

    const weightCurrent = currentWeekData.weight?.avgValue || 0
    const weightLast = lastWeekData.weight?.avgValue || 0
    const weightDelta = weightCurrent - weightLast

    const sleepCurrent = currentWeekData.sleep?.avgValue || 0
    const sleepLast = lastWeekData.sleep?.avgValue || 0
    const sleepDelta = sleepCurrent - sleepLast

    const heartRateCurrent = currentWeekData.heart_rate?.avgValue || 0
    const heartRateLast = lastWeekData.heart_rate?.avgValue || 0
    const heartRateDelta = heartRateCurrent - heartRateLast

    const workoutsCurrent = currentWeekWorkouts.length
    const workoutsLast = lastWeekWorkouts.length
    const workoutsDelta = workoutsCurrent - workoutsLast

    res.json({
      success: true,
      data: {
        currentWeek: {
          start: currentWeekStart.toISOString().split('T')[0],
          avgStepsPerDay: Math.round(stepsCurrent / 7),
          weightDelta: Math.round(weightDelta * 100) / 100,
          sleepQuality: Math.round(sleepCurrent),
          restingHeartRate: Math.round(heartRateCurrent),
          workoutsCompleted: workoutsCurrent,
          totalCaloriesBurned: currentWeekWorkouts.reduce((sum, w) => sum + (w.calories || 0), 0),
        },
        lastWeek: {
          start: lastWeekStart.toISOString().split('T')[0],
          avgStepsPerDay: Math.round(stepsLast / 7),
          weightDelta: Math.round(weightDelta * 100) / 100,
          sleepQuality: Math.round(sleepLast),
          restingHeartRate: Math.round(heartRateLast),
          workoutsCompleted: workoutsLast,
        },
        comparisons: {
          stepsDelta,
          weightDelta,
          sleepDelta,
          heartRateDelta,
          workoutsDelta,
        },
      },
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch weekly summary',
    })
  }
}

export const getStreaks = async (req, res) => {
  try {
    // Get all activity dates for the user
    const activities = await HealthMetric.aggregate([
      {
        $match: {
          userId: req.user._id,
          recordedAt: { $gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) }, // Last 90 days
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$recordedAt' } },
          metrics: { $addToSet: '$type' },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { _id: -1 },
      },
    ])

    // Add workout dates
    const workoutDates = await Workout.aggregate([
      {
        $match: {
          userId: req.user._id,
          completedAt: { $gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$completedAt' } },
          count: { $sum: 1 },
        },
      },
    ])

    // Combine all activity dates
    const allDates = new Set()
    activities.forEach((activity) => allDates.add(activity._id))
    workoutDates.forEach((workout) => allDates.add(workout._id))

    const sortedDates = Array.from(allDates).sort().reverse()

    // Calculate current streak
    let currentStreak = 0
    const today = new Date().toISOString().split('T')[0]
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    let checkDate = today
    if (!allDates.has(today)) {
      if (!allDates.has(yesterday)) {
        // No activity today or yesterday, streak is 0
        currentStreak = 0
      } else {
        // No activity today, but activity yesterday, start from yesterday
        checkDate = yesterday
        currentStreak = 1
      }
    }

    if (currentStreak === 0 && allDates.has(today)) {
      currentStreak = 1
      checkDate = today
    }

    if (currentStreak > 0) {
      let continueLoop = true
      while (continueLoop) {
        const nextDate = new Date(checkDate)
        nextDate.setDate(nextDate.getDate() - 1)
        const nextDateStr = nextDate.toISOString().split('T')[0]

        if (allDates.has(nextDateStr)) {
          currentStreak++
          checkDate = nextDateStr
        } else {
          continueLoop = false
        }
      }
    }

    // Calculate longest streak
    let longestStreak = 0
    let tempStreak = 0

    for (let i = 0; i < sortedDates.length; i++) {
      if (i === 0) {
        tempStreak = 1
      } else {
        const currentDate = new Date(sortedDates[i])
        const prevDate = new Date(sortedDates[i - 1])
        const daysDiff = Math.floor((currentDate - prevDate) / (1000 * 60 * 60 * 24))

        if (daysDiff === 1) {
          tempStreak++
        } else {
          longestStreak = Math.max(longestStreak, tempStreak)
          tempStreak = 1
        }
      }
    }
    longestStreak = Math.max(longestStreak, tempStreak)

    res.json({
      success: true,
      data: {
        currentStreak,
        longestStreak,
        totalActiveDays: allDates.size,
        lastActiveDate: sortedDates[0] || null,
      },
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch streaks',
    })
  }
}

export const exportMonthlyData = async (req, res) => {
  try {
    const { month } = req.query
    if (!month) {
      return res.status(400).json({
        success: false,
        message: 'Month parameter is required (YYYY-MM)',
      })
    }

    const monthStart = new Date(month + '-01')
    monthStart.setUTCHours(0, 0, 0, 0)

    const monthEnd = new Date(monthStart)
    monthEnd.setMonth(monthEnd.getMonth() + 1)
    monthEnd.setMilliseconds(monthEnd.getMilliseconds() - 1)

    // Get metrics for the month
    const metrics = await HealthMetric.aggregate([
      {
        $match: {
          userId: req.user._id,
          recordedAt: { $gte: monthStart, $lt: monthEnd },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$recordedAt' } },
          metrics: {
            $push: {
              type: '$type',
              value: '$value',
              unit: '$unit',
              recordedAt: '$recordedAt',
            },
          },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ])

    // Get workouts for the month
    const workouts = await Workout.find({
      userId: req.user._id,
      completedAt: { $gte: monthStart, $lt: monthEnd },
    }).sort({ completedAt: 1 })

    // Get nutrition data for the month
    const nutrition = await Nutrition.aggregate([
      {
        $match: {
          userId: req.user._id,
          recordedAt: { $gte: monthStart, $lt: monthEnd },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$recordedAt' } },
          totalCalories: { $sum: '$calories' },
          meals: { $push: '$$ROOT' },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ])

    // Calculate monthly summary
    const totalWorkouts = workouts.length
    const totalCaloriesBurned = workouts.reduce((sum, w) => sum + (w.calories || 0), 0)
    const totalCaloriesConsumed = nutrition.reduce((sum, n) => sum + n.totalCalories, 0)
    const netCalories = totalCaloriesConsumed - totalCaloriesBurned

    const monthlySummary = {
      month,
      period: {
        start: monthStart.toISOString(),
        end: monthEnd.toISOString(),
      },
      summary: {
        totalWorkouts,
        totalCaloriesBurned,
        totalCaloriesConsumed,
        netCalories,
        avgWorkoutsPerWeek: Math.round((totalWorkouts / 30) * 7 * 10) / 10,
      },
      data: {
        metrics,
        workouts,
        nutrition,
      },
    }

    res.json({
      success: true,
      data: monthlySummary,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to export monthly data',
    })
  }
}
