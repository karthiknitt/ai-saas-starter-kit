import { describe, it, expect } from 'vitest'
import { encrypt, decrypt } from '@/lib/crypto'

describe('crypto', () => {
  describe('encrypt', () => {
    it('should encrypt a string', () => {
      const text = 'hello world'
      const encrypted = encrypt(text)

      expect(encrypted).toBeDefined()
      expect(typeof encrypted).toBe('string')
      expect(encrypted.length).toBeGreaterThan(text.length)
      // Should contain the separator
      expect(encrypted).toContain(':')
    })

    it('should produce different outputs for different inputs', () => {
      const text1 = 'hello'
      const text2 = 'world'

      const encrypted1 = encrypt(text1)
      const encrypted2 = encrypt(text2)

      expect(encrypted1).not.toBe(encrypted2)
    })

    it('should produce different outputs for the same input (due to random IV)', () => {
      const text = 'hello world'

      const encrypted1 = encrypt(text)
      const encrypted2 = encrypt(text)

      expect(encrypted1).not.toBe(encrypted2)
    })

    it('should handle empty strings', () => {
      const text = ''
      const encrypted = encrypt(text)

      expect(encrypted).toBeDefined()
      expect(typeof encrypted).toBe('string')
    })

    it('should handle special characters', () => {
      const text = 'hello@world.com!#$%^&*()'
      const encrypted = encrypt(text)

      expect(encrypted).toBeDefined()
      expect(typeof encrypted).toBe('string')
    })
  })

  describe('decrypt', () => {
    it('should decrypt an encrypted string', () => {
      const originalText = 'hello world'
      const encrypted = encrypt(originalText)
      const decrypted = decrypt(encrypted)

      expect(decrypted).toBe(originalText)
    })

    it('should handle empty strings', () => {
      const originalText = ''
      const encrypted = encrypt(originalText)
      const decrypted = decrypt(encrypted)

      expect(decrypted).toBe(originalText)
    })

    it('should handle special characters', () => {
      const originalText = 'hello@world.com!#$%^&*()'
      const encrypted = encrypt(originalText)
      const decrypted = decrypt(encrypted)

      expect(decrypted).toBe(originalText)
    })

    it('should handle long strings', () => {
      const originalText = 'A'.repeat(1000)
      const encrypted = encrypt(originalText)
      const decrypted = decrypt(encrypted)

      expect(decrypted).toBe(originalText)
    })

    it('should throw an error for invalid encrypted data', () => {
      expect(() => decrypt('invalid')).toThrow()
      expect(() => decrypt('invalid:invalid:invalid')).toThrow()
      expect(() => decrypt('')).toThrow()
    })

    it('should throw an error for tampered encrypted data', () => {
      const originalText = 'hello world'
      const encrypted = encrypt(originalText)
      // Tamper with the auth tag (second part) which should cause authentication to fail
      const parts = encrypted.split(':')
      if (parts.length === 3 && parts[1].length > 0) {
        // Change the first character of the auth tag
        parts[1] = '0' + parts[1].slice(1)
        const tampered = parts.join(':')
        expect(() => decrypt(tampered)).toThrow()
      } else {
        // Fallback: just test with obviously invalid data
        expect(() => decrypt('invalid')).toThrow()
      }
    })
  })

  describe('encrypt/decrypt roundtrip', () => {
    it('should maintain data integrity through multiple encrypt/decrypt cycles', () => {
      const originalText = 'test data for multiple cycles'

      let current = originalText
      for (let i = 0; i < 3; i++) {
        current = decrypt(encrypt(current))
        expect(current).toBe(originalText)
      }
    })

    it('should work with JSON data', () => {
      const data = { user: 'john', age: 30, active: true }
      const jsonString = JSON.stringify(data)

      const encrypted = encrypt(jsonString)
      const decrypted = decrypt(encrypted)
      const parsed = JSON.parse(decrypted)

      expect(parsed).toEqual(data)
    })
  })
})