import {
  completeWorkoutSession,
  filterWorkoutsByType,
  getRecommendedWorkouts,
} from '../../utils/workout.utils.js'

// ── completeWorkoutSession ────────────────────────────────────────────────────

describe('completeWorkoutSession', () => {
  it('calculates correct duration in minutes from Date objects', () => {
    const start = new Date('2026-04-25T09:00:00Z')
    const end = new Date('2026-04-25T09:45:00Z')
    expect(completeWorkoutSession(start, end)).toBe(45)
  })

  it('handles ISO string timestamps', () => {
    expect(completeWorkoutSession('2026-04-25T10:00:00Z', '2026-04-25T10:30:00Z')).toBe(30)
  })

  it('rounds partial minutes', () => {
    const start = new Date('2026-04-25T09:00:00Z')
    const end = new Date('2026-04-25T09:00:45Z') // 45 seconds
    expect(completeWorkoutSession(start, end)).toBe(1)
  })

  it('throws when end is before start (negative duration)', () => {
    expect(() => completeWorkoutSession('2026-04-25T10:30:00Z', '2026-04-25T10:00:00Z')).toThrow()
  })
})

// ── filterWorkoutsByType ──────────────────────────────────────────────────────

const SAMPLE_WORKOUTS = [
  { id: 1, type: 'HIIT', name: 'HIIT Blast', level: 'Beginner' },
  { id: 2, type: 'Strength', name: 'Upper Body', level: 'Intermediate' },
  { id: 3, type: 'HIIT', name: 'Cardio Burn', level: 'Beginner' },
  { id: 4, type: 'Yoga', name: 'Morning Flow', level: 'Beginner' },
]

describe('filterWorkoutsByType', () => {
  it('returns the correct subset for a given type', () => {
    const result = filterWorkoutsByType(SAMPLE_WORKOUTS, 'HIIT')
    expect(result).toHaveLength(2)
    expect(result.every((w) => w.type === 'HIIT')).toBe(true)
  })

  it('returns an empty array when no workouts match', () => {
    expect(filterWorkoutsByType(SAMPLE_WORKOUTS, 'Pilates')).toHaveLength(0)
  })

  it('returns all matching entries, not just the first', () => {
    const result = filterWorkoutsByType(SAMPLE_WORKOUTS, 'HIIT')
    expect(result.map((w) => w.id)).toEqual([1, 3])
  })
})

// ── getRecommendedWorkouts ────────────────────────────────────────────────────

const WORKOUT_POOL = [
  {
    id: 1,
    type: 'HIIT',
    level: 'Beginner',
    muscleGroups: ['core', 'legs'],
    equipment: [],
  },
  {
    id: 2,
    type: 'Strength',
    level: 'Intermediate',
    muscleGroups: ['chest'],
    equipment: ['dumbbells'],
  },
  {
    id: 3,
    type: 'Cardio',
    level: 'Beginner',
    muscleGroups: ['legs', 'glutes'],
    equipment: [],
  },
  {
    id: 4,
    type: 'Yoga',
    level: 'Beginner',
    muscleGroups: ['core'],
    equipment: [],
  },
  {
    id: 5,
    type: 'Strength',
    level: 'Advanced',
    muscleGroups: ['back'],
    equipment: ['full_gym'],
  },
]

describe('getRecommendedWorkouts', () => {
  it('returns at most 3 results', () => {
    const profile = { experienceLevel: 'Beginner', fitnessGoals: ['core'], equipment: [] }
    const result = getRecommendedWorkouts(WORKOUT_POOL, profile)
    expect(result.length).toBeLessThanOrEqual(3)
  })

  it('ranks exact level match higher than mismatched level', () => {
    const profile = { experienceLevel: 'Beginner', fitnessGoals: [], equipment: [] }
    const result = getRecommendedWorkouts(WORKOUT_POOL, profile)
    expect(result[0].level).toBe('Beginner')
  })

  it('sorts by relevance — muscle group overlap improves rank', () => {
    const profile = {
      experienceLevel: 'Beginner',
      fitnessGoals: ['core'],
      equipment: [],
    }
    const result = getRecommendedWorkouts(WORKOUT_POOL, profile)
    // id:1 (Beginner + core) and id:4 (Beginner + core) should outrank id:3
    const topIds = result.map((w) => w.id)
    expect(topIds).toContain(1)
    expect(topIds).toContain(4)
  })

  it('works with an empty profile (no errors)', () => {
    expect(() => getRecommendedWorkouts(WORKOUT_POOL, {})).not.toThrow()
  })
})
