import { device, element, by, expect as detoxExpect } from 'detox'

describe('Auth Flow', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true })
  })

  beforeEach(async () => {
    await device.reloadReactNative()
  })

  it('should show the login screen on app open', async () => {
    await detoxExpect(element(by.testID('login-screen'))).toBeVisible()
    await detoxExpect(element(by.testID('email-input'))).toBeVisible()
    await detoxExpect(element(by.testID('password-input'))).toBeVisible()
    await detoxExpect(element(by.testID('login-button'))).toBeVisible()
  })

  it('should navigate to home tab after valid login', async () => {
    await element(by.testID('email-input')).clearText()
    await element(by.testID('email-input')).typeText('test@healthsync.app')

    await element(by.testID('password-input')).clearText()
    await element(by.testID('password-input')).typeText('ValidPass123!')

    await element(by.testID('login-button')).tap()

    // Home tab should be visible after successful auth
    await detoxExpect(element(by.testID('home-tab'))).toBeVisible()
  })

  it('should show an error toast for invalid credentials', async () => {
    await element(by.testID('email-input')).clearText()
    await element(by.testID('email-input')).typeText('bad@user.com')

    await element(by.testID('password-input')).clearText()
    await element(by.testID('password-input')).typeText('wrongpassword')

    await element(by.testID('login-button')).tap()

    // Error toast or inline error should appear
    await detoxExpect(element(by.testID('auth-error-toast'))).toBeVisible()
    await detoxExpect(element(by.testID('login-screen'))).toBeVisible() // still on login
  })
})
