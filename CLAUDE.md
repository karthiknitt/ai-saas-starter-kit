# AI SaaS Starter Kit — CLAUDE.md

## Project Overview

A production-ready full-stack AI SaaS application starter kit. Provides complete auth, AI chat, multi-tenant workspaces, subscription billing, RBAC, admin dashboard, usage tracking, and audit logging.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (Canary) + App Router + React 19 |
| Language | TypeScript 5.9 (strict mode) |
| Styling | Tailwind CSS 4.1 + shadcn/ui |
| Database | PostgreSQL via Neon + Drizzle ORM 0.45 |
| Auth | Better Auth 1.4 (email/password + Google OAuth) |
| Email | Resend + React Email templates |
| AI | Vercel AI SDK 5.0 + OpenAI / OpenRouter |
| Payments | Polar.sh |
| Security | Arcjet (rate limiting) + Helmet + AES-256-GCM encryption |
| Monitoring | Sentry + Winston + PostHog |
| Package manager | Bun (never npm/yarn) |
| Linting | Biome 2.3 |
| Testing | Vitest 4.0 (unit) + Playwright 1.57 (E2E) |
| CI/CD | GitHub Actions + Vercel |

## Project Structure

```
src/
├── app/
│   ├── (auth)/         # login, signup, forgot-password, reset-password
│   ├── admin/          # admin dashboard, users, audit-logs
│   ├── aichat/         # AI chat interface
│   ├── api/            # 21 API routes (see below)
│   ├── billing/        # pricing page, checkout success
│   ├── dashboard/      # user home, workspaces, analytics, sessions, subscriptions
│   ├── workspace/      # workspace management UI
│   └── api-docs/       # Swagger UI
├── components/
│   ├── ui/             # shadcn/ui components (excluded from type-check)
│   ├── ai-elements/    # AI-specific components
│   ├── forms/          # auth & settings forms
│   └── emails/         # React email templates
├── db/
│   ├── schema.ts       # 14-table Drizzle schema
│   └── drizzle.ts      # DB client
├── lib/                # auth.ts, crypto.ts, usage-tracker.ts, permissions.ts, etc.
├── hooks/              # use-mobile, use-performance, use-permission
└── providers/          # PostHog provider
unit-tests/             # 40+ Vitest tests
e2e/                    # 5 Playwright tests
migrations/             # Drizzle SQL migrations
scripts/                # seed.ts, make-admin.ts, test-email.ts
```

## API Routes (21 endpoints)

- `POST /api/chat` — streaming AI responses, quota tracking
- `GET|POST|DELETE /api/user/api-keys` — encrypted key management
- `GET|POST /api/workspaces` + `[id]` routes — workspace CRUD + members + invitations
- `POST /api/billing/checkout`, `GET /api/billing/subscription`, `GET /api/billing/usage`
- `GET /api/admin/users`, `GET /api/admin/audit-logs`
- `GET /api/analytics`, `GET /api/models`, `GET /api/health`
- `POST /api/webhooks/polar` — subscription webhook (HMAC-SHA256 verified)

## Database Schema (14 tables)

Auth: `user`, `session`, `account`, `verification`  
Billing: `subscription`, `usageQuota`  
Tracking: `usageLog`, `webhookEvent`  
Workspace: `workspace`, `workspaceMember`, `workspaceInvitation`  
Permissions: `permission`, `rolePermission`  
Audit: `auditLog`

## Subscription Plans

| Plan | Requests/month | Models |
|---|---|---|
| Free | 10 | Basic |
| Pro | 1000 | All |
| Startup | Unlimited | All |

## Key Commands

```bash
bun dev           # Start dev server (Turbopack)
bun build         # Production build
bun test          # Unit tests (watch)
bun test:run      # Unit tests (single run)
bun test:coverage # Coverage report
bun test:e2e      # E2E tests
bun db:push       # Apply Drizzle schema changes
bun db:studio     # Drizzle Studio
bun lint          # Biome lint
bun format        # Biome format
bun type-check    # tsc --noEmit
```

## Conventions

- **Path alias**: `@/*` → `src/*`
- **Imports**: organized by Biome automatically
- **API responses**: `{ data, error }` JSON format
- **Error handling**: Winston logger + Sentry in production
- **Encryption**: AES-256-GCM with random IV for API keys
- **Webhook security**: HMAC-SHA256 with timing-safe comparison
- **DB queries**: via Drizzle ORM, client imported from `@/db/drizzle`
- **Auth sessions**: Better Auth server-side, secure cookies
- **Rate limiting**: Arcjet on `/api/chat`

## Environment Variables

See `.env.example` for all required variables. Key groups:
- `DATABASE_URL` — PostgreSQL (Neon recommended)
- `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL` — Auth
- `GOOGLE_CLIENT_ID/SECRET` — OAuth
- `POLAR_*` — Payments (access token, webhook secret, 3 product IDs)
- `RESEND_API_KEY`, `RESEND_SENDER_EMAIL` — Email
- `OPENAI_API_KEY` — AI provider
- `ENCRYPTION_KEY` — 32-byte hex key for AES-256-GCM
- `ARCJET_KEY` — Rate limiting
- `SENTRY_*`, `NEXT_PUBLIC_SENTRY_DSN` — Error tracking
- `NEXT_PUBLIC_POSTHOG_KEY/HOST` — Analytics (optional)

## TODOs

All Next.js 16.x upgrade tasks complete (merged via PR #72 and PR #73).

## Pre-Push Checklist

Before every push:
1. `bun run format` — Biome formatting
2. `bun run lint` — Biome lint (zero errors)
3. `bun run type-check` — no TypeScript errors
4. `bun run build` — no build errors
5. `bun test:run` — all unit tests pass
