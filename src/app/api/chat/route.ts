/**
 * AI chat API endpoint with streaming support.
 *
 * This API route processes chat requests and streams AI-generated responses back to the client.
 * It handles multiple AI providers (OpenAI, OpenRouter) and enforces quota limits based on
 * user subscription plans.
 *
 * Request Flow:
 * 1. Arcjet protection (rate limiting, bot detection)
 * 2. User authentication via session
 * 3. Usage quota validation
 * 4. API key decryption
 * 5. Request validation (Zod schema)
 * 6. Model access verification (plan-based)
 * 7. AI provider initialization
 * 8. Stream AI response to client
 *
 * Supported Providers:
 * - OpenAI (gpt-4o, gpt-3.5-turbo, etc.)
 * - OpenRouter (claude-3.5-sonnet, and 200+ other models)
 *
 * Security Features:
 * - Arcjet bot detection and rate limiting
 * - Encrypted API key storage (AES-256-GCM)
 * - Plan-based model access control
 * - Usage quota enforcement
 * - Request validation with Zod
 * - Comprehensive error logging
 *
 * @module api/chat
 * @see {@link https://sdk.vercel.ai/docs Vercel AI SDK Documentation}
 */

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
import { hasModelAccess } from '@/lib/subscription-features';
import { trackAndCheckAiRequest } from '@/lib/usage-tracker';

/**
 * Zod schema for validating chat request payloads.
 *
 * Validates:
 * - Messages array (1-100 messages)
 * - Message role (user, assistant, system)
 * - Message content (1-50000 chars)
 * - Optional model override
 *
 * @example
 * Valid request:
 * ```json
 * {
 *   "messages": [
 *     { "role": "user", "content": "Hello, how are you?" }
 *   ],
 *   "model": "gpt-4o"
 * }
 * ```
 */
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
 * POST /api/chat
 *
 * Processes chat requests and streams AI-generated responses.
 *
 * Authentication: Required (session-based)
 *
 * Request Body:
 * ```json
 * {
 *   "messages": [
 *     { "role": "user", "content": "Your message here" },
 *     { "role": "assistant", "content": "Previous response" }
 *   ],
 *   "model": "gpt-4o" // optional, falls back to cookie or user's default
 * }
 * ```
 *
 * Response:
 * - 200: Streamed AI response (text/event-stream)
 * - 400: Invalid request format, missing API key
 * - 401: Unauthorized (no session)
 * - 403: Access denied (Arcjet), model not available on plan
 * - 404: User not found
 * - 429: Quota exceeded
 * - 500: Internal error (decryption failure, AI provider error)
 *
 * Rate Limiting:
 * - Enforced by Arcjet based on client IP
 * - Quota limits based on subscription plan (Free: 10/month, Pro: 1000/month, etc.)
 *
 * Model Selection Priority:
 * 1. Model from request body
 * 2. Model from selectedModel cookie
 * 3. Default model based on provider (openai: gpt-4o, openrouter: claude-3.5-sonnet)
 *
 * @param {Request} request - HTTP request object
 * @returns {Promise<Response>} Streaming response or error JSON
 *
 * @example
 * ```typescript
 * // Client-side usage with fetch
 * const response = await fetch('/api/chat', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({
 *     messages: [{ role: 'user', content: 'Hello!' }]
 *   })
 * });
 *
 * // Read streaming response
 * const reader = response.body.getReader();
 * while (true) {
 *   const { done, value } = await reader.read();
 *   if (done) break;
 *   console.log(new TextDecoder().decode(value));
 * }
 * ```
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

    // Check usage quota before processing request
    const quotaCheck = await trackAndCheckAiRequest(session.user.id);
    if (!quotaCheck.allowed) {
      return NextResponse.json(
        {
          error: 'Quota exceeded',
          details: {
            used: quotaCheck.quota.used,
            limit: quotaCheck.quota.limit,
            remaining: quotaCheck.quota.remaining,
            message:
              'You have reached your monthly AI request limit. Please upgrade your plan to continue.',
          },
        },
        { status: 429 },
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

    // Check if user has access to the requested model based on their plan
    const hasAccess = await hasModelAccess(session.user.id, modelToUse);
    if (!hasAccess) {
      return NextResponse.json(
        {
          error: 'Model not available',
          details: {
            model: modelToUse,
            message:
              'This model is not available on your current plan. Please upgrade to access it.',
          },
        },
        { status: 403 },
      );
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
