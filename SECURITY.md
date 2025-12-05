# Security Policy

## Supported Versions

We release patches for security vulnerabilities. Currently supported versions:

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |

## Reporting a Vulnerability

**Please do not report security vulnerabilities through public GitHub issues.**

If you discover a security vulnerability, please send an email with details to the repository maintainer via GitHub. You can find contact information on the GitHub profile.

Include the following information:
- Type of issue (e.g., SQL injection, cross-site scripting, authentication bypass)
- Full paths of source file(s) related to the manifestation of the issue
- The location of the affected source code (tag/branch/commit or direct URL)
- Any special configuration required to reproduce the issue
- Step-by-step instructions to reproduce the issue
- Proof-of-concept or exploit code (if possible)
- Impact of the issue, including how an attacker might exploit it

### What to Expect

- **Acknowledgment**: Within 48 hours of your report
- **Assessment**: We'll investigate and provide an estimated timeline for a fix
- **Fix**: We'll work on a patch and coordinate the release timing
- **Credit**: We'll acknowledge your responsible disclosure (if you wish)

## Security Best Practices

When using this starter kit, follow these security practices:

### Environment Variables
- **Never commit `.env` files** to version control
- **Rotate credentials regularly**, especially after team changes
- **Use different credentials** for development, staging, and production
- **Limit access** to environment variables based on the principle of least privilege

### Authentication
- **Keep Better Auth updated** to the latest version
- **Use strong password policies** for your users
- **Enable MFA** where possible
- **Review OAuth scopes** and only request necessary permissions

### API Security
- **Implement rate limiting** (Arcjet is configured)
- **Validate all inputs** with Zod schemas
- **Use HTTPS** in production
- **Implement proper CORS policies**
- **Sanitize user inputs** before database operations

### Database Security
- **Use parameterized queries** (Drizzle ORM handles this)
- **Follow the principle of least privilege** for database users
- **Regularly backup your database**
- **Encrypt sensitive data** at rest

### Dependencies
- **Regularly update dependencies** with `pnpm update`
- **Audit dependencies** with `pnpm audit`
- **Review security advisories** for critical dependencies

### Monitoring
- **Set up Sentry** for error tracking
- **Monitor audit logs** for suspicious activity
- **Set up alerts** for critical security events
- **Review logs regularly**

## Known Security Considerations

### API Keys Encryption
- API keys are encrypted using AES-256-GCM before storage
- Encryption keys must be securely managed and rotated regularly
- See `src/lib/crypto.ts` for implementation details

### Payment Processing
- Payment data is handled by Polar (PCI DSS compliant)
- Never store credit card information directly
- Validate webhook signatures for all payment webhooks

### Session Management
- Sessions are managed by Better Auth
- Configure appropriate session timeouts
- Implement secure session storage

## Security Updates

We'll announce security updates through:
- GitHub Security Advisories
- Release notes
- CHANGELOG.md

Subscribe to repository notifications to stay informed.

## Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Better Auth Security](https://docs.better-auth.com/security)
- [Next.js Security](https://nextjs.org/docs/security)
- [PostgreSQL Security](https://www.postgresql.org/docs/current/security.html)

## Contact

For non-security-related issues, please use GitHub Issues.
