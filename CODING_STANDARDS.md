# Coding Standards Guide

**AI SaaS Starter Kit - Coding Standards & Best Practices**

This document defines the coding standards for this project. All code contributions must follow these guidelines to ensure consistency, maintainability, and quality.

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

### Accessibility with Tailwind

```typescript
// Always include focus states
<button className="rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
  Click me
</button>

// Use screen reader utilities
<span className="sr-only">Loading...</span>

// Proper contrast ratios
<div className="bg-gray-900 text-white"> // ✅ Good contrast
  <p className="text-gray-100">Content</p>
</div>
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

### Error Handling

```typescript
// Always use try-catch for async operations
async function processPayment(amount: number) {
  try {
    const result = await paymentService.charge(amount);
    await logAuditEvent('payment.success', result.id);
    return { success: true, data: result };
  } catch (error) {
    // Log errors with context
    console.error('Payment processing failed:', {
      amount,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });

    // Return user-friendly errors
    return {
      success: false,
      error: 'Payment processing failed. Please try again.',
    };
  }
}

// Create custom error classes
class ValidationError extends Error {
  constructor(
    message: string,
    public field: string,
    public code: string
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

// Use error boundaries in React
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback />;
    }
    return this.props.children;
  }
}
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

### Function Organization

```typescript
// Organize related functions together

// 1. Type definitions
interface UserService {
  getUser: (id: string) => Promise<User>;
  updateUser: (id: string, data: Partial<User>) => Promise<User>;
  deleteUser: (id: string) => Promise<void>;
}

// 2. Helper functions
function validateUserId(id: string): boolean {
  return id.length > 0 && id.length <= 100;
}

function formatUserData(user: User): FormattedUser {
  return {
    ...user,
    fullName: `${user.firstName} ${user.lastName}`,
  };
}

// 3. Main exported functions
export async function getUser(id: string): Promise<User> {
  if (!validateUserId(id)) {
    throw new ValidationError('Invalid user ID', 'id', 'INVALID_ID');
  }

  const user = await db.query.user.findFirst({
    where: eq(userTable.id, id),
  });

  if (!user) {
    throw new NotFoundError('User not found');
  }

  return user;
}
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

- [ ] Code follows TypeScript strict mode (no `any` types)
- [ ] All functions have explicit return types
- [ ] Components follow the standard structure
- [ ] Server/Client components are correctly separated
- [ ] All user inputs are validated with Zod
- [ ] API routes include auth, rate limiting, and error handling
- [ ] Tailwind utilities are used (not custom CSS)
- [ ] `cn()` is used for conditional class names
- [ ] Tests are written for new functionality
- [ ] No console.logs in production code
- [ ] Security best practices followed
- [ ] Commit messages follow conventional commits format
- [ ] Code is formatted with Biome (`pnpm format`)
- [ ] No linting errors (`pnpm lint`)
- [ ] TypeScript compiles without errors (`pnpm type-check`)

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

# Database
pnpm db:push         # Push schema changes
pnpm db:studio       # Open Drizzle Studio
pnpm db:generate     # Generate migrations

# Build
pnpm build           # Build for production
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

---

**Last Updated:** January 2025
**Version:** 1.0.0

This guide is a living document. As the project evolves and new patterns emerge, update this guide to reflect current best practices.
