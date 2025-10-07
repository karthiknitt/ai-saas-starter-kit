import { describe, it, expect } from 'vitest'
import { z } from 'zod'

// Define the schema for testing (same as in route.ts)
const chatRequestSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant', 'system']),
        content: z.string().min(1).max(50000),
        text: z.string().min(1).max(50000).optional(),
      }),
    )
    .min(1)
    .max(100),
  model: z.string().optional(),
})

describe('Chat Request Schema Validation', () => {
  describe('valid messages', () => {
    it('should accept valid user message', () => {
      const data = {
        messages: [
          { role: 'user', content: 'Hello, how are you?' }
        ]
      }

      const result = chatRequestSchema.safeParse(data)
      expect(result.success).toBe(true)
    })

    it('should accept multiple messages', () => {
      const data = {
        messages: [
          { role: 'user', content: 'Hello' },
          { role: 'assistant', content: 'Hi there\\!' },
          { role: 'user', content: 'How can you help me?' }
        ]
      }

      const result = chatRequestSchema.safeParse(data)
      expect(result.success).toBe(true)
    })

    it('should accept system message', () => {
      const data = {
        messages: [
          { role: 'system', content: 'You are a helpful assistant.' },
          { role: 'user', content: 'Hello' }
        ]
      }

      const result = chatRequestSchema.safeParse(data)
      expect(result.success).toBe(true)
    })

    it('should accept message with text field', () => {
      const data = {
        messages: [
          { role: 'user', content: 'Main content', text: 'Alternative text' }
        ]
      }

      const result = chatRequestSchema.safeParse(data)
      expect(result.success).toBe(true)
    })

    it('should accept optional model parameter', () => {
      const data = {
        messages: [{ role: 'user', content: 'Hello' }],
        model: 'gpt-4o'
      }

      const result = chatRequestSchema.safeParse(data)
      expect(result.success).toBe(true)
    })

    it('should accept message at max length', () => {
      const data = {
        messages: [
          { role: 'user', content: 'a'.repeat(50000) }
        ]
      }

      const result = chatRequestSchema.safeParse(data)
      expect(result.success).toBe(true)
    })

    it('should accept maximum number of messages', () => {
      const messages = Array(100).fill(null).map(() => ({
        role: 'user',
        content: 'Test message'
      }))

      const data = { messages }
      const result = chatRequestSchema.safeParse(data)
      expect(result.success).toBe(true)
    })
  })

  describe('invalid messages', () => {
    it('should reject empty messages array', () => {
      const data = { messages: [] }

      const result = chatRequestSchema.safeParse(data)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues).toHaveLength(1)
        expect(result.error.issues[0].path).toContain('messages')
      }
    })

    it('should reject missing messages field', () => {
      const data = {}

      const result = chatRequestSchema.safeParse(data)
      expect(result.success).toBe(false)
    })

    it('should reject invalid role', () => {
      const data = {
        messages: [
          { role: 'invalid_role', content: 'Hello' }
        ]
      }

      const result = chatRequestSchema.safeParse(data)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('role')
      }
    })

    it('should reject empty content', () => {
      const data = {
        messages: [
          { role: 'user', content: '' }
        ]
      }

      const result = chatRequestSchema.safeParse(data)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('content')
      }
    })

    it('should reject content exceeding max length', () => {
      const data = {
        messages: [
          { role: 'user', content: 'a'.repeat(50001) }
        ]
      }

      const result = chatRequestSchema.safeParse(data)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('content')
      }
    })

    it('should reject more than 100 messages', () => {
      const messages = Array(101).fill(null).map(() => ({
        role: 'user',
        content: 'Test message'
      }))

      const data = { messages }
      const result = chatRequestSchema.safeParse(data)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('messages')
      }
    })

    it('should reject missing role', () => {
      const data = {
        messages: [
          { content: 'Hello' }
        ]
      }

      const result = chatRequestSchema.safeParse(data)
      expect(result.success).toBe(false)
    })

    it('should reject missing content', () => {
      const data = {
        messages: [
          { role: 'user' }
        ]
      }

      const result = chatRequestSchema.safeParse(data)
      expect(result.success).toBe(false)
    })

    it('should reject non-string content', () => {
      const data = {
        messages: [
          { role: 'user', content: 123 }
        ]
      }

      const result = chatRequestSchema.safeParse(data)
      expect(result.success).toBe(false)
    })

    it('should reject non-array messages', () => {
      const data = {
        messages: { role: 'user', content: 'Hello' }
      }

      const result = chatRequestSchema.safeParse(data)
      expect(result.success).toBe(false)
    })
  })

  describe('edge cases', () => {
    it('should handle unicode characters in content', () => {
      const data = {
        messages: [
          { role: 'user', content: '你好 🎉 مرحبا' }
        ]
      }

      const result = chatRequestSchema.safeParse(data)
      expect(result.success).toBe(true)
    })

    it('should handle special characters in content', () => {
      const data = {
        messages: [
          { role: 'user', content: '<>&"\'\\n\\t' }
        ]
      }

      const result = chatRequestSchema.safeParse(data)
      expect(result.success).toBe(true)
    })

    it('should handle newlines and tabs in content', () => {
      const data = {
        messages: [
          { role: 'user', content: 'Line 1\nLine 2\tTabbed' }
        ]
      }

      const result = chatRequestSchema.safeParse(data)
      expect(result.success).toBe(true)
    })

    it('should accept content with only whitespace', () => {
      const data = {
        messages: [
          { role: 'user', content: '   ' }
        ]
      }

      const result = chatRequestSchema.safeParse(data)
      expect(result.success).toBe(true)
    })

    it('should handle mixed valid and optional fields', () => {
      const data = {
        messages: [
          { role: 'user', content: 'Hello', text: 'World' }
        ],
        model: 'gpt-4o'
      }

      const result = chatRequestSchema.safeParse(data)
      expect(result.success).toBe(true)
    })
  })

  describe('error messages', () => {
    it('should provide clear error for invalid role', () => {
      const data = {
        messages: [
          { role: 'admin', content: 'Hello' }
        ]
      }

      const result = chatRequestSchema.safeParse(data)
      expect(result.success).toBe(false)
      if (!result.success) {
        const issue = result.error.issues[0]
        expect(issue.message).toBeTruthy()
        expect(issue.path).toEqual(['messages', 0, 'role'])
      }
    })

    it('should provide clear error for content too long', () => {
      const data = {
        messages: [
          { role: 'user', content: 'a'.repeat(50001) }
        ]
      }

      const result = chatRequestSchema.safeParse(data)
      expect(result.success).toBe(false)
      if (!result.success) {
        const issue = result.error.issues[0]
        expect(issue.message).toContain('50000')
      }
    })

    it('should provide clear error for too many messages', () => {
      const messages = Array(101).fill(null).map(() => ({
        role: 'user',
        content: 'Test'
      }))

      const result = chatRequestSchema.safeParse({ messages })
      expect(result.success).toBe(false)
      if (!result.success) {
        const issue = result.error.issues[0]
        expect(issue.message).toBeTruthy()
      }
    })
  })
})