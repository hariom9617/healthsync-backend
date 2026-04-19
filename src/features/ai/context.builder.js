import User from '../../../models/User.model.js'
import HealthMetric from '../../../models/HealthMetric.model.js'
import Workout from '../../../models/Workout.model.js'
import Goal from '../../../models/Goal.model.js'

export const buildUserHealthContext = async (userId) => {
  try {
    const user = await User.findById(userId)
    if (!user) {
      return 'User not found'
    }

    // Get 7-day health metrics
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const recentMetrics = await HealthMetric.find({
      userId,
      recordedAt: { $gte: sevenDaysAgo },
    }).sort({ recordedAt: -1 })

    // Get 7-day workouts
    const recentWorkouts = await Workout.find({
      userId,
      completedAt: { $gte: sevenDaysAgo },
    }).sort({ completedAt: -1 })

    // Get active goals
    const activeGoals = await Goal.find({
      userId,
      status: 'active',
    })

    // Calculate averages and totals
    const avgSleep = recentMetrics
      .filter((m) => m.type === 'sleep')
      .reduce((sum, m, _, arr) => sum + m.value / arr.length, 0)

    const avgSteps = recentMetrics
      .filter((m) => m.type === 'steps')
      .reduce((sum, m, _, arr) => sum + m.value / arr.length, 0)

    const avgCalories = recentMetrics
      .filter((m) => m.type === 'calories_burned')
      .reduce((sum, m, _, arr) => sum + m.value / arr.length, 0)

    const totalWorkouts = recentWorkouts.length
    const totalWorkoutDuration = recentWorkouts.reduce((sum, w) => sum + w.duration, 0)

    // Build context string
    const context = []

    // Basic profile
    if (user.healthProfile) {
      const hp = user.healthProfile
      context.push(`Age: ${hp.age || 'Not specified'}`)
      context.push(`Gender: ${hp.gender || 'Not specified'}`)
      context.push(`Height: ${hp.heightCm || 'Not specified'}cm`)
      context.push(`Weight: ${hp.weightKg || 'Not specified'}kg`)
      if (hp.bmi) context.push(`BMI: ${hp.bmi}`)
      context.push(`Experience Level: ${hp.experienceLevel || 'Not specified'}`)
      context.push(`Activity Level: ${hp.activityLevel || 'Not specified'}`)
      if (hp.fitnessGoals?.length) {
        context.push(`Fitness Goals: ${hp.fitnessGoals.join(', ')}`)
      }
      if (hp.equipment?.length) {
        context.push(`Available Equipment: ${hp.equipment.join(', ')}`)
      }
      if (hp.dietaryPreferences?.length) {
        context.push(`Dietary Preferences: ${hp.dietaryPreferences.join(', ')}`)
      }
    }

    // Recent activity (last 7 days)
    context.push('\nRecent Activity (Last 7 Days):')
    if (avgSleep) context.push(`Average Sleep: ${avgSleep.toFixed(1)} hours/night`)
    if (avgSteps) context.push(`Average Daily Steps: ${Math.round(avgSteps).toLocaleString()}`)
    if (avgCalories)
      context.push(`Average Daily Calories Burned: ${Math.round(avgCalories).toLocaleString()}`)
    context.push(`Workouts Completed: ${totalWorkouts}`)
    if (totalWorkoutDuration > 0) {
      context.push(`Total Workout Duration: ${totalWorkoutDuration} minutes`)
    }

    // Active goals
    if (activeGoals.length > 0) {
      context.push('\nActive Goals:')
      activeGoals.forEach((goal) => {
        const progress =
          goal.currentValue && goal.targetValue
            ? Math.round((goal.currentValue / goal.targetValue) * 100)
            : 0
        context.push(`- ${goal.title}: ${progress}% complete`)
      })
    }

    // PAR-Q considerations
    if (user.healthProfile?.parQ) {
      const parQ = user.healthProfile.parQ
      const concerns = []
      if (parQ.chronicConditions) concerns.push('chronic conditions')
      if (parQ.currentInjuries) concerns.push('current injuries')
      if (parQ.regularMedications) concerns.push('regular medications')
      if (parQ.heartOrChestPain) concerns.push('heart/chest pain')
      if (parQ.dizzinessOrFainting) concerns.push('dizziness/fainting')

      if (concerns.length > 0) {
        context.push(`\nHealth Considerations: ${concerns.join(', ')}`)
        if (parQ.consultDoctorRecommended) {
          context.push('Doctor consultation recommended for exercise program')
        }
      }
    }

    return context.join('\n')
  } catch (error) {
    console.error('Error building user health context:', error)
    return 'Unable to retrieve health context'
  }
}
