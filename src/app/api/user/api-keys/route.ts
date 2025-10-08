import { auth } from '@/lib/auth';
import { db } from '@/db/drizzle';
import { user } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { encrypt, decrypt } from '@/lib/crypto';
import { NextResponse } from 'next/server';
import { logApiRequest, logError } from '@/lib/logger';
import { aj } from '@/lib/arcjet';

/**
 * Retrieve the authenticated user's API provider and decrypted API key.
 *
 * On success returns a JSON object containing `provider` and `apiKey` (the decrypted key or `null`).
 * If the request is unauthenticated the response is 401; if the user record is missing the response is 404.
 * If stored key decryption fails, the error is hidden and `apiKey` is returned as `null`.
 * On unexpected errors returns a 500 response with `{ error: 'An error occurred while retrieving API keys', code: 'INTERNAL_ERROR' }`.
 *
 * @returns A JSON response with `{ provider, apiKey }` on success or an error payload and appropriate HTTP status on failure.
 */
export async function GET(request: Request) {
  const clientIP =
    request.headers.get('x-forwarded-for')?.split(',')[0] ||
    request.headers.get('x-real-ip') ||
    'unknown';

  try {
    // Apply Arcjet protection to API key requests
    const decision = await aj.protect(request);
    if (decision.isDenied()) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Log API access
    logApiRequest('GET', '/api/user/api-keys', {
      ip: clientIP,
      userAgent: request.headers.get('user-agent') || 'unknown',
    });

    const session = await auth.api.getSession({
      headers: request.headers,
    });
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userData = await db
      .select()
      .from(user)
      .where(eq(user.id, session.user.id))
      .limit(1);
    if (!userData.length) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const u = userData[0];
    let apiKey = null;
    if (u.apiKeys) {
      try {
        apiKey = decrypt(u.apiKeys);
      } catch {
        console.error('Failed to decrypt API key for user');
        // Don't expose decryption errors to the client
        apiKey = null;
      }
    }

    return NextResponse.json({
      provider: u.provider,
      apiKey,
    });
  } catch (err) {
    logError(
      'API keys GET error',
      err instanceof Error ? err : new Error(String(err)),
      {
        ip: clientIP,
        endpoint: '/api/user/api-keys',
        userAgent: request.headers.get('user-agent') || 'unknown',
      },
    );

    return NextResponse.json(
      {
        error: 'An error occurred while retrieving API keys',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 },
    );
  }
}

/**
 * Handles POST requests to create, update, or clear a user's API provider and encrypted API key.
 *
 * Accepts a JSON body with `provider` and `apiKey`. If both `provider` and `apiKey` are falsy, the stored provider and API key are cleared. Otherwise the function validates the provider and API key format, encrypts the API key, and persists the provider and encrypted key for the authenticated user.
 *
 * @returns A JSON `NextResponse` with one of the following outcomes:
 * - `{ success: true }` with status `200` on successful create/update/clear.
 * - `{ error: 'Unauthorized' }` with status `401` if the request is not authenticated.
 * - `{ error: 'Missing required fields' }` or provider/key validation errors with status `400` when inputs are invalid.
 * - `{ error: 'An error occurred while updating API keys', code: 'INTERNAL_ERROR' }` with status `500` on unexpected server errors.
 */
export async function POST(request: Request) {
  const clientIP =
    request.headers.get('x-forwarded-for')?.split(',')[0] ||
    request.headers.get('x-real-ip') ||
    'unknown';

  try {
    // Apply Arcjet protection to API key requests
    const decision = await aj.protect(request);
    if (decision.isDenied()) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Log API access
    logApiRequest('POST', '/api/user/api-keys', {
      ip: clientIP,
      userAgent: request.headers.get('user-agent') || 'unknown',
    });

    const session = await auth.api.getSession({
      headers: request.headers,
    });
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { provider, apiKey } = await request.json();

    // Allow clearing keys by sending empty values
    if (!provider && !apiKey) {
      // Clear API keys
      await db
        .update(user)
        .set({
          provider: null,
          apiKeys: null,
        })
        .where(eq(user.id, session.user.id));

      return NextResponse.json({ success: true });
    }

    if (!provider || !apiKey) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 },
      );
    }

    // Validate provider
    if (!['openai', 'openrouter'].includes(provider)) {
      return NextResponse.json(
        { error: 'Invalid provider. Must be "openai" or "openrouter"' },
        { status: 400 },
      );
    }

    // Validate API key format (basic length check)
    if (typeof apiKey !== 'string' || apiKey.length < 20) {
      return NextResponse.json(
        { error: 'Invalid API key format' },
        { status: 400 },
      );
    }

    const encryptedApiKey = encrypt(apiKey);

    await db
      .update(user)
      .set({
        provider,
        apiKeys: encryptedApiKey,
      })
      .where(eq(user.id, session.user.id));

    return NextResponse.json({ success: true });
  } catch (err) {
    logError(
      'API keys POST error',
      err instanceof Error ? err : new Error(String(err)),
      {
        ip: clientIP,
        endpoint: '/api/user/api-keys',
        userAgent: request.headers.get('user-agent') || 'unknown',
      },
    );

    return NextResponse.json(
      {
        error: 'An error occurred while updating API keys',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 },
    );
  }
}