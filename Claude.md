# Claude AI Assistant Guide

**Instructions for AI assistants working on this codebase**

---

## Overview

This is an AI SaaS starter kit built with Next.js 16, React 19, TypeScript 5.9, Tailwind CSS 4, and Drizzle ORM. When writing code for this project, **always** follow the comprehensive coding standards documented in [CODING_STANDARDS.md](./CODING_STANDARDS.md).

---

## Quick Reference for Code Generation

### Tech Stack

- **Framework**: Next.js 16.0.3 (App Router)
- **React**: 19.2.0
- **TypeScript**: 5.9.3 (strict mode)
- **Styling**: Tailwind CSS 4.1.17
- **UI Components**: shadcn/ui (New York style)
- **Forms**: React Hook Form + Zod validation
- **Auth**: Better Auth 1.3.34
- **Database**: PostgreSQL + Drizzle ORM 0.44.7
- **Linting**: Biome 2.3.0 (replaces ESLint/Prettier)
- **Testing**: Vitest with React Testing Library

### Critical Rules

**When writing TypeScript:**
- Always use strict mode (already configured)
- No `any` types - use `unknown` if type is truly unknown
- Explicit return types on all exported functions
- Validate all external inputs with Zod schemas

**When writing React components:**
- Default to Server Components (no 'use client')
- Only add 'use client' when you need: state, effects, event handlers, or browser APIs
- Use React Hook Form + Zod for all forms
- Follow the component structure in CODING_STANDARDS.md

**When writing Next.js code:**
- Fetch data server-side in Server Components
- Use Server Actions for mutations (mark with 'use server')
- Always check authentication in API routes and protected pages
- Apply rate limiting with Arcjet on all public endpoints

**When styling with Tailwind:**
- Use utility classes directly - avoid creating custom CSS
- Use `cn()` helper from `@/lib/utils` for conditional classes
- Mobile-first responsive design (base = mobile, then md:, lg:, xl:)
- Never use inline styles or styled-components

**Security requirements:**
- Validate all inputs with Zod before processing
- Check authentication on all protected routes/APIs
- Check authorization (role-based access control)
- Apply rate limiting with Arcjet
- Never log sensitive data
- Use parameterized queries (Drizzle handles this)

### Standard Patterns

**API Route Template:**
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { aj } from '@/lib/arcjet';

export async function POST(request: NextRequest) {
  // 1. Rate limiting
  const decision = await aj.protect(request);
  if (decision.isDenied()) return NextResponse.json({}, { status: 429 });

  // 2. Authentication
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return NextResponse.json({}, { status: 401 });

  // 3. Authorization (if needed)
  if (session.user.role !== 'admin') return NextResponse.json({}, { status: 403 });

  // 4. Validation
  const body = await request.json();
  const validated = schema.parse(body);

  // 5. Business logic
  // 6. Return response
}
```

**Form Component Template:**
```typescript
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  email: z.string().email(),
});

export function MyForm() {
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: { email: '' },
  });

  async function onSubmit(values: z.infer<typeof schema>) {
    // Handle submission
  }

  return <Form {...form}>{/* fields */}</Form>;
}
```

**Server Component with Auth:**
```typescript
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function ProtectedPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect('/login');

  // Fetch data and render
}
```

### File Naming & Organization

- **Files**: `kebab-case.tsx` (e.g., `user-profile.tsx`)
- **Components**: `PascalCase` exports (e.g., `export function UserProfile()`)
- **Functions**: `camelCase` (e.g., `getUserById()`)
- **Types**: `PascalCase` (e.g., `interface UserProfile {}`)

### Import Order

1. React and Next.js imports
2. Third-party libraries
3. UI components (`@/components/ui/*`)
4. Internal components
5. Utils and lib
6. Types
7. Styles

### Database Patterns

```typescript
import { db } from '@/db/drizzle';
import { user } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';

// Query
const users = await db.query.user.findMany({
  where: eq(user.role, 'admin'),
  limit: 10,
});

// Insert
const [newUser] = await db.insert(user).values(data).returning();

// Update
await db.update(user).set({ name: 'New Name' }).where(eq(user.id, userId));
```

---

## Before Writing Code

1. **Read** [CODING_STANDARDS.md](./CODING_STANDARDS.md) for detailed guidelines
2. **Check** existing code patterns in the codebase
3. **Validate** that your approach follows the standards
4. **Test** your code with `pnpm test`
5. **Lint** with `pnpm lint && pnpm format`

---

## Common Tasks

**Run development server:**
```bash
pnpm dev
```

**Check code quality:**
```bash
pnpm lint           # Biome linter
pnpm format         # Format code
pnpm type-check     # TypeScript check
```

**Run tests:**
```bash
pnpm test           # Watch mode
pnpm test:run       # Single run
pnpm test:coverage  # With coverage
```

**Database operations:**
```bash
pnpm db:push        # Push schema changes
pnpm db:studio      # Open Drizzle Studio
```

---

## Key Principles

1. **Type Safety First** - Leverage TypeScript's strict mode fully
2. **Security by Default** - Auth, validation, rate limiting on everything
3. **Server-First** - Default to Server Components, fetch data server-side
4. **Utility-First CSS** - Use Tailwind utilities, avoid custom CSS
5. **Validate Everything** - Use Zod for all external inputs
6. **Test Critical Paths** - Especially auth, payments, and security features
7. **Mobile-First** - Always design for mobile, then scale up
8. **Accessibility** - Include ARIA labels, semantic HTML, keyboard navigation

---

## What NOT to Do

❌ Use `any` type in TypeScript
❌ Create custom CSS classes instead of using Tailwind
❌ Fetch data client-side when it can be server-side
❌ Skip input validation
❌ Skip authentication/authorization checks
❌ Use inline styles
❌ Mutate objects directly
❌ Use `==` or `!=` (use `===` or `!==`)
❌ Build SQL queries from strings
❌ Log sensitive information
❌ Skip error handling

---

## Resources

- **Coding Standards**: [CODING_STANDARDS.md](./CODING_STANDARDS.md) ← **READ THIS**
- **Testing Guide**: [TESTING_GUIDE.md](./TESTING_GUIDE.md)
- **Improvement Roadmap**: [IMPROVEMENT_ROADMAP.md](./IMPROVEMENT_ROADMAP.md)
- **Project README**: [README.md](./README.md)

---

## Summary

**When in doubt:**
1. Check [CODING_STANDARDS.md](./CODING_STANDARDS.md)
2. Look at existing code for patterns
3. Prioritize security, type safety, and user experience
4. Ask before making architectural changes

**Remember**: This project uses strict TypeScript, server-first Next.js, Zod validation, and Tailwind CSS. Every piece of code should reflect these choices.

---

Last Updated: January 2025
