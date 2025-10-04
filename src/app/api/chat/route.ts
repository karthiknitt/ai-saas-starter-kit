import { auth } from '@/lib/auth';
import { db } from '@/db/drizzle';
import { user } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { decrypt } from '@/lib/crypto';
import { streamText, convertToModelMessages } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
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
    if (!u.apiKeys || !u.provider) {
      return NextResponse.json(
        { error: 'API key not configured' },
        { status: 400 },
      );
    }

    let apiKey: string;
    try {
      apiKey = decrypt(u.apiKeys);
    } catch {
      return NextResponse.json(
        { error: 'Failed to decrypt API key' },
        { status: 500 },
      );
    }

    const { messages } = await request.json();
    if (!messages) {
      return NextResponse.json({ error: 'Messages required' }, { status: 400 });
    }

    // Get model from cookie
    const cookies = request.headers.get('cookie') || '';
    const modelCookie = cookies
      .split(';')
      .find(c => c.trim().startsWith('selectedModel='));
    const selectedModel = modelCookie ? modelCookie.split('=')[1] : null;

    // Use selected model if provided, otherwise use default based on provider
    const modelToUse =
      selectedModel ||
      (u.provider === 'openai' ? 'gpt-4o' : 'anthropic/claude-3.5-sonnet');

    let model;
    if (u.provider === 'openai') {
      const openaiClient = createOpenAI({ apiKey });
      model = openaiClient(modelToUse);
    } else if (u.provider === 'openrouter') {
      const openrouterClient = createOpenRouter({ apiKey });
      model = openrouterClient(modelToUse);
    } else {
      return NextResponse.json(
        { error: 'Unsupported provider' },
        { status: 400 },
      );
    }

    const result = streamText({
      model,
      messages: convertToModelMessages(messages),
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error('POST /api/chat error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
