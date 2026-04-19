import User from '../../models/User.model.js'

export const saveStep1 = async ({ userId, age, gender, heightCm, weightKg }) => {
  const user = await User.findById(userId)
  if (!user) {
    throw Object.assign(new Error('User not found'), { statusCode: 404 })
  }

  if (!user.healthProfile) {
    user.healthProfile = {}
  }

  user.healthProfile.age = age
  user.healthProfile.gender = gender
  user.healthProfile.heightCm = heightCm
  user.healthProfile.weightKg = weightKg

  await user.save()
  return user.healthProfile
}

export const saveStep2 = async ({
  userId,
  experienceLevel,
  activityLevel,
  fitnessGoals,
  equipment,
}) => {
  const user = await User.findById(userId)
  if (!user) {
    throw Object.assign(new Error('User not found'), { statusCode: 404 })
  }

  if (!user.healthProfile) {
    user.healthProfile = {}
  }

  user.healthProfile.experienceLevel = experienceLevel
  user.healthProfile.activityLevel = activityLevel
  user.healthProfile.fitnessGoals = fitnessGoals
  user.healthProfile.equipment = equipment

  await user.save()
  return user.healthProfile
}

export const saveStep3 = async ({ userId, parQ, dietaryPreferences }) => {
  const user = await User.findById(userId)
  if (!user) {
    throw Object.assign(new Error('User not found'), { statusCode: 404 })
  }

  if (!user.healthProfile) {
    user.healthProfile = {}
  }

  user.healthProfile.parQ = parQ
  user.healthProfile.dietaryPreferences = dietaryPreferences

  await user.save()
  return user.healthProfile
}

export const completeOnboarding = async (userId) => {
  const user = await User.findById(userId)
  if (!user) {
    throw Object.assign(new Error('User not found'), { statusCode: 404 })
  }

  const profile = user.healthProfile
  if (!profile) {
    throw Object.assign(new Error('Please complete all onboarding steps'), { statusCode: 400 })
  }

  const step1Complete = !!(profile.age && profile.gender && profile.heightCm && profile.weightKg)
  const step2Complete = !!(
    profile.experienceLevel &&
    profile.activityLevel &&
    profile.fitnessGoals?.length
  )
  const step3Complete = !!(profile.parQ && profile.dietaryPreferences?.length)

  if (!step1Complete || !step2Complete || !step3Complete) {
    throw Object.assign(new Error('Please complete all onboarding steps'), { statusCode: 400 })
  }

  user.isOnboardingComplete = true
  await user.save()

  return { isOnboardingComplete: true, healthProfile: user.healthProfile }
}

export const getOnboardingStatus = async (userId) => {
  const user = await User.findById(userId)
  if (!user) {
    throw Object.assign(new Error('User not found'), { statusCode: 404 })
  }

  const profile = user.healthProfile
  const completedSteps = {
    step1: !!(profile?.age && profile?.gender && profile?.heightCm && profile?.weightKg),
    step2: !!(profile?.experienceLevel && profile?.activityLevel && profile?.fitnessGoals?.length),
    step3: !!profile?.dietaryPreferences?.length,
  }

  return {
    isOnboardingComplete: user.isOnboardingComplete,
    healthProfile: profile,
    completedSteps,
  }
}
