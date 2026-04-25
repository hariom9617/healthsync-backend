/**
 * Sum calories and macros across an array of meal objects.
 * Missing macro fields default to 0.
 */
export function calculateDailySummary(meals) {
  return meals.reduce(
    (acc, meal) => {
      acc.totalCalories += meal.calories || 0
      acc.totalProtein += meal.protein || 0
      acc.totalCarbs += meal.carbs || 0
      acc.totalFat += meal.fat || 0
      return acc
    },
    { totalCalories: 0, totalProtein: 0, totalCarbs: 0, totalFat: 0 }
  )
}

/**
 * Convert gram totals to calorie-based macro percentages.
 * Protein/carbs = 4 kcal/g, fat = 9 kcal/g.
 */
export function calculateMacroPercentages(summary) {
  const proteinCals = (summary.totalProtein || 0) * 4
  const carbsCals = (summary.totalCarbs || 0) * 4
  const fatCals = (summary.totalFat || 0) * 9
  const total = proteinCals + carbsCals + fatCals

  if (total === 0) return { carbs: 0, protein: 0, fat: 0 }

  return {
    carbs: Math.round((carbsCals / total) * 100),
    protein: Math.round((proteinCals / total) * 100),
    fat: Math.round((fatCals / total) * 100),
  }
}

/**
 * Return calorie surplus (positive) or deficit (negative) vs goal.
 */
export function calorieDeficitSurplus(actualCalories, goalCalories) {
  return Number(actualCalories) - Number(goalCalories)
}
