import { eq } from 'drizzle-orm';
import { type NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/drizzle';
import { user } from '@/db/schema';
import { aj } from '@/lib/arcjet';
import { auth } from '@/lib/auth';
import { decrypt } from '@/lib/crypto';
import { getAllowedModels } from '@/lib/subscription-features';

interface OpenAIModel {
  id: string;
  object: string;
  created: number;
  owned_by: string;
}

interface OpenRouterModel {
  id: string;
  name: string;
  created: number;
  description?: string;
  context_length: number;
  architecture?: {
    modality?: string;
    tokenizer?: string;
    instruct_type?: string;
  };
  pricing: {
    prompt: string;
    completion: string;
    request?: string;
    image?: string;
  };
  top_provider?: {
    max_completion_tokens?: number;
    is_moderated?: boolean;
  };
}

export async function GET(request: NextRequest) {
  try {
    // Apply Arcjet protection to models API requests
    const decision = await aj.protect(request);
    if (decision.isDenied()) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's API configuration
    const [userData] = await db
      .select()
      .from(user)
      .where(eq(user.id, session.user.id))
      .limit(1);

    if (!userData?.provider || !userData?.apiKeys) {
      return NextResponse.json(
        { error: 'No API configuration found' },
        { status: 404 },
      );
    }

    const apiKey = decrypt(userData.apiKeys);

    // Get allowed models for user's subscription plan
    const allowedModels = await getAllowedModels(session.user.id);
    const hasAllAccess = allowedModels.includes('*');

    if (userData.provider === 'openai') {
      // Fetch OpenAI models
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch OpenAI models');
      }

      const data = await response.json();
      const models = (data.data as OpenAIModel[])
        .filter((model) => model.id.includes('gpt'))
        .filter((model) => hasAllAccess || allowedModels.includes(model.id))
        .sort((a, b) => b.created - a.created)
        .map((model) => ({
          id: model.id,
          name: model.id
            .split('-')
            .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
            .join(' '),
          provider: 'openai',
          locked: !hasAllAccess && !allowedModels.includes(model.id),
        }));

      return NextResponse.json({ models, planModels: allowedModels });
    } else if (userData.provider === 'openrouter') {
      // Fetch OpenRouter models
      const response = await fetch('https://openrouter.ai/api/v1/models', {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'HTTP-Referer': request.headers.get('referer') || '',
          'X-Title': 'AI Chat',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch OpenRouter models');
      }

      const data = await response.json();
      const models = (data.data as OpenRouterModel[])
        .filter((model) => {
          // Filter out models that are unavailable or have issues
          const isAvailable =
            model.pricing && parseFloat(model.pricing.prompt) > 0;
          return isAvailable;
        })
        .filter((model) => hasAllAccess || allowedModels.some(allowed => model.id.includes(allowed)))
        .sort((a, b) => {
          // Sort by popularity/creation date
          return b.created - a.created;
        })
        .map((model) => ({
          id: model.id,
          name: model.name,
          provider: 'openrouter',
          contextLength: model.context_length,
          description: model.description,
          locked: !hasAllAccess && !allowedModels.some(allowed => model.id.includes(allowed)),
        }));

      return NextResponse.json({ models, planModels: allowedModels });
    }

    return NextResponse.json({ error: 'Invalid provider' }, { status: 400 });
  } catch (error) {
    console.error('Error fetching models:', error);
    return NextResponse.json(
      { error: 'Failed to fetch models' },
      { status: 500 },
    );
  }
}
