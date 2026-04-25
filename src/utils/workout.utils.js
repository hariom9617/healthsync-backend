/**
 * Calculate workout duration in whole minutes from start/end timestamps.
 * Accepts Date objects or ISO strings.
 */
export function completeWorkoutSession(startTime, endTime) {
  const start = new Date(startTime)
  const end = new Date(endTime)
  const durationMs = end - start
  if (isNaN(durationMs) || durationMs < 0) {
    throw new Error('Invalid timestamps: end must be after start')
  }
  return Math.round(durationMs / 60000)
}

/**
 * Return only workouts matching the given type string.
 */
export function filterWorkoutsByType(workouts, type) {
  return workouts.filter((w) => w.type === type)
}

/**
 * Score and return the top 3 most relevant workouts for a user profile.
 * Scoring: +3 exact level match, +2 muscle group overlap with goals,
 * +1 no equipment required or equipment match.
 */
export function getRecommendedWorkouts(workouts, userProfile = {}) {
  const scored = workouts.map((w) => {
    let score = 0

    if ((w.level || '').toLowerCase() === (userProfile.experienceLevel || '').toLowerCase()) {
      score += 3
    }

    if (
      Array.isArray(userProfile.fitnessGoals) &&
      Array.isArray(w.muscleGroups) &&
      userProfile.fitnessGoals.some((g) => w.muscleGroups.includes(g))
    ) {
      score += 2
    }

    if (!w.equipment?.length || userProfile.equipment?.some((e) => w.equipment.includes(e))) {
      score += 1
    }

    return { ...w, _relevanceScore: score }
  })

  return scored.sort((a, b) => b._relevanceScore - a._relevanceScore).slice(0, 3)
}
