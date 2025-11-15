/**
 * AES-256-GCM encryption/decryption utilities.
 *
 * This module provides secure encryption and decryption of sensitive data using
 * AES-256-GCM (Advanced Encryption Standard with Galois/Counter Mode), which
 * provides both confidentiality and authenticity.
 *
 * Features:
 * - AES-256-GCM encryption for maximum security
 * - Random IV (Initialization Vector) for each encryption
 * - Authentication tag verification to prevent tampering
 * - Safe error handling with descriptive messages
 *
 * Environment Requirements:
 * - ENCRYPTION_KEY: Must be set in environment variables (min 32 chars recommended)
 *
 * @module crypto
 * @example
 * ```typescript
 * import { encrypt, decrypt } from './crypto';
 *
 * // Encrypt sensitive data
 * const encrypted = encrypt('my-secret-api-key');
 * // => "a1b2c3d4...:e5f6g7h8...:i9j0k1l2..."
 *
 * // Decrypt data
 * const decrypted = decrypt(encrypted);
 * // => "my-secret-api-key"
 * ```
 */

import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

/** AES-256-GCM algorithm identifier */
const algorithm = 'aes-256-gcm';

// Validate encryption key at module load
if (!process.env.ENCRYPTION_KEY) {
  throw new Error('ENCRYPTION_KEY environment variable must be set');
}

/** Encryption key derived from environment variable (32 bytes for AES-256) */
const key = Buffer.from(process.env.ENCRYPTION_KEY, 'utf8').subarray(0, 32);

/**
 * Encrypts a string using AES-256-GCM encryption.
 *
 * Each encryption uses a unique random IV (Initialization Vector) to ensure
 * that encrypting the same plaintext multiple times produces different ciphertexts.
 *
 * Output format: `IV:AuthTag:EncryptedData` (all hex-encoded)
 *
 * @param {string} text - Plain text to encrypt
 * @returns {string} Encrypted data in format "iv:authTag:ciphertext" (hex-encoded)
 *
 * @example
 * ```typescript
 * const apiKey = 'sk_test_1234567890';
 * const encrypted = encrypt(apiKey);
 * console.log(encrypted);
 * // => "a1b2c3d4e5f6g7h8:i9j0k1l2m3n4o5p6:q7r8s9t0u1v2w3x4..."
 * ```
 */
export function encrypt(text: string): string {
  const iv = randomBytes(16);
  const cipher = createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

/**
 * Decrypts a string that was encrypted using the `encrypt` function.
 *
 * This function expects data in the format produced by `encrypt`:
 * "iv:authTag:ciphertext" (all hex-encoded)
 *
 * The authentication tag is verified to ensure the data has not been tampered with.
 * If verification fails, an error is thrown.
 *
 * @param {string} encryptedText - Encrypted data in format "iv:authTag:ciphertext"
 * @returns {string} Decrypted plain text
 * @throws {Error} If the encrypted data format is invalid
 * @throws {Error} If IV or auth tag length is incorrect
 * @throws {Error} If decryption fails (wrong key or tampered data)
 *
 * @example
 * ```typescript
 * const encrypted = 'a1b2c3d4e5f6g7h8:i9j0k1l2m3n4o5p6:q7r8s9t0u1v2w3x4...';
 * try {
 *   const decrypted = decrypt(encrypted);
 *   console.log(decrypted); // => "sk_test_1234567890"
 * } catch (error) {
 *   console.error('Decryption failed:', error.message);
 * }
 * ```
 */
export function decrypt(encryptedText: string): string {
  const parts = encryptedText.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted data format');
  }
  const iv = Buffer.from(parts[0], 'hex');
  const authTag = Buffer.from(parts[1], 'hex');
  const encrypted = parts[2];
  if (iv.length !== 16 || authTag.length !== 16) {
    throw new Error('Invalid IV or auth tag length');
  }
  const decipher = createDecipheriv(algorithm, key, iv);
  try {
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decipher.setAuthTag(authTag);
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch {
    throw new Error('Decryption failed: invalid data or wrong key');
  }
}
