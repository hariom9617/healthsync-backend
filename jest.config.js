export default {
  testEnvironment: 'node',
  testMatch: ['**/src/tests/unit/**/*.test.js'],
  setupFiles: ['./src/tests/setup.js'],

  // Redirect config/env imports to the test mock so tests don't need real env vars
  moduleNameMapper: {
    '^.+[/\\\\]config[/\\\\]env\\.js$': '<rootDir>/src/tests/mocks/config.mock.js',
  },

  // No transform needed — native ESM via --experimental-vm-modules
  transform: {},

  coverageThreshold: {
    global: {
      branches: 80,
      lines: 80,
    },
  },

  collectCoverageFrom: [
    'src/utils/**/*.js',
    'utils/**/*.js',
    '!src/utils/email.utils.js', // nodemailer-dependent, excluded from unit coverage
  ],
}
