import jwt from 'jsonwebtoken'
import { generateAccessToken, verifyAccessToken } from '../../../utils/jwt.utils.js'
import { hashPassword, comparePassword } from '../../utils/auth.utils.js'

// The config mock (via moduleNameMapper) supplies the test secrets used by jwt.utils.js.
// We mirror the same secret here so we can craft controlled tokens in tests.
const TEST_ACCESS_SECRET = 'test-access-secret-32-chars-for-jwt'

const TEST_PAYLOAD = { id: 'user123', email: 'test@example.com', role: 'user' }

// ── JWT ───────────────────────────────────────────────────────────────────────

describe('generateAccessToken', () => {
  it('creates a string with three dot-separated JWT segments', () => {
    const token = generateAccessToken(TEST_PAYLOAD)
    expect(typeof token).toBe('string')
    expect(token.split('.')).toHaveLength(3)
  })

  it('embeds the correct payload fields', () => {
    const token = generateAccessToken(TEST_PAYLOAD)
    const decoded = verifyAccessToken(token)
    expect(decoded.id).toBe(TEST_PAYLOAD.id)
    expect(decoded.email).toBe(TEST_PAYLOAD.email)
    expect(decoded.role).toBe(TEST_PAYLOAD.role)
  })

  it('includes an expiry claim (exp)', () => {
    const token = generateAccessToken(TEST_PAYLOAD)
    const decoded = verifyAccessToken(token)
    expect(decoded.exp).toBeDefined()
    expect(decoded.exp).toBeGreaterThan(Math.floor(Date.now() / 1000))
  })
})

describe('verifyAccessToken', () => {
  it('returns the payload for a valid token', () => {
    const token = generateAccessToken(TEST_PAYLOAD)
    const decoded = verifyAccessToken(token)
    expect(decoded.id).toBe(TEST_PAYLOAD.id)
  })

  it('throws JsonWebTokenError for a tampered token', () => {
    const token = generateAccessToken(TEST_PAYLOAD)
    const tampered = token.slice(0, -5) + 'XXXXX'
    expect(() => verifyAccessToken(tampered)).toThrow(jwt.JsonWebTokenError)
  })

  it('throws TokenExpiredError for an expired token', () => {
    // Sign with same test secret but negative expiresIn
    const expired = jwt.sign(TEST_PAYLOAD, TEST_ACCESS_SECRET, { expiresIn: -1 })
    expect(() => verifyAccessToken(expired)).toThrow(jwt.TokenExpiredError)
  })
})

// ── Password Utils ────────────────────────────────────────────────────────────

const PLAIN_PASSWORD = 'SecureP@ssw0rd!'

describe('hashPassword', () => {
  it('returns a bcrypt hash string', async () => {
    const hash = await hashPassword(PLAIN_PASSWORD)
    expect(typeof hash).toBe('string')
    expect(hash).toMatch(/^\$2[ab]\$/)
  })

  it('uses salt rounds of 12', async () => {
    const hash = await hashPassword(PLAIN_PASSWORD)
    const rounds = parseInt(hash.split('$')[2])
    expect(rounds).toBe(12)
  })

  it('produces a different hash on each call (salted)', async () => {
    const h1 = await hashPassword(PLAIN_PASSWORD)
    const h2 = await hashPassword(PLAIN_PASSWORD)
    expect(h1).not.toBe(h2)
  })
})

describe('comparePassword', () => {
  it('returns true for the correct plaintext', async () => {
    const hash = await hashPassword(PLAIN_PASSWORD)
    expect(await comparePassword(PLAIN_PASSWORD, hash)).toBe(true)
  })

  it('returns false for a wrong password', async () => {
    const hash = await hashPassword(PLAIN_PASSWORD)
    expect(await comparePassword('wrongPassword!', hash)).toBe(false)
  })
})
