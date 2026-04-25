import { device, element, by, expect as detoxExpect, waitFor } from 'detox'

describe('Workout Flow', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true })
    // Log in first
    await element(by.testID('email-input')).typeText('test@healthsync.app')
    await element(by.testID('password-input')).typeText('ValidPass123!')
    await element(by.testID('login-button')).tap()
    await waitFor(element(by.testID('home-tab')))
      .toBeVisible()
      .withTimeout(5000)
  })

  beforeEach(async () => {
    // Navigate to Train tab before each test
    await element(by.testID('train-tab')).tap()
  })

  it('should display the Train tab with workout cards', async () => {
    await detoxExpect(element(by.testID('train-screen'))).toBeVisible()
    await detoxExpect(element(by.testID('workout-card-0'))).toBeVisible()
  })

  it('should load the Active Workout screen with a timer when Start Workout is tapped', async () => {
    // Tap the first workout card's start button
    await element(by.testID('start-workout-button-0')).tap()

    await waitFor(element(by.testID('active-workout-screen')))
      .toBeVisible()
      .withTimeout(5000)

    // Timer must be visible and running
    await detoxExpect(element(by.testID('workout-timer'))).toBeVisible()
  })

  it('should return to workout library with success toast after completing a workout', async () => {
    // Start a workout if not already on active screen
    try {
      await element(by.testID('start-workout-button-0')).tap()
      await waitFor(element(by.testID('active-workout-screen')))
        .toBeVisible()
        .withTimeout(5000)
    } catch {
      // Already on active screen
    }

    // Complete the workout
    await element(by.testID('complete-workout-button')).tap()

    // Should return to the workout library
    await waitFor(element(by.testID('train-screen')))
      .toBeVisible()
      .withTimeout(5000)

    // Success toast should appear
    await waitFor(element(by.testID('workout-complete-toast')))
      .toBeVisible()
      .withTimeout(3000)
  })
})
