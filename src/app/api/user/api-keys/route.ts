import { auth } from '@/lib/auth';
import { db } from '@/db/drizzle';
import { user } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { encrypt, decrypt } from '@/lib/crypto';
import { NextResponse } from 'next/server';
import { logApiRequest, logError } from '@/lib/logger';
import { aj } from '@/lib/arcjet';

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
