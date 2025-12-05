# Contributing to AI SaaS Starter Kit

First off, thank you for considering contributing to the AI SaaS Starter Kit! It's people like you that make this project a great tool for the community.

## Code of Conduct

This project and everyone participating in it is governed by our [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check existing issues to avoid duplicates. When you create a bug report, include as many details as possible:

- **Use a clear and descriptive title**
- **Describe the exact steps to reproduce the problem**
- **Provide specific examples to demonstrate the steps**
- **Describe the behavior you observed and what you expected**
- **Include screenshots if relevant**
- **Include your environment details** (OS, Node version, pnpm version)

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion:

- **Use a clear and descriptive title**
- **Provide a detailed description of the suggested enhancement**
- **Explain why this enhancement would be useful**
- **List any alternative solutions you've considered**

### Pull Requests

1. Fork the repo and create your branch from `main`
2. If you've added code that should be tested, add tests
3. Ensure the test suite passes (`pnpm test:run`)
4. Make sure your code lints (`pnpm lint`)
5. Ensure type checking passes (`pnpm type-check`)
6. Issue that pull request!

## Development Process

### Setup

```bash
# Clone your fork
git clone https://github.com/your-username/ai-saas-starter-kit.git
cd ai-saas-starter-kit

# Install dependencies
pnpm install

# Copy environment variables
cp .env.example .env
# Fill in your environment variables

# Set up the database
pnpm db:push

# Start development server
pnpm dev
```

### Code Style

This project uses:
- **Biome** for linting and formatting
- **TypeScript** with strict mode
- **Conventional Commits** for commit messages

Please follow the coding standards defined in [docs/development/CODING_STANDARDS.md](docs/development/CODING_STANDARDS.md).

### Commit Messages

We use [Conventional Commits](https://www.conventionalcommits.org/) for clear and structured commit messages:

```
feat: add new feature
fix: resolve bug in authentication
docs: update README
style: format code
refactor: restructure database queries
test: add unit tests for payments
chore: update dependencies
```

### Testing

Before submitting a pull request, ensure all tests pass:

```bash
# Run unit tests
pnpm test:run

# Run E2E tests
pnpm test:e2e

# Run type checking
pnpm type-check

# Run linter
pnpm lint
```

See [docs/development/TESTING_GUIDE.md](docs/development/TESTING_GUIDE.md) for more details.

### Building

Ensure your changes build successfully:

```bash
pnpm build
```

## Project Structure

```
├── src/
│   ├── app/           # Next.js App Router pages
│   ├── components/    # React components
│   ├── db/            # Database schema and client
│   ├── lib/           # Utilities and core logic
│   ├── hooks/         # Custom React hooks
│   └── providers/     # Context providers
├── e2e/               # End-to-end tests
├── unit-tests/        # Unit tests
├── public/            # Static assets
└── docs/              # Documentation
```

## Additional Resources

- [README.md](README.md) - Getting started guide
- [docs/development/CODING_STANDARDS.md](docs/development/CODING_STANDARDS.md) - Coding guidelines
- [docs/development/TESTING_GUIDE.md](docs/development/TESTING_GUIDE.md) - Testing practices
- [docs/IMPROVEMENT_ROADMAP.md](docs/IMPROVEMENT_ROADMAP.md) - Future plans

## Questions?

Feel free to open an issue with the `question` label or start a discussion on GitHub Discussions.

## License

By contributing, you agree that your contributions will be licensed under the project's MIT License.
