# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed

#### Dependency Upgrades (all packages to latest)
- Next.js 16.2.2 → 16.3.3, React 19.2.4, TypeScript 6.0.2
- AI SDK 6 → 7 (`ai@7`, `@ai-sdk/openai@4`, `@ai-sdk/react@4`, `@openrouter/ai-sdk-provider@3`)
- Better Auth 1.5 → 1.7, Drizzle ORM 0.45, Vitest 4.1, Playwright 1.62
- Biome 2.4 → 2.5 (migrated `linter.rules.recommended` → `preset`, added SVG a11y override)
- TanStack Table 8 → 9 (migrated `data-table.tsx` to `useTable`/`tableFeatures` API, `table.state` reads)
- Motion 12 → 13, nanoid 5 → 6, Sentry 10.72, commitlint 21, lint-staged 17
- Vitest config: replaced deprecated `__dirname` with `import.meta.dirname`
- Added `@sentry/nextjs` test mock (new SDK crashes at import time under Vitest)

#### Payment Provider Migration (Polar → Razorpay)
- Replaced Polar.sh with Razorpay as the payment provider
- New `razorpay` SDK integration (`src/lib/razorpay-client.ts`) with subscription-based checkout
- New webhook endpoint `POST /api/webhooks/razorpay` with HMAC-SHA256 (timing-safe) signature verification
- Handles `subscription.activated`, `subscription.charged`, `subscription.updated`, `subscription.cancelled`, `subscription.completed`, and `payment.failed` events
- Renamed DB columns: `subscription.polar_subscription_id` → `razorpay_subscription_id`, `polar_customer_id` → `razorpay_customer_id` (run `bun db:push` to apply)
- Environment variables: `POLAR_*` → `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`, `RAZORPAY_PLAN_FREE/PRO/STARTUP`
- Plan IDs (`plan_xxx`) are created in the Razorpay Dashboard under Subscriptions > Plans

## [1.0.0] - 2025-01-04 - Initial Open Source Release

### Features

#### Core Infrastructure
- Next.js 16.0.3 with App Router and React 19.2.0
- TypeScript 5.9.3 with strict mode enabled
- Tailwind CSS 4.1.17 for modern, utility-first styling
- Drizzle ORM 0.44.7 with PostgreSQL database
- Biome 2.3.0 for fast linting and formatting

#### Authentication & Authorization
- Better Auth 1.3.34 integration for secure authentication
- Google OAuth support for social login
- Role-Based Access Control (RBAC) system
- User session management
- Password reset functionality
- Email verification

#### AI Features
- AI chat interface with streaming responses
- OpenAI integration using Vercel AI SDK 5.0.93
- Multi-model support for AI providers
- Token usage tracking

#### Payment Integration
- Polar SDK 0.40.3 for payment processing
- Multi-tier subscription management (Free, Pro, Startup)
- Webhook handling for payment events
- Subscription upgrade/downgrade flows

#### Workspace Management
- Multi-workspace support
- Workspace invitations
- Team collaboration features
- Workspace-level permissions

#### Security Features
- Arcjet rate limiting and bot protection
- Helmet.js security headers
- AES-256-GCM encryption for API keys
- Comprehensive audit logging
- CSRF protection
- Input validation with Zod

#### Developer Experience
- Biome for fast linting and formatting (replaces ESLint/Prettier)
- Vitest 4.0.9 for unit testing with React Testing Library
- Playwright 1.48.2 for end-to-end testing
- GitHub Actions CI/CD pipeline
- Docker Compose support for local development
- Lefthook for Git hooks (replaces Husky)
- Conventional Commits with Commitizen

#### Monitoring & Analytics
- Sentry error tracking (client, server, and edge)
- PostHog 1.293.0 analytics integration
- Winston logging with structured logs
- Source map upload for better error tracking

#### Documentation
- Comprehensive coding standards (2,600+ lines)
- Testing guides and best practices
- DevOps implementation plan
- Performance optimization guide
- E2E testing quickstart
- API documentation with Swagger

#### Database Schema
- Users and authentication tables
- Workspaces and memberships
- Subscriptions and payments
- API keys with encryption
- Audit logs for compliance
- Rate limiting tables

### Infrastructure
- Vercel deployment ready
- Environment variable management
- Database migrations with Drizzle
- Seed scripts for development data
- Admin user creation script

### Testing
- 218+ unit tests with Vitest
- Comprehensive E2E test suite with Playwright
- Test coverage reports
- CI integration for automated testing

[1.0.0]: https://github.com/your-username/ai-saas-starter-kit/releases/tag/v1.0.0
