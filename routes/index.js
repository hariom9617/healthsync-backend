import nutritionRoutes from '../src/features/nutrition/nutrition.routes.js'
import workoutLibraryRoutes from '../src/features/workout-library/workoutLibrary.routes.js'
import workoutSessionRoutes from '../src/features/workout-sessions/workoutSession.routes.js'
import socialRoutes from '../src/features/social/social.routes.js'
import trendsRoutes from '../src/features/trends/trends.routes.js'
import foodScannerRoutes from '../src/features/food-scanner/foodScanner.routes.js'
import challengesRoutes from '../src/features/challenges/challenges.routes.js'
import integrationsRoutes from '../src/features/integrations/integrations.routes.js'
import notificationRoutes from '../src/features/notifications/notification.routes.js'
import aiRoutes from '../src/features/ai/ai.routes.js'
import authRoutes from './auth.routes.js'
import healthMetricRoutes from './healthMetric.routes.js'
import workoutRoutes from './workout.routes.js'
import goalRoutes from './goal.routes.js'
import nutritionRoutesOld from './nutrition.routes.js'
import onboardingRoutes from './onboarding.routes.js'

export const registerRoutes = (app) => {
  app.use('/api/auth', authRoutes)
  app.use('/api/metrics', healthMetricRoutes)
  app.use('/api/workouts', workoutRoutes)
  app.use('/api/goals', goalRoutes)
  app.use('/api/nutrition', nutritionRoutesOld)
  app.use('/api/nutrition', nutritionRoutes)
  app.use('/api/onboarding', onboardingRoutes)
  app.use('/api/ai', aiRoutes)
  app.use('/api/notifications', notificationRoutes)
  app.use('/api/workout-library', workoutLibraryRoutes)
  app.use('/api/workout-sessions', workoutSessionRoutes)
  app.use('/api/social', socialRoutes)
  app.use('/api/trends', trendsRoutes)
  app.use('/api/food-scanner', foodScannerRoutes)
  app.use('/api/challenges', challengesRoutes)
  app.use('/api/integrations', integrationsRoutes)
}
