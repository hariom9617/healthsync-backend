import { device, element, by, expect as detoxExpect, waitFor } from 'detox'

describe('Nutrition Flow', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true })
    // Log in before running nutrition tests
    await element(by.testID('email-input')).typeText('test@healthsync.app')
    await element(by.testID('password-input')).typeText('ValidPass123!')
    await element(by.testID('login-button')).tap()
    await waitFor(element(by.testID('home-tab')))
      .toBeVisible()
      .withTimeout(5000)
  })

  beforeEach(async () => {
    // Navigate to Fuel (Nutrition) tab before each test
    await element(by.testID('fuel-tab')).tap()
  })

  it('should display the Fuel tab with the macro donut chart', async () => {
    await detoxExpect(element(by.testID('fuel-screen'))).toBeVisible()
    await detoxExpect(element(by.testID('macro-donut-chart'))).toBeVisible()
  })

  it('should open the Log Meal modal when the button is tapped', async () => {
    await element(by.testID('log-meal-button')).tap()
    await detoxExpect(element(by.testID('log-meal-modal'))).toBeVisible()
    await detoxExpect(element(by.testID('meal-name-input'))).toBeVisible()
    await detoxExpect(element(by.testID('meal-calories-input'))).toBeVisible()
  })

  it('should log a meal and show it in the meal history list', async () => {
    // Open modal
    await element(by.testID('log-meal-button')).tap()
    await waitFor(element(by.testID('log-meal-modal')))
      .toBeVisible()
      .withTimeout(3000)

    // Fill the form
    await element(by.testID('meal-name-input')).typeText('Grilled Chicken Salad')
    await element(by.testID('meal-calories-input')).typeText('450')
    await element(by.testID('meal-protein-input')).typeText('40')
    await element(by.testID('meal-carbs-input')).typeText('20')
    await element(by.testID('meal-fat-input')).typeText('15')

    // Submit
    await element(by.testID('meal-type-selector')).tap()
    await element(by.testID('meal-type-lunch')).tap()
    await element(by.testID('submit-meal-button')).tap()

    // Modal should close and meal should appear in history
    await waitFor(element(by.testID('log-meal-modal')))
      .not.toBeVisible()
      .withTimeout(3000)

    await waitFor(element(by.text('Grilled Chicken Salad')))
      .toBeVisible()
      .withTimeout(5000)
  })
})
