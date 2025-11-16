# Coding Standards Guide

**AI SaaS Starter Kit - Coding Standards & Best Practices**

This document defines the coding standards for this project. All code contributions must follow these guidelines to ensure consistency, maintainability, quality, performance, and excellent user experience.

---

## Table of Contents

- [General Principles](#general-principles)
- [TypeScript Standards](#typescript-standards)
- [React Standards](#react-standards)
- [Next.js App Router Standards](#nextjs-app-router-standards)
  - [Next.js 16 Caching with "use cache"](#nextjs-16-caching-with-use-cache)
- [Tailwind CSS Standards](#tailwind-css-standards)
- [JavaScript Standards](#javascript-standards)
- [Code Organization](#code-organization)
- [Security Standards](#security-standards)
- [Testing Standards](#testing-standards)
- [Performance Optimization](#performance-optimization)
- [UI/UX Standards](#uiux-standards)
- [Error Handling & Resilience](#error-handling--resilience)
- [Loading States & Feedback](#loading-states--feedback)
- [Accessibility Standards](#accessibility-standards)
- [Git & Documentation](#git--documentation)

---

## General Principles

### Code Quality Fundamentals

1. **Write self-documenting code** - Clear naming is better than comments
2. **Keep functions small** - Ideal function length is 5-10 lines, maximum 30 lines
3. **Single Responsibility** - Each function/component should do one thing well
4. **DRY (Don't Repeat Yourself)** - Extract repeated logic into reusable functions/components
5. **Fail fast** - Validate inputs early and throw meaningful errors
6. **Type safety first** - Leverage TypeScript's type system fully
7. **Performance by default** - Consider performance implications in every decision
8. **Accessibility first** - Build for all users, including those with disabilities

### File Naming Conventions

- **Files**: `kebab-case.tsx` (e.g., `login-form.tsx`, `nav-main.tsx`)
- **Components**: `PascalCase` exports (e.g., `export function LoginForm()`)
- **Utilities**: `camelCase` functions (e.g., `export function getUserById()`)
- **Types/Interfaces**: `PascalCase` (e.g., `interface UserProfile {}`)
- **Constants**: `UPPER_SNAKE_CASE` for compile-time constants only

---

## TypeScript Standards

### Type Safety Rules

**✅ DO:**
```typescript
// Use strict mode (already enabled in tsconfig.json)
// Explicitly type function parameters and return types
export async function getUserById(id: string): Promise<User | null> {
  const user = await db.query.user.findFirst({
    where: eq(user.id, id),
  });
  return user ?? null;
}

// Use 'unknown' instead of 'any' for unknown types
function processData(data: unknown): void {
  if (typeof data === 'string') {
    console.log(data.toUpperCase());
  }
}

// Use utility types for transformations
type UserUpdateInput = Partial<Pick<User, 'name' | 'email'>>;
type ReadonlyUser = Readonly<User>;
```

**❌ DON'T:**
```typescript
// Avoid 'any' - it defeats the purpose of TypeScript
function processData(data: any) { } // ❌

// Don't skip return types on exported functions
export function calculateTotal(items) { } // ❌

// Don't use type assertions unnecessarily
const user = response as User; // ❌ - validate instead
```

### Advanced TypeScript Patterns

```typescript
// Template literal types for string patterns
type EmailAddress = `${string}@${string}.${string}`;
type HTTPMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

// Branded types for type safety
type UserId = string & { readonly __brand: 'UserId' };
type Email = string & { readonly __brand: 'Email' };

// Conditional types for complex logic
type NonNullableFields<T> = {
  [P in keyof T]: NonNullable<T[P]>;
};

// Use type guards
function isUser(value: unknown): value is User {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'email' in value
  );
}
```

### Zod Schema Patterns

```typescript
import { z } from 'zod';

// Define schemas for all external inputs
const userSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain uppercase letter'),
  age: z.number().int().positive().optional(),
});

// Infer TypeScript types from schemas
type UserInput = z.infer<typeof userSchema>;

// Use for API validation
export async function POST(request: NextRequest) {
  const body = await request.json();
  const result = userSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { error: result.error.flatten() },
      { status: 400 }
    );
  }

  // result.data is now typed as UserInput
  const user = await createUser(result.data);
  return NextResponse.json(user);
}
```

---

## React Standards

### Component Structure

**Order of elements in a React component:**
```typescript
'use client'; // 1. Directives (if needed)

// 2. Imports (organized by type)
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// 3. Types/Interfaces
interface UserProfileProps {
  userId: string;
  className?: string;
}

// 4. Zod schemas (for forms)
const formSchema = z.object({
  name: z.string().min(2),
});

// 5. Component export
export function UserProfile({ userId, className }: UserProfileProps) {
  // 5a. Hooks (in order: state, context, refs, router, custom)
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();

  // 5b. Effects
  useEffect(() => {
    fetchUser(userId).then(setUser);
  }, [userId]);

  // 5c. Event handlers
  const handleSubmit = async () => {
    // Implementation
  };

  // 5d. Early returns
  if (!user) return <LoadingSpinner />;

  // 5e. Render
  return (
    <div className={cn('flex flex-col gap-4', className)}>
      {/* JSX */}
    </div>
  );
}
```

### React 19 Best Practices

**✅ DO:**
```typescript
// Use React 19 hooks where appropriate
import { useActionState, useOptimistic } from 'react';

// Optimistic updates
function TodoList() {
  const [optimisticTodos, addOptimisticTodo] = useOptimistic(
    todos,
    (state, newTodo) => [...state, newTodo]
  );

  return <ul>{optimisticTodos.map(todo => <li>{todo}</li>)}</ul>;
}

// Server actions with useActionState
function LoginForm() {
  const [state, formAction] = useActionState(loginAction, null);

  return (
    <form action={formAction}>
      {/* Form fields */}
    </form>
  );
}

// Extract custom hooks for reusable logic
function useLocalStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : initialValue;
  });

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue] as const;
}
```

**❌ DON'T:**
```typescript
// Don't call hooks conditionally
if (user) {
  const [count, setCount] = useState(0); // ❌
}

// Don't call hooks in loops
items.map(() => {
  const [active, setActive] = useState(false); // ❌
});

// Don't use useMemo/useCallback excessively in React 19
// (React Compiler handles this automatically)
const memoizedValue = useMemo(() => value, [value]); // Often unnecessary
```

### Component Patterns

```typescript
// Compound components pattern
export function Card({ children }: { children: React.ReactNode }) {
  return <div className="rounded-lg border">{children}</div>;
}

Card.Header = function CardHeader({ children }: { children: React.ReactNode }) {
  return <div className="p-4 border-b">{children}</div>;
};

Card.Body = function CardBody({ children }: { children: React.ReactNode }) {
  return <div className="p-4">{children}</div>;
};

// Usage
<Card>
  <Card.Header>Title</Card.Header>
  <Card.Body>Content</Card.Body>
</Card>

// Render props pattern for flexibility
interface DataFetcherProps<T> {
  url: string;
  children: (data: T | null, loading: boolean) => React.ReactNode;
}

function DataFetcher<T>({ url, children }: DataFetcherProps<T>) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(url).then(res => res.json()).then(setData).finally(() => setLoading(false));
  }, [url]);

  return <>{children(data, loading)}</>;
}
```

### Form Handling Standard

```typescript
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

// 1. Define schema
const formSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

// 2. Infer type
type FormValues = z.infer<typeof formSchema>;

// 3. Component with form
export function LoginForm() {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  async function onSubmit(values: FormValues) {
    try {
      const result = await signIn(values.email, values.password);
      if (result.success) {
        toast.success('Login successful');
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {/* Other fields */}
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? 'Logging in...' : 'Login'}
        </Button>
      </form>
    </Form>
  );
}
```

---

## Next.js App Router Standards

### Next.js 16 Caching with "use cache"

**Next.js 16 introduces Cache Components** - A revolutionary new caching system that makes caching explicit, flexible, and opt-in through the `"use cache"` directive.

#### Enabling Cache Components

First, enable the feature in your `next.config.ts`:

```typescript
// next.config.ts
import type { NextConfig } from 'next';

const config: NextConfig = {
  experimental: {
    // Enable Cache Components
    cacheLife: {
      // Define custom cache profiles
      default: {
        stale: 3600, // 1 hour
        revalidate: 900, // 15 minutes
        expire: 86400, // 1 day
      },
      // Cache profile for frequently changing data
      short: {
        stale: 60, // 1 minute
        revalidate: 30, // 30 seconds
        expire: 300, // 5 minutes
      },
      // Cache profile for rarely changing data
      long: {
        stale: 86400, // 1 day
        revalidate: 3600, // 1 hour
        expire: 604800, // 1 week
      },
      // Cache profile for static content
      forever: {
        stale: Number.POSITIVE_INFINITY,
        revalidate: 604800, // 1 week
        expire: Number.POSITIVE_INFINITY,
      },
    },
  },
};

export default config;
```

#### Using "use cache" Directive

The `"use cache"` directive can be used at three levels:

**1. Function-Level Caching (Recommended for most cases)**

```typescript
// lib/data-fetchers.ts
import 'server-only';
import { unstable_cacheLife as cacheLife } from 'next/cache';

// Cache a single function
export async function getUser(userId: string) {
  'use cache';
  cacheLife('long'); // Use the 'long' cache profile

  const user = await db.query.user.findFirst({
    where: eq(userTable.id, userId),
  });

  return user;
}

// Cache expensive computations
export async function calculateAnalytics(userId: string, period: string) {
  'use cache';
  cacheLife('short'); // Analytics change frequently

  const logs = await db.query.usageLog.findMany({
    where: eq(usageLog.userId, userId),
  });

  // Expensive aggregation
  return logs.reduce((acc, log) => {
    // Complex calculations
    return acc;
  }, {});
}

// Cache API responses
export async function getAvailableModels(plan: string) {
  'use cache';
  cacheLife('forever'); // Models rarely change

  return PLAN_FEATURES[plan]?.allowedModels || [];
}
```

**2. Component-Level Caching**

```typescript
// components/user-profile.tsx
import { unstable_cacheLife as cacheLife } from 'next/cache';

export async function UserProfile({ userId }: { userId: string }) {
  'use cache';
  cacheLife('default');

  const user = await getUser(userId);
  const stats = await getUserStats(userId);

  return (
    <div>
      <h1>{user.name}</h1>
      <p>Total usage: {stats.totalUsage}</p>
    </div>
  );
}
```

**3. File-Level Caching**

```typescript
// app/blog/[slug]/page.tsx
'use cache';

import { unstable_cacheLife as cacheLife } from 'next/cache';

// All exports in this file are cached
export default async function BlogPost({ params }: { params: Promise<{ slug: string }> }) {
  cacheLife('long');

  const { slug } = await params;
  const post = await getPost(slug);

  return <article>{post.content}</article>;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  cacheLife('long');

  const { slug } = await params;
  const post = await getPost(slug);

  return {
    title: post.title,
    description: post.excerpt,
  };
}
```

#### Cache Key Generation

Next.js automatically generates cache keys based on:

1. **Function arguments** - All serializable parameters
2. **Props** - For cached components
3. **Closure variables** - Values read from parent scope

```typescript
// ✅ Cache key includes userId and role
export async function getUserPermissions(userId: string, role: string) {
  'use cache';

  return await db.query.permissions.findMany({
    where: and(
      eq(permissions.userId, userId),
      eq(permissions.role, role)
    ),
  });
}

// ✅ Cache key includes props
export async function PricingCard({ tier }: { tier: string }) {
  'use cache';

  const features = await getPlanFeatures(tier);
  return <Card>{/* ... */}</Card>;
}

// ⚠️ Non-serializable values won't be part of cache key
export async function processData(callback: () => void) {
  'use cache';
  // ⚠️ 'callback' is not serializable, won't be in cache key

  const data = await fetchData();
  callback(); // This may cause issues
  return data;
}
```

#### When to Use "use cache"

**✅ DO use "use cache" for:**

1. **Expensive database queries**
   ```typescript
   export async function getTopUsers() {
     'use cache';
     cacheLife('short');

     return db.query.user.findMany({
       orderBy: desc(user.totalUsage),
       limit: 100,
     });
   }
   ```

2. **Complex computations**
   ```typescript
   export async function aggregateUsageMetrics(userId: string) {
     'use cache';
     cacheLife('default');

     // Heavy aggregation logic
     const metrics = await calculateMetrics(userId);
     return processMetrics(metrics);
   }
   ```

3. **External API calls**
   ```typescript
   export async function getExternalModels() {
     'use cache';
     cacheLife('long');

     const [openaiModels, openrouterModels] = await Promise.all([
       fetch('https://api.openai.com/v1/models').then(r => r.json()),
       fetch('https://openrouter.ai/api/v1/models').then(r => r.json()),
     ]);

     return [...openaiModels, ...openrouterModels];
   }
   ```

4. **Static or rarely-changing data**
   ```typescript
   export async function getPlanFeatures(plan: string) {
     'use cache';
     cacheLife('forever');

     return PLAN_FEATURES[plan];
   }
   ```

5. **Rendered components with stable data**
   ```typescript
   export async function Sidebar({ userId }: { userId: string }) {
     'use cache';
     cacheLife('default');

     const navigation = await getUserNavigation(userId);
     return <nav>{/* render navigation */}</nav>;
   }
   ```

**❌ DON'T use "use cache" for:**

1. **Highly dynamic, user-specific data**
   ```typescript
   // ❌ Session data changes constantly
   export async function getCurrentSession(token: string) {
     // Don't cache - always fetch fresh
     return await validateSession(token);
   }
   ```

2. **Mutations or operations with side effects**
   ```typescript
   // ❌ NEVER cache mutations
   export async function createUser(data: UserInput) {
     // Don't cache - this modifies data
     return await db.insert(userTable).values(data);
   }
   ```

3. **Real-time data**
   ```typescript
   // ❌ Chat messages need to be real-time
   export async function getLatestMessages(chatId: string) {
     // Don't cache - users expect instant updates
     return await db.query.messages.findMany({
       where: eq(messages.chatId, chatId),
       orderBy: desc(messages.createdAt),
     });
   }
   ```

4. **Functions with non-serializable arguments**
   ```typescript
   // ❌ Functions, Promises, Symbols can't be serialized
   export async function processWithCallback(id: string, callback: () => void) {
     'use cache'; // ❌ Won't work correctly
     // callback won't be part of cache key
   }
   ```

5. **Authentication/Authorization checks**
   ```typescript
   // ❌ Security checks should always run
   export async function checkPermission(userId: string, action: string) {
     // Don't cache - security must be checked every time
     return await hasPermission(userId, action);
   }
   ```

#### Cache Revalidation Strategies

**Time-Based Revalidation:**
```typescript
export async function getProducts() {
  'use cache';
  cacheLife('default'); // Revalidates based on profile settings

  return await db.query.products.findMany();
}
```

**On-Demand Revalidation:**
```typescript
// In your mutation
import { revalidateTag } from 'next/cache';

export async function updateProduct(id: string, data: ProductInput) {
  await db.update(products).set(data).where(eq(products.id, id));

  // Invalidate specific caches
  revalidateTag(`product-${id}`);
  revalidateTag('products-list');
}

// In your cached function
export async function getProduct(id: string) {
  'use cache';
  cacheTag(`product-${id}`); // Tag this cache

  return await db.query.products.findFirst({
    where: eq(products.id, id),
  });
}
```

#### Advanced Patterns

**Conditional Caching:**
```typescript
export async function getData(useCache: boolean, userId: string) {
  if (useCache) {
    'use cache';
    cacheLife('short');
  }

  return await db.query.user.findFirst({
    where: eq(user.id, userId),
  });
}
```

**Parallel Cached Functions:**
```typescript
export async function getDashboardData(userId: string) {
  'use cache';
  cacheLife('short');

  // All of these are cached independently
  const [user, stats, activity] = await Promise.all([
    getUser(userId),          // Has its own cache
    getUserStats(userId),     // Has its own cache
    getUserActivity(userId),  // Has its own cache
  ]);

  return { user, stats, activity };
}
```

**Cache with Fallback:**
```typescript
export async function getUserWithFallback(userId: string) {
  'use cache';
  cacheLife('default');

  try {
    const user = await db.query.user.findFirst({
      where: eq(user.id, userId),
    });
    return user || DEFAULT_USER;
  } catch (error) {
    console.error('Failed to fetch user:', error);
    return DEFAULT_USER;
  }
}
```

#### Best Practices

1. **Use appropriate cache profiles**
   - `forever`: Static content, configuration
   - `long`: Blog posts, product catalogs
   - `default`: User profiles, dashboards
   - `short`: Analytics, leaderboards

2. **Keep cached functions pure**
   ```typescript
   // ✅ Pure function - same input = same output
   export async function calculatePrice(productId: string, quantity: number) {
     'use cache';
     const product = await getProduct(productId);
     return product.price * quantity;
   }

   // ❌ Impure - depends on current time
   export async function getActivePromotions() {
     'use cache'; // ❌ Result changes based on Date.now()
     return promotions.filter(p => p.endDate > Date.now());
   }
   ```

3. **Cache at the right level**
   - Function-level: Reusable data fetching
   - Component-level: Self-contained UI sections
   - Page-level: Entire pages with stable content

4. **Monitor cache hit rates**
   ```typescript
   // Add logging to track cache effectiveness
   export async function getUser(userId: string) {
     'use cache';
     cacheLife('default');

     console.log(`Cache miss: fetching user ${userId}`);
     return await db.query.user.findFirst({
       where: eq(user.id, userId),
     });
   }
   ```

5. **Use cache tags for targeted invalidation**
   ```typescript
   import { unstable_cacheTag as cacheTag } from 'next/cache';

   export async function getUserPosts(userId: string) {
     'use cache';
     cacheTag(`user-${userId}-posts`);
     cacheTag('all-posts');

     return await db.query.posts.findMany({
       where: eq(posts.userId, userId),
     });
   }
   ```

#### Common Pitfalls

**❌ AVOID:**

1. **Caching with side effects**
   ```typescript
   // ❌ BAD - logging is a side effect
   export async function getUser(userId: string) {
     'use cache';

     await logAccess(userId); // ❌ Side effect won't run on cache hit
     return db.query.user.findFirst({ where: eq(user.id, userId) });
   }
   ```

2. **Over-caching**
   ```typescript
   // ❌ BAD - caching everything
   export async function getCurrentUser(sessionToken: string) {
     'use cache'; // ❌ Session data is too dynamic
     cacheLife('long');

     return validateSession(sessionToken);
   }
   ```

3. **Incorrect cache keys**
   ```typescript
   // ❌ BAD - using mutable objects
   export async function processData(config: { userId: string; options: any }) {
     'use cache'; // ❌ 'any' type makes caching unreliable
     // ...
   }
   ```

4. **Forgetting to invalidate**
   ```typescript
   // ❌ BAD - updating data without invalidating cache
   export async function updateUsername(userId: string, newName: string) {
     await db.update(user).set({ name: newName }).where(eq(user.id, userId));
     // ❌ Forgot to revalidateTag(`user-${userId}`)
   }
   ```

#### Migration from Legacy Caching

**Before (Next.js 14/15):**
```typescript
export const revalidate = 3600; // Page-level

export async function GET() {
  return fetch('https://api.example.com', {
    next: { revalidate: 3600 }, // Fetch-level
  });
}
```

**After (Next.js 16 with "use cache"):**
```typescript
export async function getData() {
  'use cache';
  cacheLife('default'); // More granular control

  return fetch('https://api.example.com');
}
```

#### Performance Tips

1. **Cache at multiple levels**
   ```typescript
   // Individual function cached
   export async function getProduct(id: string) {
     'use cache';
     cacheLife('long');
     return db.query.products.findFirst({ where: eq(products.id, id) });
   }

   // Component that uses cached function
   export async function ProductList({ category }: { category: string }) {
     'use cache'; // Also cache the rendered output
     cacheLife('default');

     const products = await Promise.all(
       productIds.map(id => getProduct(id)) // Each product cached individually
     );

     return <div>{products.map(/* render */)}</div>;
   }
   ```

2. **Deduplicate requests with React cache()**
   ```typescript
   import { cache } from 'react';

   // Deduplicate within a single request
   export const getUser = cache(async (userId: string) => {
     'use cache'; // Persistent cache across requests
     cacheLife('default');

     return db.query.user.findFirst({ where: eq(user.id, userId) });
   });
   ```

3. **Preload data**
   ```typescript
   // In parent component or layout
   export async function Layout({ children }: { children: React.ReactNode }) {
     // Preload data that child components will need
     getUser('123'); // Triggers cache population

     return <div>{children}</div>;
   }
   ```

### Server vs Client Components

**Default to Server Components:**
```typescript
// app/dashboard/page.tsx - Server Component (default)
import { auth } from '@/lib/auth';
import { db } from '@/db/drizzle';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
  // ✅ Fetch data server-side
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) redirect('/login');

  // ✅ Direct database queries
  const users = await db.query.user.findMany({
    limit: 10,
  });

  return <DashboardContent users={users} />;
}
```

**Use Client Components only when needed:**
```typescript
// components/interactive-chart.tsx
'use client';

import { useState } from 'react';
import { LineChart } from 'recharts';

export function InteractiveChart({ data }: { data: ChartData[] }) {
  const [selectedRange, setSelectedRange] = useState('7d');

  // ✅ Client component for interactivity
  return (
    <div>
      <button onClick={() => setSelectedRange('7d')}>7 Days</button>
      <LineChart data={data} />
    </div>
  );
}
```

### API Route Patterns

**Standard API route structure:**
```typescript
// app/api/users/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { aj } from '@/lib/arcjet';
import { db } from '@/db/drizzle';
import { z } from 'zod';

// Request validation schema
const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2),
});

export async function POST(request: NextRequest) {
  // 1. Rate limiting and security
  const decision = await aj.protect(request);
  if (decision.isDenied()) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429 }
    );
  }

  // 2. Authentication
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  if (!session) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  // 3. Authorization
  if (session.user.role !== 'admin') {
    return NextResponse.json(
      { error: 'Forbidden' },
      { status: 403 }
    );
  }

  // 4. Input validation
  const body = await request.json();
  const result = createUserSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { error: 'Invalid input', details: result.error.flatten() },
      { status: 400 }
    );
  }

  // 5. Business logic
  try {
    const user = await db.insert(userTable).values(result.data).returning();

    // 6. Audit logging
    await logAuditEvent({
      userId: session.user.id,
      action: 'user.create',
      resourceId: user[0].id,
    });

    return NextResponse.json(user[0], { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  // Similar pattern for GET requests
}
```

### Server Actions Pattern

```typescript
// app/actions/user-actions.ts
'use server';

import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export async function updateUserProfile(
  userId: string,
  data: { name: string }
) {
  // Always validate session in server actions
  const headersList = await headers();
  const session = await auth.api.getSession({ headers: headersList });

  if (!session || session.user.id !== userId) {
    throw new Error('Unauthorized');
  }

  // Update logic
  await db.update(user).set(data).where(eq(user.id, userId));

  // Revalidate affected paths
  revalidatePath(`/profile/${userId}`);

  return { success: true };
}
```

### Data Fetching Best Practices

```typescript
// ✅ DO: Parallel data fetching
async function UserDashboard({ userId }: { userId: string }) {
  const [user, posts, stats] = await Promise.all([
    fetchUser(userId),
    fetchUserPosts(userId),
    fetchUserStats(userId),
  ]);

  return <Dashboard user={user} posts={posts} stats={stats} />;
}

// ✅ DO: Use React cache for deduplication
import { cache } from 'react';

const getUser = cache(async (id: string) => {
  return db.query.user.findFirst({ where: eq(user.id, id) });
});

// ❌ DON'T: Fetch data in client components
'use client';
export function UserProfile({ userId }: { userId: string }) {
  useEffect(() => {
    fetch(`/api/users/${userId}`).then(/* ... */); // ❌
  }, [userId]);
}
```

### Routing Conventions

```typescript
// app/(auth)/login/page.tsx - Route groups for layout sharing
// app/api/users/[id]/route.ts - Dynamic route segments
// app/blog/[...slug]/page.tsx - Catch-all segments
// app/shop/[[...slug]]/page.tsx - Optional catch-all

// Access params in Server Components
export default async function UserPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await fetchUser(id);
  return <UserProfile user={user} />;
}
```

---

## Tailwind CSS Standards

### Utility-First Principles

**✅ DO:**
```typescript
// Use utility classes directly
<div className="flex items-center justify-between p-4 bg-white rounded-lg shadow-md">
  <h2 className="text-2xl font-bold text-gray-900">Title</h2>
  <button className="px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700">
    Action
  </button>
</div>

// Use cn() helper for conditional classes
import { cn } from '@/lib/utils';

<div className={cn(
  'flex items-center gap-2',
  isActive && 'bg-blue-50 border-blue-500',
  isDisabled && 'opacity-50 cursor-not-allowed'
)}>
  Content
</div>

// Mobile-first responsive design
<div className="w-full md:w-1/2 lg:w-1/3">
  <img className="w-full h-48 md:h-64 lg:h-80 object-cover" />
</div>
```

**Strategic use of @apply:**
```css
/* globals.css - Only for truly repeated patterns */
@layer components {
  .btn-primary {
    @apply px-4 py-2 font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed;
  }
}
```

**❌ DON'T:**
```typescript
// Don't overuse @apply - defeats the purpose of utility-first
.card {
  @apply flex flex-col gap-4 p-6 bg-white rounded-lg shadow; // ❌
}

// Don't create custom CSS classes for one-off styles
.my-special-div {
  padding: 16px;
  margin: 8px;
} // ❌ - Use utilities instead
```

### Component Styling Patterns

```typescript
// Variant-based styling with class merging
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        // Base styles
        'inline-flex items-center justify-center rounded-md font-medium transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        'disabled:pointer-events-none disabled:opacity-50',
        // Variants
        {
          'bg-blue-600 text-white hover:bg-blue-700': variant === 'primary',
          'bg-gray-200 text-gray-900 hover:bg-gray-300': variant === 'secondary',
          'hover:bg-gray-100': variant === 'ghost',
        },
        // Sizes
        {
          'h-8 px-3 text-sm': size === 'sm',
          'h-10 px-4': size === 'md',
          'h-12 px-6 text-lg': size === 'lg',
        },
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
```

---

## JavaScript Standards

### Modern JavaScript Features

**✅ DO:**
```javascript
// Use const/let, never var
const API_URL = 'https://api.example.com';
let counter = 0;

// Arrow functions for callbacks
const numbers = [1, 2, 3, 4, 5];
const doubled = numbers.map(n => n * 2);

// Async/await over promise chains
async function fetchUserData(userId) {
  try {
    const response = await fetch(`/api/users/${userId}`);
    if (!response.ok) throw new Error('Failed to fetch user');
    const user = await response.json();
    return user;
  } catch (error) {
    console.error('Error fetching user:', error);
    throw error;
  }
}

// Destructuring
const { name, email } = user;
const [first, second, ...rest] = items;

// Template literals
const message = `Hello, ${user.name}! You have ${notifications.length} notifications.`;

// Optional chaining
const userName = user?.profile?.name ?? 'Anonymous';

// Nullish coalescing
const port = process.env.PORT ?? 3000;

// Spread operator
const newUser = { ...user, updatedAt: new Date() };
const allItems = [...oldItems, ...newItems];
```

**❌ DON'T:**
```javascript
// Don't use var
var count = 0; // ❌

// Don't use Promise chains when async/await is clearer
fetchUser()
  .then(user => fetchPosts(user.id))
  .then(posts => processPosts(posts))
  .catch(handleError); // ❌

// Don't mutate objects directly
user.name = 'New Name'; // ❌
// Use: const updatedUser = { ...user, name: 'New Name' };

// Don't use == or !=
if (value == null) { } // ❌
// Use: if (value === null || value === undefined) { }
```

---

## Code Organization

### Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Route groups
│   ├── api/               # API routes
│   ├── dashboard/         # Feature pages
│   └── layout.tsx         # Root layout
│
├── components/
│   ├── ui/                # shadcn/ui components (auto-generated)
│   ├── forms/             # Form components
│   ├── [feature]/         # Feature-specific components
│   └── [shared].tsx       # Shared components
│
├── lib/                   # Utilities and configuration
│   ├── auth.ts           # Authentication setup
│   ├── utils.ts          # Helper functions
│   └── [service].ts      # Service integrations
│
├── db/
│   ├── drizzle.ts        # Database connection
│   └── schema.ts         # Database schema
│
├── hooks/                 # Custom React hooks
│   └── use-[name].ts
│
└── types/                 # Shared TypeScript types
    └── [domain].ts
```

### Import Organization

```typescript
// 1. React and Next.js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// 2. Third-party libraries
import { motion } from 'motion/react';
import { z } from 'zod';

// 3. UI components
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

// 4. Internal components
import { UserAvatar } from '@/components/user-avatar';
import { DataTable } from '@/components/data-table';

// 5. Utils and lib
import { cn } from '@/lib/utils';
import { auth } from '@/lib/auth';

// 6. Types
import type { User, Post } from '@/types';

// 7. Styles (if any)
import './styles.css';
```

---

## Security Standards

### Authentication & Authorization

```typescript
// Always check authentication in API routes
export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check authorization
  if (session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Proceed with logic
}

// Server components
export default async function AdminPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) redirect('/login');
  if (session.user.role !== 'admin') redirect('/dashboard');

  // Render admin content
}
```

### Input Validation

```typescript
// ALWAYS validate all external inputs
import { z } from 'zod';

const updateProfileSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  bio: z.string().max(500).optional(),
});

export async function updateProfile(data: unknown) {
  // Validate before using
  const validated = updateProfileSchema.parse(data);

  // Now safe to use validated data
  return db.update(user).set(validated);
}
```

### Prevent Common Vulnerabilities

```typescript
// ✅ SQL Injection Prevention - Use parameterized queries
const user = await db.query.user.findFirst({
  where: eq(userTable.email, email), // ✅ Parameterized
});

// ❌ DON'T build raw SQL from user input
const query = `SELECT * FROM users WHERE email = '${email}'`; // ❌ NEVER

// ✅ XSS Prevention - React escapes by default
<div>{userInput}</div> // ✅ Safe - React escapes

// ❌ DON'T use dangerouslySetInnerHTML with user input
<div dangerouslySetInnerHTML={{ __html: userInput }} /> // ❌ UNSAFE

// ✅ CSRF Prevention - Use Better Auth's built-in protection
// Already configured in this project

// ✅ Rate Limiting - Always use Arcjet
import { aj } from '@/lib/arcjet';

const decision = await aj.protect(request);
if (decision.isDenied()) {
  return new Response('Too Many Requests', { status: 429 });
}
```

### Sensitive Data Handling

```typescript
// ✅ Encrypt sensitive data
import { encryptApiKey, decryptApiKey } from '@/lib/crypto';

const encrypted = encryptApiKey(apiKey);
await db.insert(userApiKeys).values({ userId, encryptedKey: encrypted });

// ✅ Never log sensitive information
console.log('User logged in:', { userId: user.id }); // ✅
console.log('User logged in:', user); // ❌ May contain sensitive data

// ✅ Use environment variables for secrets
const dbUrl = process.env.DATABASE_URL; // ✅
const apiKey = 'hardcoded-key'; // ❌ NEVER
```

---

## Testing Standards

### Unit Testing

```typescript
// tests/utils.test.ts
import { describe, it, expect } from 'vitest';
import { cn, formatCurrency } from '@/lib/utils';

describe('Utils', () => {
  describe('cn', () => {
    it('should merge class names correctly', () => {
      const result = cn('flex items-center', 'justify-between');
      expect(result).toBe('flex items-center justify-between');
    });

    it('should handle conditional classes', () => {
      const result = cn('base', true && 'active', false && 'inactive');
      expect(result).toBe('base active');
    });
  });

  describe('formatCurrency', () => {
    it('should format USD correctly', () => {
      expect(formatCurrency(1234.56)).toBe('$1,234.56');
    });

    it('should handle zero', () => {
      expect(formatCurrency(0)).toBe('$0.00');
    });
  });
});
```

### Component Testing

```typescript
// tests/components/button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Button } from '@/components/ui/button';

describe('Button', () => {
  it('should render with children', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('should call onClick when clicked', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);

    fireEvent.click(screen.getByText('Click me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should be disabled when disabled prop is true', () => {
    render(<Button disabled>Click me</Button>);
    expect(screen.getByText('Click me')).toBeDisabled();
  });
});
```

### Test Coverage Goals

- **Critical paths**: 100% coverage (auth, payments, security)
- **Business logic**: 80%+ coverage
- **UI components**: 60%+ coverage
- **Utilities**: 90%+ coverage

---

## Performance Optimization

### Performance Monitoring

**REQUIRED: Implement performance tracking on all pages**

```typescript
// Use the provided usePerformance hook
import { usePerformance } from '@/hooks/use-performance';
import { PerformanceMonitor } from '@/components/performance-monitor';

// In your root layout (already implemented)
export default function RootLayout({ children }: React.PropsWithChildren) {
  return (
    <html>
      <body>
        <PerformanceMonitor /> {/* Tracks LCP, FCP, TTFB */}
        {children}
      </body>
    </html>
  );
}

// In custom pages/components for detailed metrics
function MyPage() {
  const { metrics, getLCPRating, getFCPRating } = usePerformance();

  // Use metrics for conditional rendering or analytics
  useEffect(() => {
    if (getLCPRating() === 'poor') {
      // Log or alert about poor performance
    }
  }, [metrics]);
}
```

### Image Optimization

**✅ DO:**
```typescript
// Always use Next.js Image component
import Image from 'next/image';

<Image
  src="/hero.jpg"
  alt="Hero image"
  width={1200}
  height={600}
  priority // For above-the-fold images
  placeholder="blur"
  blurDataURL="data:image/jpeg;base64,..."
/>

// Lazy load images below the fold
<Image
  src="/feature.jpg"
  alt="Feature"
  width={800}
  height={400}
  loading="lazy"
/>
```

**❌ DON'T:**
```typescript
// Don't use regular img tags
<img src="/large-image.jpg" /> // ❌

// Don't load huge images without optimization
<Image src="/10mb-photo.jpg" /> // ❌
```

### Code Splitting & Lazy Loading

```typescript
// Lazy load heavy components
import dynamic from 'next/dynamic';

const HeavyChart = dynamic(() => import('@/components/heavy-chart'), {
  loading: () => <ChartLoader />,
  ssr: false, // Disable SSR if not needed
});

// Lazy load routes
const AdminPanel = dynamic(() => import('@/components/admin-panel'));

// Use React.lazy for client components
const LazyComponent = lazy(() => import('./LazyComponent'));

function MyPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <LazyComponent />
    </Suspense>
  );
}
```

### Database Query Optimization

```typescript
// ✅ DO: Use indexes for frequent queries
// In schema.ts
export const user = pgTable('user', {
  id: text('id').primaryKey(),
  email: text('email').notNull(),
  role: text('role').notNull(),
}, (table) => ({
  emailIdx: index('idx_user_email').on(table.email),
  roleIdx: index('idx_user_role').on(table.role),
}));

// ✅ DO: Use parallel queries
const [users, posts, comments] = await Promise.all([
  db.query.user.findMany(),
  db.query.post.findMany(),
  db.query.comment.findMany(),
]);

// ✅ DO: Limit query results
const users = await db.query.user.findMany({
  limit: 20,
  offset: page * 20,
});

// ❌ DON'T: N+1 queries
for (const user of users) {
  const posts = await db.query.post.findMany({
    where: eq(post.userId, user.id)
  }); // ❌
}

// ✅ DO: Use joins or eager loading
const users = await db.query.user.findMany({
  with: {
    posts: true,
  },
});
```

### Bundle Size Optimization

```typescript
// ✅ DO: Import only what you need
import { Button } from '@/components/ui/button'; // ✅

// ❌ DON'T: Import entire libraries
import * as Icons from 'lucide-react'; // ❌

// ✅ DO: Use tree-shakeable imports
import { Clock, User, Mail } from 'lucide-react'; // ✅

// ✅ DO: Analyze bundle size regularly
// Run: pnpm analyze
```

### Caching Strategies

```typescript
// Cache API responses
export const revalidate = 3600; // Revalidate every hour

// Use React cache for deduplication
import { cache } from 'react';

export const getUser = cache(async (id: string) => {
  return db.query.user.findFirst({ where: eq(user.id, id) });
});

// Implement stale-while-revalidate
export const fetchOptions = {
  next: {
    revalidate: 60, // Revalidate every 60 seconds
  },
};
```

### Next.js 16 Cache Components

**This project uses Next.js 16 with `"use cache"` directive for optimal performance:**

```typescript
// Cache profiles (configured in next.config.ts)
experimental: {
  cacheLife: {
    default: { stale: 3600, revalidate: 900, expire: 86400 },
    short: { stale: 60, revalidate: 30, expire: 300 },
    long: { stale: 86400, revalidate: 3600, expire: 604800 },
    forever: { stale: Infinity, revalidate: 604800, expire: Infinity },
  },
}

// Usage in code
export const getUserPlan = cache(async (userId: string) => {
  'use cache';
  cacheLife('default'); // Uses default profile

  const subscription = await db.query.subscription.findFirst({
    where: eq(subscriptionTable.userId, userId),
  });

  return subscription?.plan || 'free';
});
```

**Cache Profile Guidelines:**
- `forever` - Static configuration, plan features
- `long` - External API models, rarely changing data (1 day cache)
- `default` - User plans, subscriptions (1 hour cache)
- `short` - Analytics, leaderboards (1 minute cache)

### Static Generation with ISR

```typescript
// Enable Incremental Static Regeneration
export const revalidate = 86400; // Revalidate every 24 hours

export default async function LandingPage() {
  // Statically generated at build time
  // Automatically revalidated every 24 hours
  return <PageContent />;
}
```

**Benefits:**
- Near-instant page loads (< 100ms TTFB)
- Perfect for SEO (fully rendered HTML)
- Scales infinitely (no server rendering on each request)

### Performance Budgets

**Target Metrics (measured by usePerformance hook):**

| Metric | Target | Good | Needs Improvement | Poor |
|--------|--------|------|-------------------|------|
| **LCP** (Largest Contentful Paint) | < 2.5s | < 2.5s | 2.5s - 4.0s | > 4.0s |
| **FCP** (First Contentful Paint) | < 1.8s | < 1.8s | 1.8s - 3.0s | > 3.0s |
| **TTFB** (Time to First Byte) | < 800ms | < 800ms | 800ms - 1.8s | > 1.8s |
| **CLS** (Cumulative Layout Shift) | < 0.1 | < 0.1 | 0.1 - 0.25 | > 0.25 |
| **FID** (First Input Delay) | < 100ms | < 100ms | 100ms - 300ms | > 300ms |
| **TTI** (Time to Interactive) | < 3.5s | < 3.5s | 3.5s - 7.3s | > 7.3s |

**Bundle Size Targets:**
- **First Load JS**: < 100 KB
- **Total Bundle**: < 500 KB
- **CSS**: < 50 KB

**How to Measure:**
```bash
# Lighthouse CI
npx lighthouse https://your-domain.com --view

# Core Web Vitals Report
# Visit: https://pagespeed.web.dev/

# Bundle analysis
pnpm build
# View .next/analyze/client.html
```

### React Compiler (Automatic Optimization)

**Enabled in this project:**
```typescript
// next.config.ts
reactCompiler: true
```

**What it does:**
- Automatically memoizes components
- Eliminates need for manual `useMemo`/`useCallback` in most cases
- Reduces re-renders by 30-50%
- Optimizes React components at build time

**When to still use manual memoization:**
- Complex comparison logic needed
- Performance-critical paths with specific requirements
- Working with very large datasets

---

## UI/UX Standards

### Error Handling & Resilience

**REQUIRED: Use error boundaries in all major sections**

```typescript
// Use the provided error boundary components
import { ErrorBoundary, PageErrorBoundary, SectionErrorBoundary } from '@/components/error-boundary';

// Page-level error boundary
export default function MyPage() {
  return (
    <PageErrorBoundary>
      <PageContent />
    </PageErrorBoundary>
  );
}

// Section-level error boundary (doesn't crash entire page)
function Dashboard() {
  return (
    <div>
      <SectionErrorBoundary title="User Stats">
        <UserStats />
      </SectionErrorBoundary>

      <SectionErrorBoundary title="Recent Activity">
        <RecentActivity />
      </SectionErrorBoundary>
    </div>
  );
}

// Custom error boundary with callback
<ErrorBoundary
  onError={(error, errorInfo) => {
    // Log to error tracking service
    logError(error, errorInfo);
  }}
>
  <CriticalComponent />
</ErrorBoundary>
```

---

## Loading States & Feedback

**REQUIRED: Always provide loading feedback**

```typescript
// Use the provided loading state components
import {
  PageLoader,
  ButtonLoader,
  TableLoader,
  CardLoader,
  DashboardLoader,
  FormLoader,
  ChatLoader,
  InlineLoader,
} from '@/components/loading-states';

// Page loading
function MyPage() {
  const [loading, setLoading] = useState(true);

  if (loading) return <PageLoader />;
  return <PageContent />;
}

// Button loading state
<Button disabled={isSubmitting}>
  {isSubmitting ? <ButtonLoader text="Saving..." /> : 'Save'}
</Button>

// Table/List loading
{loading ? <TableLoader rows={5} columns={4} /> : <DataTable data={data} />}

// Dashboard loading
{loading ? <DashboardLoader /> : <DashboardContent />}

// Form loading
{loading ? <FormLoader /> : <UserForm />}

// Chat loading
{loading ? <ChatLoader /> : <ChatMessages />}

// Inline loading for small elements
{loading ? <InlineLoader size={16} /> : <StatusBadge />}

// Next.js Suspense boundaries
<Suspense fallback={<DashboardLoader />}>
  <AsyncDashboard />
</Suspense>
```

### Loading States Best Practices

```typescript
// ✅ DO: Show skeleton loaders that match content layout
<CardLoader /> // Matches Card component structure

// ✅ DO: Use Suspense for async components
<Suspense fallback={<Skeleton />}>
  <AsyncComponent />
</Suspense>

// ✅ DO: Disable buttons during submission
<Button disabled={isSubmitting}>
  {isSubmitting ? 'Saving...' : 'Save'}
</Button>

// ❌ DON'T: Show generic spinners everywhere
{loading && <Spinner />} // ❌ Not contextual

// ❌ DON'T: Leave users without feedback
{/* No loading indicator */} // ❌
```

### Optimistic UI Updates

**Provide instant feedback for better perceived performance:**

```typescript
import { useOptimistic } from 'react';

function TodoList({ todos }: { todos: Todo[] }) {
  const [optimisticTodos, addOptimisticTodo] = useOptimistic(
    todos,
    (state, newTodo: Todo) => [...state, { ...newTodo, pending: true }]
  );

  async function handleAdd(todo: Todo) {
    addOptimisticTodo(todo); // Immediate UI update
    await saveTodo(todo); // Background save
  }

  return (
    <ul>
      {optimisticTodos.map((todo) => (
        <li key={todo.id} className={todo.pending ? 'opacity-50' : ''}>
          {todo.title}
          {todo.pending && <InlineLoader size={12} />}
        </li>
      ))}
    </ul>
  );
}
```

### Interactive Feedback

**Button States:**
```typescript
<button className={cn(
  // Base styles
  'px-4 py-2 rounded-md font-medium transition-all duration-200',

  // Default state
  'bg-blue-600 text-white',

  // Hover state
  'hover:bg-blue-700 hover:shadow-md',

  // Active/pressed state
  'active:bg-blue-800 active:scale-95',

  // Focus state (REQUIRED for accessibility)
  'focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2',

  // Disabled state
  'disabled:opacity-50 disabled:cursor-not-allowed',

  // Loading state
  loading && 'opacity-75 cursor-wait'
)}>
  {loading ? (
    <>
      <Loader2 className="h-4 w-4 animate-spin mr-2 inline" />
      Processing...
    </>
  ) : (
    'Submit'
  )}
</button>
```

**Micro-interactions:**
```typescript
// Smooth transitions
<div className="
  transform transition-all duration-200 ease-in-out
  hover:scale-105 hover:shadow-lg
  active:scale-95
">
  Interactive card
</div>

// Toast notifications with actions
import { toast } from 'sonner';

toast.error('Failed to save changes', {
  description: 'Please try again or contact support.',
  action: {
    label: 'Retry',
    onClick: () => retry(),
  },
});
```

### Responsive Design

**Mobile-First Touch Targets:**
```typescript
// Minimum 44x44px touch targets for mobile
<button className="
  min-h-[44px] min-w-[44px]  // WCAG AAA requirement
  px-4 py-2
  text-base
  active:scale-95             // Touch feedback
  transition-transform
">
  Button
</button>

// Mobile-first layout
<div className="
  flex flex-col gap-4        // Mobile: vertical stack
  md:flex-row md:gap-6       // Tablet: horizontal layout
  lg:gap-8                   // Desktop: more spacing
">
  <aside className="w-full md:w-64 lg:w-80">Sidebar</aside>
  <main className="flex-1">Main content</main>
</div>
```

### Typography and Readability

**Font Hierarchy:**
```typescript
<h1 className="text-4xl md:text-5xl font-bold tracking-tight leading-tight">
  Page Title
</h1>

<h2 className="text-3xl md:text-4xl font-semibold leading-snug">
  Section Heading
</h2>

<p className="text-base md:text-lg leading-relaxed text-gray-700 max-w-2xl">
  Body text with optimal line length (50-75 characters) and comfortable
  line height (1.5-1.75) for improved readability.
</p>

<small className="text-sm text-gray-600">Helper text</small>
```

---

## Accessibility Standards

### WCAG 2.1 Level AA Compliance

**This project aims for WCAG 2.1 Level AA compliance across all features.**

#### 1. Semantic HTML (Foundation)

```typescript
// ✅ Good - Semantic elements provide context
<nav aria-label="Main navigation">
  <ul>
    <li><a href="/dashboard">Dashboard</a></li>
  </ul>
</nav>

<main>
  <h1>Page Title</h1>
  <article>
    <h2>Article Heading</h2>
    <p>Content...</p>
  </article>
</main>

<footer>
  <p>&copy; 2025 Company</p>
</footer>

// ❌ Bad - Divs provide no semantic meaning
<div className="nav">
  <div className="link">Dashboard</div>
</div>
```

#### 2. ARIA Labels and Roles

```typescript
// Interactive elements with icons
<button
  aria-label="Close dialog"
  aria-pressed={isOpen}
  onClick={handleClose}
>
  <X className="h-4 w-4" />
</button>

// Loading states
<div role="status" aria-live="polite" aria-busy={loading}>
  {loading ? 'Loading...' : 'Content loaded'}
</div>

// Form inputs with validation
<label htmlFor="email">
  Email Address
  <input
    id="email"
    type="email"
    aria-required="true"
    aria-invalid={hasError}
    aria-describedby={hasError ? "email-error" : undefined}
  />
</label>
{hasError && (
  <p id="email-error" role="alert" className="text-red-600">
    Please enter a valid email address
  </p>
)}

// Dynamic content announcements
<div
  role="status"
  aria-live="polite"
  aria-atomic="true"
  className="sr-only"
>
  {itemCount} items in cart
</div>
```

#### 3. Color Contrast Requirements

```typescript
// WCAG AA Requirements:
// - Normal text (< 18pt): 4.5:1 contrast ratio
// - Large text (≥ 18pt or 14pt bold): 3:1 contrast ratio
// - UI components: 3:1 contrast ratio

// ✅ Good - High contrast
<p className="text-gray-900 dark:text-gray-100">
  Readable body text
</p>

// ⚠️ Avoid - Low contrast
<p className="text-gray-400">
  May not meet WCAG AA standards
</p>

// Tools to check:
// - https://webaim.org/resources/contrastchecker/
// - Chrome DevTools Accessibility panel
// - axe DevTools extension
```

#### 4. Keyboard Navigation

**All interactive elements must be keyboard accessible:**

```typescript
// Custom interactive div
<div
  role="button"
  tabIndex={0}
  onClick={handleClick}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  }}
  className="cursor-pointer"
>
  Click me
</div>

// Focus management in dialogs
import { useRef, useEffect } from 'react';

function Dialog({ isOpen }: { isOpen: boolean }) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement as HTMLElement;
      closeButtonRef.current?.focus();
    } else {
      previousFocusRef.current?.focus();
    }
  }, [isOpen]);

  return (
    <div role="dialog" aria-modal="true">
      <button ref={closeButtonRef}>Close</button>
    </div>
  );
}

// Tab order (use natural DOM order, avoid tabIndex > 0)
<form>
  <input tabIndex={0} /> {/* First */}
  <input tabIndex={0} /> {/* Second */}
  <button tabIndex={0}>Submit</button> {/* Third */}
</form>
```

#### 5. Focus Visible Styles (REQUIRED)

```css
/* Global focus styles in globals.css */
*:focus-visible {
  @apply outline-2 outline-offset-2 outline-blue-600 ring-2 ring-blue-600;
}

button:focus-visible,
a:focus-visible {
  @apply ring-2 ring-blue-600 ring-offset-2;
}
```

#### 6. Screen Reader Support

```typescript
// Descriptive labels
<img
  src="/chart.png"
  alt="Sales revenue chart showing 20% growth in Q4 2024"
/>

// Icon buttons
<button aria-label="Delete item">
  <Trash2 className="h-4 w-4" />
  <span className="sr-only">Delete</span>
</button>

// Navigation landmarks
<nav aria-label="Primary navigation">
  <a href="/dashboard">Dashboard</a>
</nav>

// Live regions for dynamic updates
<div
  role="alert"
  aria-live="assertive"  // For urgent announcements
  className="sr-only"
>
  {errorMessage}
</div>

<div
  role="status"
  aria-live="polite"  // For non-urgent updates
  aria-atomic="true"
  className="sr-only"
>
  {successMessage}
</div>

// Skip to main content link
<a
  href="#main-content"
  className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4"
>
  Skip to main content
</a>
<main id="main-content">
  {/* Page content */}
</main>
```

#### 7. Form Accessibility

```typescript
// ✅ Complete accessible form
<form onSubmit={handleSubmit}>
  <fieldset>
    <legend>Personal Information</legend>

    <div className="space-y-4">
      <FormField>
        <FormLabel htmlFor="name">
          Full Name
          <span aria-label="required" className="text-red-600">*</span>
        </FormLabel>
        <FormControl>
          <Input
            id="name"
            type="text"
            aria-required="true"
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? "name-error" : "name-hint"}
          />
        </FormControl>
        <FormDescription id="name-hint">
          Enter your full legal name
        </FormDescription>
        {errors.name && (
          <FormMessage id="name-error" role="alert">
            {errors.name.message}
          </FormMessage>
        )}
      </FormField>
    </div>
  </fieldset>

  <button
    type="submit"
    disabled={isSubmitting}
    aria-busy={isSubmitting}
  >
    {isSubmitting ? 'Submitting...' : 'Submit'}
  </button>
</form>
```

### Accessibility Testing Tools

**Automated Testing:**
```bash
# Install axe-core
pnpm add -D @axe-core/react

# In development only
if (process.env.NODE_ENV === 'development') {
  import('@axe-core/react').then((axe) => {
    axe.default(React, ReactDOM, 1000);
  });
}
```

**Manual Testing Checklist:**
1. **Keyboard Navigation**
   - Tab through entire page
   - Ensure all interactive elements are accessible
   - Verify focus indicators are visible
   - Test with only keyboard (no mouse)

2. **Screen Reader Testing**
   - macOS: VoiceOver (Cmd+F5)
   - Windows: NVDA (free)
   - Test landmark navigation
   - Verify all content is announced

3. **Color Blindness Simulation**
   - Chrome DevTools > Rendering > Emulate vision deficiencies
   - Test with different types of color blindness

4. **Zoom and Text Resize**
   - Test at 200% zoom
   - Verify no content is cut off
   - Check layout doesn't break

---

## Git & Documentation

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```bash
# Format: <type>(<scope>): <subject>

feat(auth): add Google OAuth integration
fix(api): resolve rate limiting bypass vulnerability
docs(readme): update installation instructions
refactor(components): extract common button logic
test(utils): add tests for date formatting
chore(deps): update dependencies to latest versions
perf(images): optimize image loading with lazy loading
style(ui): improve button focus states
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks
- `perf`: Performance improvements
- `style`: Code style changes (formatting, etc.)

### Code Comments

```typescript
// ✅ DO: Comment WHY, not WHAT
// User sessions expire after 7 days of inactivity for security
const SESSION_TIMEOUT = 7 * 24 * 60 * 60 * 1000;

// ✅ DO: Document complex algorithms
/**
 * Calculates usage quota based on subscription tier and overages.
 *
 * Pro tier: 1000 requests/month + $0.01 per additional request
 * Startup tier: 10000 requests/month + $0.005 per additional request
 */
function calculateUsageCost(requests: number, tier: string): number {
  // Implementation
}

// ❌ DON'T: State the obvious
// Increment counter
counter++; // ❌

// Get user by ID
const user = await getUserById(id); // ❌
```

### JSDoc for Public APIs

```typescript
/**
 * Fetches user data from the database by ID.
 *
 * @param id - The unique identifier of the user
 * @returns Promise resolving to the user object or null if not found
 * @throws {ValidationError} If the ID format is invalid
 * @throws {DatabaseError} If the database query fails
 *
 * @example
 * ```typescript
 * const user = await getUser('user_123');
 * if (user) {
 *   console.log(user.email);
 * }
 * ```
 */
export async function getUser(id: string): Promise<User | null> {
  // Implementation
}
```

---

## Checklist for Code Review

Before submitting code for review, ensure:

### Code Quality
- [ ] Code follows TypeScript strict mode (no `any` types)
- [ ] All functions have explicit return types
- [ ] Components follow the standard structure
- [ ] Server/Client components are correctly separated

### Performance
- [ ] Images are optimized with Next.js Image
- [ ] Heavy components are lazy-loaded
- [ ] Database queries are optimized with indexes
- [ ] Performance metrics are monitored with usePerformance

### UI/UX
- [ ] Error boundaries are implemented
- [ ] Loading states are shown for all async operations
- [ ] All interactive elements have hover/focus/active states
- [ ] Forms provide clear validation feedback

### Security
- [ ] All user inputs are validated with Zod
- [ ] API routes include auth, rate limiting, and error handling
- [ ] No sensitive data in logs or client-side code
- [ ] Security best practices followed

### Accessibility
- [ ] Color contrast meets WCAG AA standards
- [ ] All interactive elements are keyboard accessible
- [ ] Images have alt text
- [ ] Forms have proper labels and error messages

### Testing
- [ ] Tests are written for new functionality
- [ ] All tests pass (`pnpm test:run`)
- [ ] E2E tests cover critical flows

### Code Style
- [ ] Tailwind utilities are used (not custom CSS)
- [ ] `cn()` is used for conditional class names
- [ ] No console.logs in production code
- [ ] Code is formatted with Biome (`pnpm format`)
- [ ] No linting errors (`pnpm lint`)
- [ ] TypeScript compiles without errors (`pnpm type-check`)
- [ ] Commit messages follow conventional commits format

---

## Quick Reference

### Common Patterns

```typescript
// Form with validation
const schema = z.object({ /* ... */ });
const form = useForm<z.infer<typeof schema>>({
  resolver: zodResolver(schema),
});

// API route
export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return NextResponse.json({}, { status: 401 });
  // ...
}

// Server component with auth
export default async function Page() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect('/login');
  // ...
}

// Database query
const users = await db.query.user.findMany({
  where: eq(user.role, 'admin'),
  limit: 10,
});

// Error boundary
<PageErrorBoundary>
  <YourPage />
</PageErrorBoundary>

// Loading state
{loading ? <PageLoader /> : <Content />}

// Performance monitoring
const { metrics, getLCPRating } = usePerformance();

// Class name merging
className={cn('base-classes', condition && 'conditional-classes', className)}
```

---

## Tool Commands

```bash
# Development
pnpm dev              # Start dev server with Turbopack

# Code Quality
pnpm lint            # Run Biome linter
pnpm format          # Format code with Biome
pnpm type-check      # Check TypeScript types

# Testing
pnpm test            # Run tests in watch mode
pnpm test:run        # Run tests once
pnpm test:coverage   # Run tests with coverage
pnpm test:e2e        # Run E2E tests
pnpm test:e2e:ui     # Run E2E tests in UI mode

# Database
pnpm db:push         # Push schema changes
pnpm db:studio       # Open Drizzle Studio
pnpm db:generate     # Generate migrations

# Build
pnpm build           # Build for production
pnpm analyze         # Analyze bundle size
```

---

## Resources

- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [React Documentation](https://react.dev/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Zod Documentation](https://zod.dev/)
- [Better Auth Documentation](https://www.better-auth.com/docs)
- [Drizzle ORM Documentation](https://orm.drizzle.team/docs/overview)
- [Web Vitals](https://web.dev/vitals/)
- [WCAG Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

---

**Last Updated:** January 2025
**Version:** 2.0.0

This guide is a living document. As the project evolves and new patterns emerge, update this guide to reflect current best practices.
