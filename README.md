# AI SaaS Starter Kit

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![CI](https://github.com/karthiknitt/ai-saas-starter-kit/workflows/CI/badge.svg)](https://github.com/karthiknitt/ai-saas-starter-kit/actions)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-16-black.svg)](https://nextjs.org/)

A production-ready, full-stack AI SaaS application starter kit built with Next.js 16, React 19, and TypeScript. Ship your AI-powered SaaS product faster with authentication, payments, AI chat, role-based access control, and comprehensive security built-in.

⭐ **If you find this project helpful, please give it a star!** ⭐

## Features

### Core Features
- **Modern Tech Stack**: Next.js 16.1 with App Router, React 19.2, TypeScript 5.9, Tailwind CSS 4.1
- **AI Chat Interface**: Streaming AI responses with OpenAI integration and custom API key management
- **Authentication**: Email/password + Google OAuth via Better Auth
- **Payment Integration**: Subscription management with Polar (Free, Pro, Startup plans)
- **Database**: PostgreSQL with Drizzle ORM
- **UI Components**: 50+ customizable shadcn/ui components
- **Error Monitoring**: Sentry integration for production error tracking

### Advanced Features
- **Multi-Tenancy/Workspaces**: Complete team workspace management with UI and member controls
- **Role-Based Access Control (RBAC)**: Granular permission system with admin dashboard
- **Usage Tracking**: Quota enforcement and feature gating by subscription tier
- **Audit Logging**: Comprehensive activity tracking for compliance and workspace actions
- **Encrypted API Key Management**: Secure storage for user API keys
- **Rate Limiting**: Protection against abuse with Arcjet
- **Security Headers**: Helmet integration for enhanced security
- **Email Integration**: Resend for transactional emails
- **Product Analytics**: PostHog integration for event tracking and user behavior analysis
- **API Documentation**: Interactive Swagger UI documentation for all endpoints
- **Advanced Analytics**: Usage insights dashboard with charts and metrics

### Developer Experience
- **Type Safety**: Strict TypeScript configuration
- **Testing**: 40+ unit tests with Vitest + 5 E2E tests with Playwright
- **Code Quality**: Biome for linting and formatting
- **Git Hooks**: Lefthook for pre-commit checks and conventional commits
- **Hot Reload**: Turbopack for blazing-fast development
- **React Compiler**: Automatic memoization for optimized performance
- **MCP Integration**: Built-in Model Context Protocol for AI-assisted debugging (dev-only)
- **Continuous Integration**: GitHub Actions CI/CD pipeline

## Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** 18.x or higher
- **Bun** 1.x or higher (recommended package manager, linter, formatter, and test runner)
- **PostgreSQL** database (we recommend [Neon](https://neon.tech) or use Docker for local development)
- **Git**
- **Docker** (optional, for local PostgreSQL database)

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/karthiknitt/ai-saas-starter-kit.git
cd ai-saas-starter-kit
```

### 2. Install Dependencies

```bash
bun install
```

### 3. Environment Configuration

Copy the example environment file and configure your variables:

```bash
cp .env.example .env
```

Edit `.env` and configure the following required variables:

#### Authentication
```env
BETTER_AUTH_SECRET=your-random-secret-key-here
BETTER_AUTH_URL=http://localhost:3000
```

Generate a secure secret:
```bash
openssl rand -base64 32
```

#### Database
```env
DATABASE_URL='postgresql://user:password@host:port/database'
```

Get a free PostgreSQL database from [Neon](https://neon.tech) or use your own.

#### Google OAuth (Optional)
```env
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

Create credentials at [Google Cloud Console](https://console.cloud.google.com/apis/credentials)

#### Polar Payment Integration
```env
POLAR_ACCESS_TOKEN=polar_at_xxx
POLAR_SUCCESS_URL=http://localhost:3000/success?checkout_id={CHECKOUT_ID}
POLAR_WEBHOOK_SECRET=polar_wh_sec_xxx

POLAR_PRODUCT_FREE=prod_xxx
POLAR_PRODUCT_PRO=prod_xxx
POLAR_PRODUCT_STARTUP=prod_xxx
```

Sign up at [Polar](https://polar.sh) and create your products.

#### Email Service
```env
RESEND_API_KEY=re_xxx
RESEND_SENDER_EMAIL=onboarding@yourdomain.com
```

Get an API key from [Resend](https://resend.com)

#### AI Integration
```env
OPENAI_API_KEY=sk-xxx
```

Get your API key from [OpenAI](https://platform.openai.com/api-keys)

#### Security
```env
ENCRYPTION_KEY=your-32-byte-encryption-key
ARCJET_KEY=ajkey_xxx
```

Generate encryption key:
```bash
openssl rand -hex 32
```

Get Arcjet key from [Arcjet](https://arcjet.com)

#### Analytics (Optional but Recommended)
```env
NEXT_PUBLIC_POSTHOG_KEY=phc_xxx
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
```

Get your PostHog API key from [PostHog](https://posthog.com). PostHog provides:
- Product analytics and user tracking
- Session replay for debugging
- Feature flags for gradual rollouts
- A/B testing capabilities
- Funnel analysis and retention metrics

**Why PostHog?**
- Self-hosted or cloud options
- Privacy-friendly with GDPR compliance
- Comprehensive analytics without vendor lock-in
- Perfect for understanding workspace usage patterns
- Automatic page view tracking
- Client and server-side event tracking

#### Error Monitoring (Optional but Recommended)
```env
SENTRY_ORG=your-sentry-organization-slug
SENTRY_PROJECT=your-sentry-project-slug
SENTRY_AUTH_TOKEN=sntrys_auth-token-goes-here
SENTRY_DSN=https://your-sentry-dsn
NEXT_PUBLIC_SENTRY_DSN=https://your-sentry-dsn-public
```

Get your Sentry configuration from [Sentry](https://sentry.io). Sentry provides:
- Real-time error tracking and alerting
- Performance monitoring and profiling
- Session replay for debugging
- Release tracking and deployment monitoring
- Source map support for production debugging

### 4. Database Setup

Run database migrations:

```bash
bun db:push
```

(Optional) Seed the database with sample data:

```bash
bun db:seed
```

### 5. Start Development Server

```bash
bun dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see your application.

### 6. Create an Admin User

After signing up, make your account an admin:

```bash
bun make-admin
```

Follow the prompts to enter your email address.

## Available Scripts

### Development
- `bun dev` - Start development server with Turbopack
- `bun build` - Build for production
- `bun start` - Start production server
- `bun lint` - Lint and fix code with Biome
- `bun format` - Format code with Biome
- `bun type-check` - Run TypeScript type checking

### Testing
- `bun test` - Run unit tests in watch mode
- `bun test:run` - Run unit tests once
- `bun test:coverage` - Generate test coverage report
- `bun test:e2e` - Run E2E tests with Playwright
- `bun test:e2e:ui` - Run E2E tests with Playwright UI
- `bun test:e2e:headed` - Run E2E tests in headed mode
- `bun test:e2e:debug` - Debug E2E tests with Playwright
- `bun test:e2e:setup` - Set up E2E test environment

### Database
- `bun db:studio` - Open Drizzle Studio (database GUI)
- `bun db:push` - Push schema changes to database
- `bun db:migrate` - Run migrations
- `bun db:seed` - Seed database with sample data

### Utilities
- `bun make-admin` - Make a user an admin
- `bun analyze` - Analyze bundle size
- `bun test:email` - Test email configuration

### Docker (Optional for Local Development)
- `bun docker:up` - Start PostgreSQL in Docker
- `bun docker:down` - Stop PostgreSQL container
- `bun docker:logs` - View PostgreSQL logs
- `bun docker:reset` - Reset PostgreSQL database

## Advanced Development Features

### React Compiler

This project uses the React Compiler for automatic memoization and performance optimization. The compiler is enabled in `next.config.ts`:

```typescript
reactCompiler: true
```

**Benefits:**
- Automatic memoization of components
- Reduced unnecessary re-renders
- Zero manual optimization code required
- Built-in optimization without `useMemo` or `useCallback`

**Note:** Build times may be slightly higher with the React Compiler enabled, but runtime performance is significantly improved.

### Model Context Protocol (MCP)

Next.js 16 includes built-in MCP support for AI-assisted debugging. The MCP server is **automatically enabled in development mode only** at:

```
http://localhost:3000/_next/mcp
```

**Security:**
- MCP endpoint is only available during development (`pnpm dev`)
- Automatically disabled in production builds
- No authentication required for local development
- Never exposed in production without explicit configuration

**Using MCP with AI Assistants:**

To connect AI coding assistants to your Next.js dev server:

1. Install the MCP client: `npx -y next-devtools-mcp@latest`
2. Configure your AI assistant's MCP settings to point to the dev server
3. Access real-time error detection, build status, and runtime diagnostics

**Available Capabilities:**
- Real-time error detection and diagnostics
- Build error monitoring
- Runtime error tracking
- Type error analysis
- Live application state queries

## Project Structure

```
├── src/
│   ├── app/                    # Next.js app router pages
│   │   ├── (auth)/            # Authentication pages (login, signup)
│   │   ├── admin/             # Admin dashboard
│   │   ├── aichat/            # AI chat interface
│   │   ├── api/               # API routes
│   │   ├── api-docs/          # Swagger API documentation
│   │   ├── billing/           # Payment and subscription pages
│   │   ├── dashboard/         # User dashboard and analytics
│   │   ├── sentry-example-page/ # Sentry error monitoring demo
│   │   └── workspace/         # Workspace management
│   ├── components/            # React components
│   │   ├── ui/               # shadcn/ui components
│   │   ├── forms/            # Form components
│   │   ├── emails/           # Email templates
│   │   └── ai-elements/      # AI-specific UI components
│   ├── db/                   # Database schema and utilities
│   ├── hooks/                # Custom React hooks
│   ├── lib/                  # Utilities and configurations
│   └── providers/            # React context providers
├── scripts/                  # Utility scripts
├── public/                   # Static assets
├── migrations/               # Database migrations
├── unit-tests/               # Unit tests (40+ tests)
├── e2e/                      # End-to-end tests (5 tests)
└── docs/                     # Documentation
```

## Key Features Guide

### AI Chat
- Navigate to the chat interface after logging in
- Configure your OpenAI API key in settings (encrypted storage)
- Start chatting with AI with streaming responses
- Usage tracked and limited by subscription tier

### Workspace Management
- Create and manage team workspaces at `/dashboard/workspaces`
- Invite team members with role-based access (Owner, Admin, Member, Viewer)
- Switch between workspaces using the sidebar switcher
- Each workspace has its own members, settings, and plan
- Workspace-level role management and permissions

### Subscription Plans
- **Free**: 10 messages/month, basic features
- **Pro**: 1000 messages/month, advanced features
- **Startup**: Unlimited messages, all features

### Admin Dashboard
- Access at `/admin` (admin role required)
- User management with role assignment
- View audit logs and system activity
- Monitor usage and subscriptions

### Analytics & Insights
- View usage analytics at `/dashboard/analytics`
- Track AI model usage breakdown
- Monitor response times and error rates
- Export usage reports
- PostHog integration for product analytics

### API Documentation
- Interactive API documentation at `/api-docs`
- Comprehensive endpoint reference
- Request/response examples
- Code snippets for integration

### API Key Management
- Users can add their own OpenAI API keys
- Keys are encrypted at rest using AES-256-GCM
- Automatic key rotation support

## Deployment

### Continuous Integration

This project includes a GitHub Actions CI pipeline that:
- Runs on every push and pull request
- Executes linting with Biome
- Runs type checking with TypeScript
- Executes unit tests with Vitest
- Ensures code quality before merging

### Vercel (Recommended)

1. Push your code to GitHub
2. Import your repository in [Vercel](https://vercel.com)
3. Configure environment variables (copy from `.env.example`)
4. Deploy

**Important:** Ensure you set all required environment variables in Vercel:
- Database connection (`DATABASE_URL`)
- Authentication secrets (`BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`)
- API keys (OpenAI, Resend, Arcjet, etc.)
- Optional: Sentry DSN for error monitoring

### Other Platforms

This is a standard Next.js application and can be deployed to:
- **Vercel** - Recommended for Next.js apps
- **Netlify** - Supports Next.js with Edge Functions
- **AWS** - Amplify, ECS, EC2, or Lambda
- **Google Cloud Platform** - Cloud Run or App Engine
- **Azure** - App Service or Container Instances
- **Railway** - Easy deployment with database
- **Render** - Simple deployment platform
- **DigitalOcean** - App Platform or Droplets
- **Fly.io** - Edge deployment
- Any Node.js hosting platform supporting:
  - Node.js 18+
  - PostgreSQL database connection
  - Environment variables
  - WebSocket connections (for real-time features)

## Testing

### Unit Tests

This project includes 40+ unit tests covering:
- Component rendering and interactions
- API route handlers
- Database operations
- Authentication flows
- Utility functions and helpers

Run unit tests:
```bash
bun test              # Watch mode
bun test:run          # Single run
bun test:coverage     # With coverage report
```

### End-to-End Tests

5 E2E tests using Playwright cover critical user flows:
- User authentication (login/signup)
- AI chat interface
- Workspace management
- Subscription flows
- Admin dashboard

Run E2E tests:
```bash
bun test:e2e:setup    # First-time setup
bun test:e2e          # Run tests
bun test:e2e:ui       # Run with UI
bun test:e2e:debug    # Debug mode
```

For detailed E2E testing documentation, see the [E2E Testing Guide](docs/testing/E2E_QUICKSTART.md).

## Documentation

For comprehensive documentation, see the [docs](docs/) directory:

- **[Contributing Guide](CONTRIBUTING.md)** - How to contribute to this project
- **[Code of Conduct](CODE_OF_CONDUCT.md)** - Community guidelines
- **[Security Policy](SECURITY.md)** - Responsible disclosure guidelines
- **[Changelog](CHANGELOG.md)** - Project history and version changes

## Workspace Features

### Team Workspaces
Create and manage team workspaces with member collaboration:
- **Create Workspaces**: Organize teams with unique workspace names
- **Invite Members**: Send email invitations to team members
- **Role Management**: Assign roles (owner, admin, member, viewer)
- **Workspace Billing**: Unified subscriptions for entire teams

### Email Invitations
Professional invitation system with secure token-based authentication:
- **Send Invitations**: Invite users by email to join workspaces
- **Email Templates**: Branded invitation emails with role descriptions
- **Accept/Decline**: Recipients can accept or decline invitations
- **Expiration**: Invitations automatically expire after 7 days

### Workspace Billing
Flexible billing model supporting both individual and team subscriptions:
- **User-Level Plans**: Individual subscriptions for personal use
- **Workspace Plans**: Team subscriptions shared across all members
- **Usage Aggregation**: Track combined usage across workspace members
- **Effective Plans**: Automatic selection of highest available plan
- **Quota Management**: Enforce limits at both user and workspace levels

## Tech Stack

- **Framework**: [Next.js 16.1](https://nextjs.org) (Canary)
- **UI Library**: [React 19.2](https://react.dev)
- **Language**: [TypeScript 5.9](https://www.typescriptlang.org)
- **Styling**: [Tailwind CSS 4.1](https://tailwindcss.com)
- **UI Components**: [shadcn/ui](https://ui.shadcn.com)
- **Database**: [PostgreSQL](https://www.postgresql.org) with [Neon](https://neon.tech)
- **ORM**: [Drizzle ORM 0.45](https://orm.drizzle.team)
- **Authentication**: [Better Auth 1.4](https://www.better-auth.com)
- **Payments**: [Polar](https://polar.sh)
- **AI SDK**: [Vercel AI SDK 5.0](https://sdk.vercel.ai)
- **Email**: [Resend](https://resend.com)
- **Security**: [Arcjet](https://arcjet.com) + [Helmet](https://helmetjs.github.io/)
- **Analytics**: [PostHog](https://posthog.com)
- **Error Tracking**: [Sentry](https://sentry.io)
- **Testing**: [Vitest 4.0](https://vitest.dev) + [Playwright 1.57](https://playwright.dev)
- **Code Quality**: [Biome 2.3](https://biomejs.dev)
- **Git Hooks**: [Lefthook 2.0](https://github.com/evilmartians/lefthook)

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

This project uses [Conventional Commits](https://www.conventionalcommits.org/):
- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation changes
- `refactor:` - Code refactoring
- `test:` - Test additions or changes
- `chore:` - Maintenance tasks

## Troubleshooting

### Database Connection Issues
- Verify your `DATABASE_URL` is correct
- Ensure your database is accessible from your network
- Check if your database provider's firewall allows connections

### Build Errors
- Clear Next.js cache: `rm -rf .next`
- Delete node_modules and reinstall: `rm -rf node_modules bun.lockb && bun install`
- Ensure you're using Node.js 18+ and Bun 1.x+

### Authentication Issues
- Verify `BETTER_AUTH_SECRET` is set
- Check `BETTER_AUTH_URL` matches your app URL
- For OAuth, verify redirect URLs in Google Console

## Support

- **Issues**: [GitHub Issues](https://github.com/karthiknitt/ai-saas-starter-kit/issues)
- **Discussions**: [GitHub Discussions](https://github.com/karthiknitt/ai-saas-starter-kit/discussions)
- **Documentation**: Check the [docs](docs/) directory in this repository

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

Built with amazing open-source technologies and inspired by the developer community. Special thanks to:
- [Vercel](https://vercel.com) for Next.js and AI SDK
- [shadcn/ui](https://ui.shadcn.com) for beautiful UI components
- [Better Auth](https://www.better-auth.com) for authentication
- [Polar](https://polar.sh) for payment infrastructure
- [Neon](https://neon.tech) for serverless PostgreSQL
- All open-source contributors

## Star History

If you find this project useful, please consider giving it a star ⭐

---

**Ready to build your AI SaaS?** Follow the setup instructions above and start shipping! 🚀

Made with ❤️ for the developer community
