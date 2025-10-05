import { auth } from '@/lib/auth';
import { db } from '@/db/drizzle';
import { user } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { encrypt, decrypt } from '@/lib/crypto';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
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
      } catch (e) {
        console.error('Failed to decrypt API key', e);
      }
    }

    return NextResponse.json({
      provider: u.provider,
      apiKey,
    });
  } catch (error) {
    console.error('GET /api/user/api-keys error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
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
  } catch (error) {
    console.error('POST /api/user/api-keys error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
