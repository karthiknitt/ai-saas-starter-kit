import { describe, it, expect } from 'vitest'
import { schema } from '@/components/data-table'

describe('data-table schema', () => {
  describe('schema validation', () => {
    it('should validate a valid data object', () => {
      const validData = {
        id: 1,
        header: 'Test Header',
        type: 'Table of Contents',
        status: 'Done',
        target: '100',
        limit: '50',
        reviewer: 'John Doe',
      }

      const result = schema.safeParse(validData)
      expect(result.success).toBe(true)
      expect(result.data).toEqual(validData)
    })

    it('should validate with different valid values', () => {
      const validData = {
        id: 42,
        header: 'Another Header',
        type: 'Executive Summary',
        status: 'In Progress',
        target: '200',
        limit: '75',
        reviewer: 'Jane Smith',
      }

      const result = schema.safeParse(validData)
      expect(result.success).toBe(true)
      expect(result.data).toEqual(validData)
    })

    it('should reject invalid id (string instead of number)', () => {
      const invalidData = {
        id: '1', // Should be number
        header: 'Test Header',
        type: 'Table of Contents',
        status: 'Done',
        target: '100',
        limit: '50',
        reviewer: 'John Doe',
      }

      const result = schema.safeParse(invalidData)
      expect(result.success).toBe(false)
      expect(result.error?.issues).toContainEqual(
        expect.objectContaining({
          code: 'invalid_type',
          expected: 'number',
          path: ['id'],
        })
      )
    })

    it('should reject missing required fields', () => {
      const incompleteData = {
        id: 1,
        header: 'Test Header',
        // Missing type, status, target, limit, reviewer
      }

      const result = schema.safeParse(incompleteData)
      expect(result.success).toBe(false)
      expect(result.error?.issues.length).toBeGreaterThan(0)
    })

    it('should reject invalid header (number instead of string)', () => {
      const invalidData = {
        id: 1,
        header: 123, // Should be string
        type: 'Table of Contents',
        status: 'Done',
        target: '100',
        limit: '50',
        reviewer: 'John Doe',
      }

      const result = schema.safeParse(invalidData)
      expect(result.success).toBe(false)
      expect(result.error?.issues).toContainEqual(
        expect.objectContaining({
          code: 'invalid_type',
          expected: 'string',
          path: ['header'],
        })
      )
    })

    it('should accept empty strings for string fields', () => {
      const dataWithEmptyStrings = {
        id: 1,
        header: '',
        type: '',
        status: '',
        target: '',
        limit: '',
        reviewer: '',
      }

      const result = schema.safeParse(dataWithEmptyStrings)
      expect(result.success).toBe(true)
      expect(result.data).toEqual(dataWithEmptyStrings)
    })

    it('should reject null values', () => {
      const dataWithNulls = {
        id: null,
        header: null,
        type: null,
        status: null,
        target: null,
        limit: null,
        reviewer: null,
      }

      const result = schema.safeParse(dataWithNulls)
      expect(result.success).toBe(false)
      expect(result.error?.issues.length).toBe(7) // All fields should fail
    })

    it('should reject undefined values', () => {
      const dataWithUndefined = {
        id: undefined,
        header: undefined,
        type: undefined,
        status: undefined,
        target: undefined,
        limit: undefined,
        reviewer: undefined,
      }

      const result = schema.safeParse(dataWithUndefined)
      expect(result.success).toBe(false)
      expect(result.error?.issues.length).toBe(7) // All fields should fail
    })

    it('should handle decimal numbers for id', () => {
      const dataWithDecimal = {
        id: 1.5,
        header: 'Test Header',
        type: 'Table of Contents',
        status: 'Done',
        target: '100',
        limit: '50',
        reviewer: 'John Doe',
      }

      const result = schema.safeParse(dataWithDecimal)
      expect(result.success).toBe(true)
      expect(result.data?.id).toBe(1.5)
    })

    it('should handle negative numbers for id', () => {
      const dataWithNegative = {
        id: -1,
        header: 'Test Header',
        type: 'Table of Contents',
        status: 'Done',
        target: '100',
        limit: '50',
        reviewer: 'John Doe',
      }

      const result = schema.safeParse(dataWithNegative)
      expect(result.success).toBe(true)
      expect(result.data?.id).toBe(-1)
    })

    it('should handle zero for id', () => {
      const dataWithZero = {
        id: 0,
        header: 'Test Header',
        type: 'Table of Contents',
        status: 'Done',
        target: '100',
        limit: '50',
        reviewer: 'John Doe',
      }

      const result = schema.safeParse(dataWithZero)
      expect(result.success).toBe(true)
      expect(result.data?.id).toBe(0)
    })

    it('should handle special characters in strings', () => {
      const dataWithSpecialChars = {
        id: 1,
        header: 'Header with @#$%^&*()',
        type: 'Type with éñü',
        status: 'Status with 123',
        target: 'Target with spaces',
        limit: 'Limit with - and _',
        reviewer: 'Reviewer with . and ,',
      }

      const result = schema.safeParse(dataWithSpecialChars)
      expect(result.success).toBe(true)
      expect(result.data).toEqual(dataWithSpecialChars)
    })

    it('should handle very long strings', () => {
      const longString = 'A'.repeat(10000)
      const dataWithLongStrings = {
        id: 1,
        header: longString,
        type: longString,
        status: longString,
        target: longString,
        limit: longString,
        reviewer: longString,
      }

      const result = schema.safeParse(dataWithLongStrings)
      expect(result.success).toBe(true)
      expect(result.data?.header).toBe(longString)
    })
  })

})