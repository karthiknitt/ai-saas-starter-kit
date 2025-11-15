# AI SaaS Starter Kit

A production-ready, full-stack AI SaaS application starter kit built with Next.js 16, React 19, and TypeScript. Ship your AI-powered SaaS product faster with authentication, payments, AI chat, role-based access control, and comprehensive security built-in.

## Features

### Core Features
- **Modern Tech Stack**: Next.js 16 with App Router, React 19, TypeScript 5.9, Tailwind CSS 4
- **AI Chat Interface**: Streaming AI responses with OpenAI integration and custom API key management
- **Authentication**: Email/password + Google OAuth via Better Auth
- **Payment Integration**: Subscription management with Polar (Free, Pro, Startup plans)
- **Database**: PostgreSQL with Drizzle ORM
- **UI Components**: 50+ customizable shadcn/ui components

### Advanced Features
- **Role-Based Access Control (RBAC)**: Admin dashboard with user management
- **Usage Tracking**: Quota enforcement and feature gating by subscription tier
- **Audit Logging**: Comprehensive activity tracking for compliance
- **Encrypted API Key Management**: Secure storage for user API keys
- **Rate Limiting**: Protection against abuse with Arcjet
- **Security Headers**: Helmet integration for enhanced security
- **Email Integration**: Resend for transactional emails
- **Analytics**: Vercel Analytics and Speed Insights

### Developer Experience
- **Type Safety**: Strict TypeScript configuration
- **Testing**: 163+ unit tests with Vitest
- **Code Quality**: Biome for linting and formatting
- **Git Hooks**: Lefthook for pre-commit checks and conventional commits
- **Hot Reload**: Turbopack for blazing-fast development

## Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** 18.x or higher
- **pnpm** 8.x or higher (recommended) or npm/yarn
- **PostgreSQL** database (we recommend [Neon](https://neon.tech))
- **Git**

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/karthiknitt/ai-saas-starter-kit.git
cd ai-saas-starter-kit
```

### 2. Install Dependencies

```bash
pnpm install
# or
npm install
# or
yarn install
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

### 4. Database Setup

Run database migrations:

```bash
pnpm db:push
```

(Optional) Seed the database with sample data:

```bash
pnpm db:seed
```

### 5. Start Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see your application.

### 6. Create an Admin User

After signing up, make your account an admin:

```bash
pnpm make-admin
```

Follow the prompts to enter your email address.

## Available Scripts

### Development
- `pnpm dev` - Start development server with Turbopack
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Lint and fix code with Biome
- `pnpm format` - Format code with Biome
- `pnpm type-check` - Run TypeScript type checking

### Testing
- `pnpm test` - Run tests in watch mode
- `pnpm test:run` - Run tests once
- `pnpm test:coverage` - Generate test coverage report

### Database
- `pnpm db:studio` - Open Drizzle Studio (database GUI)
- `pnpm db:push` - Push schema changes to database
- `pnpm db:migrate` - Run migrations
- `pnpm db:seed` - Seed database with sample data

### Utilities
- `pnpm make-admin` - Make a user an admin
- `pnpm analyze` - Analyze bundle size

## Project Structure

```
├── src/
│   ├── app/              # Next.js app router pages
│   ├── components/       # React components
│   │   ├── ui/          # shadcn/ui components
│   │   └── ...          # Feature components
│   ├── db/              # Database schema and utilities
│   ├── hooks/           # Custom React hooks
│   └── lib/             # Utilities and configurations
├── scripts/             # Utility scripts
├── public/              # Static assets
├── migrations/          # Database migrations
└── unit-tests/          # Test files
```

## Key Features Guide

### AI Chat
- Navigate to the chat interface after logging in
- Configure your OpenAI API key in settings (encrypted storage)
- Start chatting with AI with streaming responses
- Usage tracked and limited by subscription tier

### Subscription Plans
- **Free**: 100 messages/month, basic features
- **Pro**: 1000 messages/month, advanced features
- **Startup**: Unlimited messages, all features

### Admin Dashboard
- Access at `/admin` (admin role required)
- User management with role assignment
- View audit logs and system activity
- Monitor usage and subscriptions

### API Key Management
- Users can add their own OpenAI API keys
- Keys are encrypted at rest using AES-256-GCM
- Automatic key rotation support

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import your repository in [Vercel](https://vercel.com)
3. Configure environment variables
4. Deploy

### Other Platforms

This is a standard Next.js application and can be deployed to:
- AWS (Amplify, ECS, EC2)
- Google Cloud Platform
- Azure
- Railway
- Render
- Any Node.js hosting platform

Ensure your hosting platform supports:
- Node.js 18+
- PostgreSQL database connection
- Environment variables

## Documentation

- [Improvement Roadmap](./IMPROVEMENT_ROADMAP.md) - Feature roadmap and development plans
- [RBAC & Payment Status](./RBAC_PAYMENT_STATUS.md) - Details on access control and payments
- [Testing Guide](./TESTING_GUIDE.md) - How to write and run tests
- [Phase 1 Complete](./PHASE_1_COMPLETE.md) - MVP completion summary

## Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org)
- **UI Library**: [React 19](https://react.dev)
- **Language**: [TypeScript](https://www.typescriptlang.org)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com)
- **UI Components**: [shadcn/ui](https://ui.shadcn.com)
- **Database ORM**: [Drizzle](https://orm.drizzle.team)
- **Authentication**: [Better Auth](https://www.better-auth.com)
- **Payments**: [Polar](https://polar.sh)
- **AI SDK**: [Vercel AI SDK](https://sdk.vercel.ai)
- **Email**: [Resend](https://resend.com)
- **Security**: [Arcjet](https://arcjet.com)
- **Testing**: [Vitest](https://vitest.dev)
- **Code Quality**: [Biome](https://biomejs.dev)

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes using conventional commits (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Commit Convention

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
- Delete node_modules and reinstall: `rm -rf node_modules pnpm-lock.yaml && pnpm install`
- Ensure you're using Node.js 18+

### Authentication Issues
- Verify `BETTER_AUTH_SECRET` is set
- Check `BETTER_AUTH_URL` matches your app URL
- For OAuth, verify redirect URLs in Google Console

## Support

- Create an issue: [GitHub Issues](https://github.com/karthiknitt/ai-saas-starter-kit/issues)
- Documentation: Check the docs in this repository
- Community: Join discussions in GitHub

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

Built with amazing open-source technologies and inspired by the developer community.

---

**Ready to build your AI SaaS?** Follow the setup instructions above and start shipping! 🚀
