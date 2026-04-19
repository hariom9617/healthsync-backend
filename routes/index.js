import authRoutes from './auth.routes.js'
import healthMetricRoutes from './healthMetric.routes.js'
import workoutRoutes from './workout.routes.js'
import goalRoutes from './goal.routes.js'
import nutritionRoutes from './nutrition.routes.js'
import onboardingRoutes from './onboarding.routes.js'

export const registerRoutes = (app) => {
  app.use('/api/auth', authRoutes)
  app.use('/api/metrics', healthMetricRoutes)
  app.use('/api/workouts', workoutRoutes)
  app.use('/api/goals', goalRoutes)
  app.use('/api/nutrition', nutritionRoutes)
  app.use('/api/onboarding', onboardingRoutes)
}
