/**
 * Health Check Endpoint
 *
 * Provides application health status for monitoring and load balancers.
 * Returns basic health information and optional detailed diagnostics.
 *
 * @see https://learn.microsoft.com/en-us/azure/architecture/patterns/health-endpoint-monitoring
 */

import { NextResponse } from 'next/server';
import { db } from '@/db/drizzle';

/**
 * GET /api/health
 *
 * Returns application health status
 *
 * Query parameters:
 * - detailed: Include detailed health checks (database, etc.)
 *
 * @example
 * Basic health check:
 * GET /api/health
 * Response: { status: 'ok', timestamp: '...' }
 *
 * Detailed health check:
 * GET /api/health?detailed=true
 * Response: { status: 'ok', checks: {...}, timestamp: '...' }
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const detailed = searchParams.get('detailed') === 'true';

  const health: Record<string, unknown> = {
    status: 'ok',
    timestamp: new Date().toISOString(),
  };

  // Detailed health checks
  if (detailed) {
    const checks: Record<string, { status: string; message?: string }> = {};

    // Check database connection
    try {
      await db.execute('SELECT 1' as any);
      checks.database = { status: 'ok' };
    } catch (error) {
      checks.database = {
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error',
      };
      health.status = 'degraded';
    }

    // Check environment variables
    const requiredEnvVars = [
      'DATABASE_URL',
      'BETTER_AUTH_SECRET',
      'ENCRYPTION_KEY',
    ];

    const missingEnvVars = requiredEnvVars.filter(
      (varName) => !process.env[varName],
    );

    if (missingEnvVars.length > 0) {
      checks.environment = {
        status: 'warning',
        message: `Missing: ${missingEnvVars.join(', ')}`,
      };
    } else {
      checks.environment = { status: 'ok' };
    }

    health.checks = checks;
  }

  return NextResponse.json(health);
}
