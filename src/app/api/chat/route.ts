import { auth } from '@/lib/auth';
import { db } from '@/db/drizzle';
import { user } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { decrypt } from '@/lib/crypto';
import { streamText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

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
    console.log(
      'Chat API: User data - apiKeys:',
      !!u.apiKeys,
      'provider:',
      u.provider,
    );
    if (!u.apiKeys || !u.provider) {
      console.log('Chat API: API key not configured');
      return NextResponse.json(
        { error: 'API key not configured' },
        { status: 400 },
      );
    }

    let apiKey: string;
    try {
      apiKey = decrypt(u.apiKeys);
    } catch (error) {
      console.error('Failed to decrypt API key:', error);
      return NextResponse.json(
        { error: 'Failed to decrypt API key' },
        { status: 500 },
      );
    }

    const requestBody = await request.json();
    console.log(
      'Chat API: Received request with',
      requestBody.messages?.length || 0,
      'messages',
    );
    const { messages, model: requestedModel } = requestBody;
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      console.log('Chat API: Messages validation failed');
      return NextResponse.json({ error: 'Messages required' }, { status: 400 });
    }

    // Basic validation of message structure
    const isValid = messages.every(
      msg =>
        msg &&
        typeof msg === 'object' &&
        'role' in msg &&
        ('content' in msg || 'text' in msg),
    );
    if (!isValid) {
      return NextResponse.json(
        {
          error:
            'Invalid message format. Each message must have role and content or text.',
        },
        { status: 400 },
      );
    }

    // Use model from request body, fallback to cookie, then default
    let modelToUse = requestedModel;
    if (!modelToUse) {
      const cookieStore = await cookies();
      modelToUse = cookieStore.get('selectedModel')?.value || null;
    }
    if (!modelToUse) {
      modelToUse =
        u.provider === 'openai' ? 'gpt-4o' : 'anthropic/claude-3.5-sonnet';
    }

    let aiModel;
    if (u.provider === 'openai') {
      const openaiClient = createOpenAI({ apiKey });
      aiModel = openaiClient(modelToUse);
    } else if (u.provider === 'openrouter') {
      const openrouterClient = createOpenRouter({ apiKey });
      aiModel = openrouterClient(modelToUse);
    } else {
      return NextResponse.json(
        { error: 'Unsupported provider' },
        { status: 400 },
      );
    }

    const messagesForModel = messages.map(({ role, content, text }) => ({
      role,
      content: content || text,
    }));
    const result = streamText({
      model: aiModel,
      messages: messagesForModel,
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
