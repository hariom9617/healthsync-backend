// Global test environment — runs before each test file, before any imports.
// Sets all process.env vars that modules read at load time.

process.env.ENCRYPTION_KEY = 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2'
process.env.ENCRYPTION_IV_LENGTH = '16'
process.env.NODE_ENV = 'test'
