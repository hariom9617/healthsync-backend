import crypto from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const KEY_LENGTH = 32
const AUTH_TAG_LENGTH = 16

/**
 * Encrypt a plaintext string using AES-256-GCM with a per-call random IV and salt.
 * Key is derived from ENCRYPTION_KEY env var via scrypt so each document gets unique keying.
 * Returns { iv, encryptedData, salt } — all hex strings.
 */
export function encrypt(plaintext) {
  const masterKey = process.env.ENCRYPTION_KEY
  if (!masterKey) throw new Error('ENCRYPTION_KEY is not configured')

  const salt = crypto.randomBytes(16)
  const iv = crypto.randomBytes(parseInt(process.env.ENCRYPTION_IV_LENGTH ?? '16'))
  const key = crypto.scryptSync(Buffer.from(masterKey, 'hex'), salt, KEY_LENGTH)

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv)
  const encrypted = Buffer.concat([cipher.update(String(plaintext), 'utf8'), cipher.final()])
  const authTag = cipher.getAuthTag()

  return {
    iv: iv.toString('hex'),
    encryptedData: Buffer.concat([encrypted, authTag]).toString('hex'),
    salt: salt.toString('hex'),
  }
}

/**
 * Decrypt an envelope produced by encrypt().
 * Returns the original plaintext string.
 */
export function decrypt({ iv, encryptedData, salt }) {
  const masterKey = process.env.ENCRYPTION_KEY
  if (!masterKey) throw new Error('ENCRYPTION_KEY is not configured')

  const key = crypto.scryptSync(Buffer.from(masterKey, 'hex'), Buffer.from(salt, 'hex'), KEY_LENGTH)

  const ivBuf = Buffer.from(iv, 'hex')
  const dataBuf = Buffer.from(encryptedData, 'hex')
  const authTag = dataBuf.subarray(-AUTH_TAG_LENGTH)
  const ciphertext = dataBuf.subarray(0, -AUTH_TAG_LENGTH)

  const decipher = crypto.createDecipheriv(ALGORITHM, key, ivBuf)
  decipher.setAuthTag(authTag)

  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8')
}

/**
 * Serialize encrypt() result to a single JSON string suitable for storing in a String field.
 * Returns null/undefined unchanged so optional fields work cleanly.
 */
export function encryptField(value) {
  if (value === null) return value
  return JSON.stringify(encrypt(String(value)))
}

/**
 * Parse a JSON-encrypted string produced by encryptField() and return plaintext.
 * Returns the original value unchanged if it is not an encrypted envelope,
 * allowing backward-compatible reads of unencrypted documents.
 */
export function decryptField(stored) {
  if (stored === null) return stored
  try {
    const parsed = typeof stored === 'string' ? JSON.parse(stored) : stored
    if (parsed?.iv && parsed?.encryptedData && parsed?.salt) {
      return decrypt(parsed)
    }
  } catch {
    // not a JSON-encrypted value — fall through and return as-is
  }
  return stored
}
