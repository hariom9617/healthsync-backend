import {
  calculateDailySummary,
  calculateMacroPercentages,
  calorieDeficitSurplus,
} from '../../utils/nutrition.utils.js'

// ── calculateDailySummary ─────────────────────────────────────────────────────

describe('calculateDailySummary', () => {
  it('correctly sums calories from a meal array', () => {
    const meals = [
      { calories: 400, protein: 30, carbs: 50, fat: 10 },
      { calories: 600, protein: 40, carbs: 70, fat: 20 },
    ]
    const result = calculateDailySummary(meals)
    expect(result.totalCalories).toBe(1000)
    expect(result.totalProtein).toBe(70)
    expect(result.totalCarbs).toBe(120)
    expect(result.totalFat).toBe(30)
  })

  it('returns all-zero summary for an empty array', () => {
    const result = calculateDailySummary([])
    expect(result).toEqual({ totalCalories: 0, totalProtein: 0, totalCarbs: 0, totalFat: 0 })
  })

  it('treats missing macro fields as 0', () => {
    const meals = [{ calories: 200 }, { calories: 300, protein: 15 }]
    const result = calculateDailySummary(meals)
    expect(result.totalCalories).toBe(500)
    expect(result.totalProtein).toBe(15)
    expect(result.totalCarbs).toBe(0)
    expect(result.totalFat).toBe(0)
  })

  it('handles a single meal', () => {
    const meals = [{ calories: 350, protein: 25, carbs: 40, fat: 12 }]
    const result = calculateDailySummary(meals)
    expect(result.totalCalories).toBe(350)
  })
})

// ── calculateMacroPercentages ─────────────────────────────────────────────────

describe('calculateMacroPercentages', () => {
  it('returns correct CARBS / PROT / FAT percentages', () => {
    // protein: 100g × 4 = 400 kcal
    // carbs:   200g × 4 = 800 kcal
    // fat:      50g × 9 = 450 kcal
    // total = 1650 kcal
    const summary = { totalProtein: 100, totalCarbs: 200, totalFat: 50 }
    const result = calculateMacroPercentages(summary)
    expect(result.protein).toBe(Math.round((400 / 1650) * 100))
    expect(result.carbs).toBe(Math.round((800 / 1650) * 100))
    expect(result.fat).toBe(Math.round((450 / 1650) * 100))
  })

  it('returns { carbs: 0, protein: 0, fat: 0 } when all macros are zero', () => {
    expect(calculateMacroPercentages({ totalProtein: 0, totalCarbs: 0, totalFat: 0 })).toEqual({
      carbs: 0,
      protein: 0,
      fat: 0,
    })
  })

  it('percentages sum to approximately 100', () => {
    const result = calculateMacroPercentages({ totalProtein: 50, totalCarbs: 150, totalFat: 40 })
    const sum = result.carbs + result.protein + result.fat
    // Rounding may cause ±1 off
    expect(sum).toBeGreaterThanOrEqual(99)
    expect(sum).toBeLessThanOrEqual(101)
  })
})

// ── calorieDeficitSurplus ─────────────────────────────────────────────────────

describe('calorieDeficitSurplus', () => {
  it('returns positive value when actual > goal (surplus)', () => {
    expect(calorieDeficitSurplus(2500, 2000)).toBe(500)
  })

  it('returns negative value when actual < goal (deficit)', () => {
    expect(calorieDeficitSurplus(1500, 2000)).toBe(-500)
  })

  it('returns 0 when actual equals goal', () => {
    expect(calorieDeficitSurplus(2000, 2000)).toBe(0)
  })

  it('accepts numeric strings (coerces to number)', () => {
    expect(calorieDeficitSurplus('2200', '2000')).toBe(200)
  })
})
