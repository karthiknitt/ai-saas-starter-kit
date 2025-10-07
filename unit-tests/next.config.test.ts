import { describe, it, expect } from 'vitest'
import nextConfig from '../next.config'

describe('next.config', () => {
  describe('images configuration', () => {
    it('should have remote patterns configured', () => {
      expect(nextConfig.images).toBeDefined()
      expect(nextConfig.images?.remotePatterns).toBeDefined()
      expect(Array.isArray(nextConfig.images?.remotePatterns)).toBe(true)
    })

    it('should allow images.unsplash.com', () => {
      const patterns = nextConfig.images?.remotePatterns || []
      const unsplashPattern = patterns.find(
        p => p.hostname === 'images.unsplash.com'
      )
      
      expect(unsplashPattern).toBeDefined()
      expect(unsplashPattern?.protocol).toBe('https')
    })

    it('should allow html.tailus.io with specific pathname', () => {
      const patterns = nextConfig.images?.remotePatterns || []
      const tailusPattern = patterns.find(
        p => p.hostname === 'html.tailus.io'
      )
      
      expect(tailusPattern).toBeDefined()
      expect(tailusPattern?.protocol).toBe('https')
      expect(tailusPattern?.pathname).toBe('/blocks/customers/**')
    })

    it('should allow ik.imagekit.io', () => {
      const patterns = nextConfig.images?.remotePatterns || []
      const imagekitPattern = patterns.find(
        p => p.hostname === 'ik.imagekit.io'
      )
      
      expect(imagekitPattern).toBeDefined()
      expect(imagekitPattern?.protocol).toBe('https')
    })

    it('should have modern image formats configured', () => {
      expect(nextConfig.images?.formats).toContain('image/webp')
      expect(nextConfig.images?.formats).toContain('image/avif')
    })

    it('should have appropriate device sizes', () => {
      expect(nextConfig.images?.deviceSizes).toBeDefined()
      expect(nextConfig.images?.deviceSizes).toContain(640)
      expect(nextConfig.images?.deviceSizes).toContain(750)
      expect(nextConfig.images?.deviceSizes).toContain(1080)
      expect(nextConfig.images?.deviceSizes).toContain(1920)
    })

    it('should have appropriate image sizes', () => {
      expect(nextConfig.images?.imageSizes).toBeDefined()
      expect(nextConfig.images?.imageSizes).toContain(16)
      expect(nextConfig.images?.imageSizes).toContain(32)
      expect(nextConfig.images?.imageSizes).toContain(256)
    })
  })

  describe('compression', () => {
    it('should have compression enabled', () => {
      expect(nextConfig.compress).toBe(true)
    })
  })

  describe('experimental features', () => {
    it('should have CSS optimization enabled', () => {
      expect(nextConfig.experimental?.optimizeCss).toBe(true)
    })

    it('should optimize package imports', () => {
      expect(nextConfig.experimental?.optimizePackageImports).toBeDefined()
      expect(nextConfig.experimental?.optimizePackageImports).toContain('lucide-react')
      expect(nextConfig.experimental?.optimizePackageImports).toContain('@radix-ui/react-icons')
    })
  })

  describe('security headers', () => {
    it('should define headers function', () => {
      expect(nextConfig.headers).toBeDefined()
      expect(typeof nextConfig.headers).toBe('function')
    })

    it('should return headers for all routes', async () => {
      if (nextConfig.headers) {
        const headers = await nextConfig.headers()
        expect(Array.isArray(headers)).toBe(true)
        expect(headers.length).toBeGreaterThan(0)
      }
    })

    it('should have basic security headers for all routes', async () => {
      if (nextConfig.headers) {
        const headers = await nextConfig.headers()
        const allRoutes = headers.find(h => h.source === '/(.*)')
        
        expect(allRoutes).toBeDefined()
        expect(allRoutes?.headers).toBeDefined()

        const headerKeys = allRoutes?.headers.map(h => h.key) || []
        
        expect(headerKeys).toContain('X-Frame-Options')
        expect(headerKeys).toContain('X-Content-Type-Options')
        expect(headerKeys).toContain('X-XSS-Protection')
        expect(headerKeys).toContain('Referrer-Policy')
        expect(headerKeys).toContain('Permissions-Policy')
        expect(headerKeys).toContain('Content-Security-Policy')
        expect(headerKeys).toContain('Strict-Transport-Security')
      }
    })

    it('should have correct X-Frame-Options value', async () => {
      if (nextConfig.headers) {
        const headers = await nextConfig.headers()
        const allRoutes = headers.find(h => h.source === '/(.*)')
        const xFrameOptions = allRoutes?.headers.find(h => h.key === 'X-Frame-Options')
        
        expect(xFrameOptions?.value).toBe('DENY')
      }
    })

    it('should have correct X-Content-Type-Options value', async () => {
      if (nextConfig.headers) {
        const headers = await nextConfig.headers()
        const allRoutes = headers.find(h => h.source === '/(.*)')
        const contentTypeOptions = allRoutes?.headers.find(h => h.key === 'X-Content-Type-Options')
        
        expect(contentTypeOptions?.value).toBe('nosniff')
      }
    })

    it('should have strict HSTS header', async () => {
      if (nextConfig.headers) {
        const headers = await nextConfig.headers()
        const allRoutes = headers.find(h => h.source === '/(.*)')
        const hsts = allRoutes?.headers.find(h => h.key === 'Strict-Transport-Security')
        
        expect(hsts?.value).toContain('max-age=31536000')
        expect(hsts?.value).toContain('includeSubDomains')
        expect(hsts?.value).toContain('preload')
      }
    })

    it('should have Content-Security-Policy', async () => {
      if (nextConfig.headers) {
        const headers = await nextConfig.headers()
        const allRoutes = headers.find(h => h.source === '/(.*)')
        const csp = allRoutes?.headers.find(h => h.key === 'Content-Security-Policy')
        
        expect(csp).toBeDefined()
        expect(csp?.value).toContain("default-src 'self'")
        expect(csp?.value).toContain("frame-ancestors 'none'")
      }
    })

    it('should have Permissions-Policy', async () => {
      if (nextConfig.headers) {
        const headers = await nextConfig.headers()
        const allRoutes = headers.find(h => h.source === '/(.*)')
        const permissionsPolicy = allRoutes?.headers.find(h => h.key === 'Permissions-Policy')
        
        expect(permissionsPolicy).toBeDefined()
        expect(permissionsPolicy?.value).toContain('geolocation=()')
        expect(permissionsPolicy?.value).toContain('microphone=()')
        expect(permissionsPolicy?.value).toContain('camera=()')
      }
    })

    it('should have stricter security for API routes', async () => {
      if (nextConfig.headers) {
        const headers = await nextConfig.headers()
        const apiRoutes = headers.find(h => h.source === '/api/:path*')
        
        expect(apiRoutes).toBeDefined()
        expect(apiRoutes?.headers).toBeDefined()

        const csp = apiRoutes?.headers.find(h => h.key === 'Content-Security-Policy')
        expect(csp?.value).toContain("default-src 'none'")
        expect(csp?.value).toContain("frame-ancestors 'none'")
      }
    })
  })

  describe('configuration structure', () => {
    it('should be a valid Next.js config object', () => {
      expect(typeof nextConfig).toBe('object')
      expect(nextConfig).not.toBeNull()
    })

    it('should not have syntax errors', () => {
      expect(() => {
        JSON.stringify(nextConfig, (key, value) => {
          if (typeof value === 'function') {
            return '[Function]'
          }
          return value
        })
      }).not.toThrow()
    })
  })
})