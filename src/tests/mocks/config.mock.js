// Stub for config/env.js — used by jest moduleNameMapper in unit tests.
// Provides the minimal config shape that utils/jwt.utils.js requires.

export const config = {
  jwt: {
    accessSecret: 'test-access-secret-32-chars-for-jwt',
    refreshSecret: 'test-refresh-secret-32-chars-long',
    accessExpires: '15m',
    refreshExpires: '7d',
  },
  nodeEnv: 'test',
  clientUrl: 'http://localhost:3000',
}
