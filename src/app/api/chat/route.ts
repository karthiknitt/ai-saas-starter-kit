import { createOpenAI } from '@ai-sdk/openai';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import type { LanguageModel } from 'ai';
import { streamText } from 'ai';
import { eq } from 'drizzle-orm';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/db/drizzle';
import { user } from '@/db/schema';
import { aj } from '@/lib/arcjet';
import { auth } from '@/lib/auth';
import { decrypt } from '@/lib/crypto';
import { logApiRequest, logError } from '@/lib/logger';

// Zod schema for validating chat requests
const chatRequestSchema = z.object({
  messages: z
    .array(
      z
        .object({
          role: z.enum(['user', 'assistant', 'system']),
          content: z.string().trim().min(1).max(50000).optional(),
          text: z.string().trim().min(1).max(50000).optional(),
        })
        .refine(
          (data) =>
            (data.content && data.content.trim().length > 0) ||
            (data.text && data.text.trim().length > 0),
          {
            message: 'Either content or text is required',
            path: ['content'],
          },
        ),
    )
    .min(1)
    .max(100), // 1-100 messages
  model: z.string().optional(),
});

/**
 * Handle POST /api/chat: authenticate the requester, validate and normalize the chat payload, select the user's AI provider and model, and stream the model-generated messages back to the client.
 *
 * @returns An HTTP Response containing a streaming AI-generated message stream on success, or a JSON error payload with an appropriate status code on failure.
 */
export async function POST(request: Request) {
  // Get client IP for logging and Arcjet
  const clientIP =
    request.headers.get('x-forwarded-for')?.split(',')[0] ||
    request.headers.get('x-real-ip') ||
    'unknown';

  try {
    // Apply Arcjet protection to chat API requests
    const decision = await aj.protect(request);
    if (decision.isDenied()) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Log API access
    logApiRequest('POST', '/api/chat', {
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
    if (!u.apiKeys || !u.provider) {
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

    let requestBody: unknown;
    try {
      requestBody = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 },
      );
    }

    // Validate request body with Zod
    const validationResult = chatRequestSchema.safeParse(requestBody);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Invalid request format',
          details: validationResult.error.issues.map((issue) => ({
            field: issue.path.join('.'),
            message: issue.message,
          })),
        },
        { status: 400 },
      );
    }

    const { messages, model: requestedModel } = validationResult.data;

    // Use model from request body, fallback to cookie, then default
    let modelToUse = requestedModel;
    if (!modelToUse) {
      const cookieStore = await cookies();
      modelToUse = cookieStore.get('selectedModel')?.value || undefined;
    }
    if (!modelToUse) {
      modelToUse =
        u.provider === 'openai' ? 'gpt-4o' : 'anthropic/claude-3.5-sonnet';
    }

    let aiModel: LanguageModel;
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
      role: role as 'user' | 'assistant' | 'system',
      content: content || text || '',
    }));

    const result = streamText({
      model: aiModel,
      messages: messagesForModel,
    });

    return result.toUIMessageStreamResponse();
  } catch (err) {
    // Secure error handling with proper logging
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    logError(
      'Chat API error',
      err instanceof Error ? err : new Error(errorMessage),
      {
        ip: clientIP,
        endpoint: '/api/chat',
        userAgent: request.headers.get('user-agent') || 'unknown',
      },
    );

    return NextResponse.json(
      {
        error: 'An error occurred while processing your request',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 },
    );
  }
}
