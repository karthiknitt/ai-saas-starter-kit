import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import fs from 'fs'
import path from 'path'

describe('service worker (sw.js)', () => {
  let swCode: string

  beforeEach(() => {
    // Read the service worker code
    swCode = fs.readFileSync(path.join(process.cwd(), 'public/sw.js'), 'utf-8')
  })

  describe('constants and configuration', () => {
    it('should define CACHE_NAME', () => {
      expect(swCode).toContain('CACHE_NAME')
      expect(swCode).toMatch(/CACHE_NAME\s*=\s*['"]nextjs-starterkit-v1['"]/)
    })

    it('should define STATIC_ASSETS array', () => {
      expect(swCode).toContain('STATIC_ASSETS')
      expect(swCode).toContain('[')
    })

    it('should include root path in static assets', () => {
      expect(swCode).toMatch(/['"]\/['"]/)
    })

    it('should include favicon in static assets', () => {
      expect(swCode).toMatch(/['"]\/favicon\.ico['"]/)
    })
  })

  describe('event listeners', () => {
    it('should register install event listener', () => {
      expect(swCode).toContain('addEventListener')
      expect(swCode).toMatch(/addEventListener\s*\(\s*['"]install['"]/)
    })

    it('should register activate event listener', () => {
      expect(swCode).toMatch(/addEventListener\s*\(\s*['"]activate['"]/)
    })

    it('should register fetch event listener', () => {
      expect(swCode).toMatch(/addEventListener\s*\(\s*['"]fetch['"]/)
    })
  })

  describe('install event', () => {
    it('should use event.waitUntil in install handler', () => {
      expect(swCode).toMatch(/install.*event\.waitUntil/s)
    })

    it('should open cache in install handler', () => {
      expect(swCode).toMatch(/caches\.open\s*\(\s*CACHE_NAME\s*\)/)
    })

    it('should add static assets to cache', () => {
      expect(swCode).toMatch(/cache\.addAll/)
    })

    it('should log cache message', () => {
      expect(swCode).toContain('Caching static assets')
    })
  })

  describe('activate event', () => {
    it('should use event.waitUntil in activate handler', () => {
      expect(swCode).toMatch(/activate.*event\.waitUntil/s)
    })

    it('should get all cache keys', () => {
      expect(swCode).toMatch(/caches\.keys\s*\(\s*\)/)
    })

    it('should delete old caches', () => {
      expect(swCode).toMatch(/caches\.delete/)
    })

    it('should log deletion of old cache', () => {
      expect(swCode).toContain('Deleting old cache')
    })
  })

  describe('fetch event', () => {
    it('should comment about handling GET requests', () => {
      expect(swCode).toMatch(/Only handle GET/i)
    })

    it('should use event.respondWith for fetch handling', () => {
      expect(swCode).toMatch(/fetch.*event\.respondWith/s)
    })
  })

  describe('code quality', () => {
    it('should use self instead of window', () => {
      expect(swCode).toContain('self')
      expect(swCode).toMatch(/self\.addEventListener/)
    })

    it('should have ESLint disable comment for no-undef', () => {
      expect(swCode).toContain('eslint-disable no-undef')
    })

    it('should use promises (then/catch) or async/await', () => {
      const hasPromises = swCode.includes('.then(') || swCode.includes('await ')
      expect(hasPromises).toBe(true)
    })

    it('should not have syntax errors', () => {
      expect(() => {
        new Function(swCode)
      }).not.toThrow()
    })
  })

  describe('cache management', () => {
    it('should use versioned cache name for invalidation', () => {
      expect(swCode).toMatch(/v\d+/)
    })

    it('should handle cache open operation', () => {
      expect(swCode).toMatch(/caches\.open/)
    })

    it('should handle cache match operation', () => {
      expect(swCode).toMatch(/caches\.match/)
    })

    it('should handle cache put operation', () => {
      expect(swCode).toMatch(/cache\.put/)
    })
  })

  describe('network handling', () => {
    it('should handle fetch requests', () => {
      expect(swCode).toMatch(/fetch\s*\(/)
    })

    it('should have cache-first or network-first strategy', () => {
      const hasCachesMatch = swCode.includes('caches.match')
      const hasFetch = swCode.includes('fetch(')

      expect(hasCachesMatch || hasFetch).toBe(true)
    })
  })

  describe('error handling', () => {
    it('should include error handling with catch or try-catch', () => {
      const hasErrorHandling = swCode.includes('.catch(') ||
                               swCode.includes('try') ||
                               swCode.includes('catch')
      expect(hasErrorHandling).toBe(true)
    })
  })

  describe('logging', () => {
    it('should use console.log for debugging', () => {
      expect(swCode).toMatch(/console\.log/)
    })

    it('should log service worker actions', () => {
      const logMessages = swCode.match(/console\.log\s*\(/g)
      expect(logMessages).toBeTruthy()
      expect(logMessages!.length).toBeGreaterThan(0)
    })
  })

  describe('best practices', () => {
    it('should use waitUntil for async operations', () => {
      expect(swCode).toMatch(/waitUntil/)
    })

    it('should use Promise.all for batch operations', () => {
      expect(swCode).toMatch(/Promise\.all/)
    })

    it('should clean up resources in activate', () => {
      expect(swCode).toMatch(/activate.*delete/s)
    })
  })

  describe('file structure', () => {
    it('should be a valid JavaScript file', () => {
      expect(swCode).toBeTruthy()
      expect(swCode.length).toBeGreaterThan(0)
    })

    it('should have proper comments', () => {
      expect(swCode).toMatch(/\/\/.*Service Worker/i)
    })

    it('should not exceed reasonable size', () => {
      // Service workers should be small and focused
      expect(swCode.length).toBeLessThan(10000)
    })
  })

  describe('cache strategies', () => {
    it('should define static assets to cache', () => {
      expect(swCode).toContain('STATIC_ASSETS')
    })

    it('should cache essential files', () => {
      const hasFavicon = swCode.includes('favicon.ico')
      const hasRoot = swCode.match(/['"]\//g)

      expect(hasFavicon || hasRoot).toBe(true)
    })
  })
})