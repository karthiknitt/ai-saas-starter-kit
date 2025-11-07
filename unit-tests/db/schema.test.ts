import { describe, it, expect } from 'vitest'
import { user, session, account, verification, subscription, schema, userRole } from '@/db/schema'

describe('database schema', () => {
  describe('table definitions', () => {
    it('should export all table definitions', () => {
      expect(user).toBeDefined()
      expect(session).toBeDefined()
      expect(account).toBeDefined()
      expect(verification).toBeDefined()
      expect(subscription).toBeDefined()
    })

    it('should be functions/objects representing tables', () => {
      expect(typeof user).toBe('object')
      expect(typeof session).toBe('object')
      expect(typeof account).toBe('object')
      expect(typeof verification).toBe('object')
      expect(typeof subscription).toBe('object')
    })
  })

  describe('user table structure', () => {
    it('should have all expected columns', () => {
      const columns = Object.keys(user)
      expect(columns).toContain('id')
      expect(columns).toContain('name')
      expect(columns).toContain('email')
      expect(columns).toContain('emailVerified')
      expect(columns).toContain('image')
      expect(columns).toContain('apiKeys')
      expect(columns).toContain('provider')
      expect(columns).toContain('role')
      expect(columns).toContain('createdAt')
      expect(columns).toContain('updatedAt')
    })

    it('should have correct number of columns', () => {
      expect(Object.keys(user)).toHaveLength(11)
    })
  })

  describe('session table structure', () => {
    it('should have all expected columns', () => {
      const columns = Object.keys(session)
      expect(columns).toContain('id')
      expect(columns).toContain('expiresAt')
      expect(columns).toContain('token')
      expect(columns).toContain('createdAt')
      expect(columns).toContain('updatedAt')
      expect(columns).toContain('ipAddress')
      expect(columns).toContain('userAgent')
      expect(columns).toContain('userId')
    })

    it('should have correct number of columns', () => {
      expect(Object.keys(session)).toHaveLength(9)
    })
  })

  describe('account table structure', () => {
    it('should have all expected columns', () => {
      const columns = Object.keys(account)
      expect(columns).toContain('id')
      expect(columns).toContain('accountId')
      expect(columns).toContain('providerId')
      expect(columns).toContain('userId')
      expect(columns).toContain('accessToken')
      expect(columns).toContain('refreshToken')
      expect(columns).toContain('idToken')
      expect(columns).toContain('accessTokenExpiresAt')
      expect(columns).toContain('refreshTokenExpiresAt')
      expect(columns).toContain('scope')
      expect(columns).toContain('password')
      expect(columns).toContain('createdAt')
      expect(columns).toContain('updatedAt')
    })

    it('should have correct number of columns', () => {
      expect(Object.keys(account)).toHaveLength(14)
    })
  })

  describe('verification table structure', () => {
    it('should have all expected columns', () => {
      const columns = Object.keys(verification)
      expect(columns).toContain('id')
      expect(columns).toContain('identifier')
      expect(columns).toContain('value')
      expect(columns).toContain('expiresAt')
      expect(columns).toContain('createdAt')
      expect(columns).toContain('updatedAt')
    })

    it('should have correct number of columns', () => {
      expect(Object.keys(verification)).toHaveLength(7)
    })
  })

  describe('subscription table structure', () => {
    it('should have all expected columns', () => {
      const columns = Object.keys(subscription)
      expect(columns).toContain('id')
      expect(columns).toContain('userId')
      expect(columns).toContain('polarSubscriptionId')
      expect(columns).toContain('polarCustomerId')
      expect(columns).toContain('status')
      expect(columns).toContain('plan')
      expect(columns).toContain('currentPeriodStart')
      expect(columns).toContain('currentPeriodEnd')
      expect(columns).toContain('cancelAtPeriodEnd')
      expect(columns).toContain('createdAt')
      expect(columns).toContain('updatedAt')
    })

    it('should have correct number of columns', () => {
      expect(Object.keys(subscription)).toHaveLength(12)
    })
  })

  describe('schema export', () => {
    it('should export all tables in schema object', () => {
      expect(schema).toHaveProperty('user')
      expect(schema).toHaveProperty('session')
      expect(schema).toHaveProperty('account')
      expect(schema).toHaveProperty('verification')
      expect(schema).toHaveProperty('subscription')
      expect(schema).toHaveProperty('userRole')
    })

    it('should have exactly 6 tables', () => {
      expect(Object.keys(schema)).toHaveLength(6)
    })

    it('should reference the correct table instances', () => {
      expect(schema.user).toBe(user)
      expect(schema.session).toBe(session)
      expect(schema.account).toBe(account)
      expect(schema.verification).toBe(verification)
      expect(schema.subscription).toBe(subscription)
      expect(schema.userRole).toBe(userRole)
    })
  })
})