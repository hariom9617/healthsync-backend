// process.env is set in src/tests/setup.js (setupFiles) before this module loads
import { encrypt, decrypt, encryptField, decryptField } from '../../utils/encryption.js'

// ── encrypt() ────────────────────────────────────────────────────────────────

describe('encrypt', () => {
  it('returns an object with iv, encryptedData, and salt as hex strings', () => {
    const result = encrypt('hello world')
    expect(result).toHaveProperty('iv')
    expect(result).toHaveProperty('encryptedData')
    expect(result).toHaveProperty('salt')
    expect(typeof result.iv).toBe('string')
    expect(typeof result.encryptedData).toBe('string')
    expect(typeof result.salt).toBe('string')
  })

  it('different calls with the same plaintext produce different ciphertext (IV randomness)', () => {
    const r1 = encrypt('same-text')
    const r2 = encrypt('same-text')
    expect(r1.iv).not.toBe(r2.iv)
    expect(r1.salt).not.toBe(r2.salt)
    expect(r1.encryptedData).not.toBe(r2.encryptedData)
  })

  it('throws when ENCRYPTION_KEY is not set', () => {
    const original = process.env.ENCRYPTION_KEY
    delete process.env.ENCRYPTION_KEY
    expect(() => encrypt('data')).toThrow('ENCRYPTION_KEY is not configured')
    process.env.ENCRYPTION_KEY = original
  })
})

// ── decrypt() ────────────────────────────────────────────────────────────────

describe('decrypt', () => {
  it('round-trips correctly: decrypt(encrypt(data)) === original', () => {
    const original = 'sensitive health data 12345!@#'
    expect(decrypt(encrypt(original))).toBe(original)
  })

  it('handles numeric values stored as strings', () => {
    const original = '120'
    expect(decrypt(encrypt(original))).toBe(original)
  })

  it('handles multi-byte unicode strings', () => {
    const original = 'température: 36.7°C — données santé'
    expect(decrypt(encrypt(original))).toBe(original)
  })

  it('throws on tampered encryptedData (auth tag mismatch)', () => {
    const envelope = encrypt('test data')
    // Flip the last hex byte of encryptedData to corrupt the auth tag
    const lastByte = parseInt(envelope.encryptedData.slice(-2), 16)
    const tampered =
      envelope.encryptedData.slice(0, -2) + ((lastByte ^ 0xff) & 0xff).toString(16).padStart(2, '0')
    expect(() => decrypt({ ...envelope, encryptedData: tampered })).toThrow()
  })
})

// ── encryptField / decryptField ───────────────────────────────────────────────

describe('encryptField', () => {
  it('returns a JSON string containing iv, encryptedData, salt', () => {
    const stored = encryptField('my phone number')
    expect(typeof stored).toBe('string')
    const parsed = JSON.parse(stored)
    expect(parsed).toHaveProperty('iv')
    expect(parsed).toHaveProperty('encryptedData')
    expect(parsed).toHaveProperty('salt')
  })

  it('returns null unchanged', () => {
    expect(encryptField(null)).toBe(null)
  })

  it('returns undefined unchanged', () => {
    expect(encryptField(undefined)).toBe(undefined)
  })
})

describe('decryptField', () => {
  it('round-trips correctly with encryptField', () => {
    const original = 'my phone number'
    expect(decryptField(encryptField(original))).toBe(original)
  })

  it('returns null unchanged', () => {
    expect(decryptField(null)).toBe(null)
  })

  it('returns undefined unchanged', () => {
    expect(decryptField(undefined)).toBe(undefined)
  })

  it('returns a plain (non-encrypted) string unchanged', () => {
    expect(decryptField('just a plain string')).toBe('just a plain string')
  })

  it('returns non-JSON strings unchanged', () => {
    expect(decryptField('not { json }')).toBe('not { json }')
  })
})
