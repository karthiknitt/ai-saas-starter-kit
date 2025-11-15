/**
 * Authentication system configuration using Better Auth.
 *
 * This module configures the authentication system with support for:
 * - Email/password authentication with verification
 * - Google OAuth social login
 * - Password reset functionality
 * - Role-based access control (RBAC)
 * - Session management
 * - Email verification via Resend
 *
 * Environment Variables Required:
 * - RESEND_API_KEY: API key for Resend email service
 * - RESEND_SENDER_EMAIL: Verified sender email address
 * - GOOGLE_CLIENT_ID: Google OAuth client ID
 * - GOOGLE_CLIENT_SECRET: Google OAuth client secret
 *
 * Important Notes:
 * - Polar Better Auth plugin has type incompatibilities with better-auth 1.3.9+
 * - Using manual Polar SDK integration instead (see src/lib/polar-client.ts)
 * - Webhooks handled separately in src/app/api/webhooks/polar/route.ts
 *
 * @module auth
 * @example
 * ```typescript
 * import { auth } from './auth';
 *
 * // Get current session
 * const session = await auth.api.getSession({ headers });
 *
 * // Sign in user
 * await auth.api.signIn.email({
 *   body: { email: 'user@example.com', password: 'password123' }
 * });
 * ```
 */

import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { nextCookies } from 'better-auth/next-js';
import { Resend } from 'resend';
import ForgotPasswordEmail from '@/components/forms/reset-password';
import EmailVerification from '@/components/forms/verify-email';
import { db } from '@/db/drizzle';
import { schema } from '@/db/schema';

/** Resend client for sending transactional emails (verification, password reset) */
const resend = new Resend(process.env.RESEND_API_KEY as string);

/**
 * Better Auth instance with configured authentication providers and settings.
 *
 * Features:
 * - Email verification on signup (via Resend)
 * - Password reset flow (via Resend)
 * - Google OAuth integration
 * - Role-based user field (member/admin)
 * - Drizzle ORM adapter for PostgreSQL
 * - Next.js cookie handling
 */
export const auth = betterAuth({
  user: {
    additionalFields: {
      role: {
        type: 'string',
        input: false,
      },
    },
  },
  emailVerification: {
    sendVerificationEmail: async ({ user, url }) => {
      resend.emails.send({
        from: process.env.RESEND_SENDER_EMAIL as string,
        to: user.email,
        subject: 'Verify your email address',
        react: EmailVerification({
          username: user.name,
          verificationUrl: url,
        }),
      });
    },
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },
  emailAndPassword: {
    enabled: true,
    sendResetPassword: async ({ user, url }) => {
      resend.emails.send({
        from: process.env.RESEND_SENDER_EMAIL as string,
        to: user.email,
        subject: 'Reset your password',
        react: ForgotPasswordEmail({
          username: user.name,
          resetUrl: url,
          userEmail: user.email,
        }),
      });
    },
    requireEmailVerification: true,
  },
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema,
  }),
  plugins: [
    nextCookies(),
    // Polar plugin disabled due to type incompatibility - using manual SDK integration
    // Manual checkout flow implemented in: src/lib/polar-client.ts
    // Webhooks handled in: src/app/api/webhooks/polar/route.ts
  ],
});

/**
 * Typed user object returned from authentication.
 *
 * Extends the base Better Auth user with an additional `role` field
 * for role-based access control (RBAC).
 *
 * @property {string} id - Unique user identifier
 * @property {string} name - User's display name
 * @property {string} email - User's email address
 * @property {boolean} emailVerified - Whether email has been verified
 * @property {string | null} [image] - User's profile image URL (optional)
 * @property {Date} createdAt - Account creation timestamp
 * @property {Date} updatedAt - Last update timestamp
 * @property {string} role - User role (e.g., 'member', 'admin')
 */
export type TypedUser = {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image?: string | null;
  createdAt: Date;
  updatedAt: Date;
  role: string;
};

/**
 * Typed session object containing both user and session details.
 *
 * Used for type-safe session handling throughout the application.
 *
 * @property {TypedUser} user - Authenticated user information
 * @property {Object} session - Session metadata
 * @property {string} session.id - Unique session identifier
 * @property {Date} session.expiresAt - Session expiration timestamp
 * @property {string} session.token - Session token
 * @property {Date} session.createdAt - Session creation timestamp
 * @property {Date} session.updatedAt - Last session update timestamp
 * @property {string | null} [session.ipAddress] - Client IP address (optional)
 * @property {string | null} [session.userAgent] - Client user agent (optional)
 * @property {string} session.userId - Associated user ID
 *
 * @example
 * ```typescript
 * import { auth, TypedSession } from './auth';
 *
 * async function getAuthenticatedUser(headers: Headers): Promise<TypedSession | null> {
 *   const session = await auth.api.getSession({ headers });
 *   return session as TypedSession | null;
 * }
 * ```
 */
export type TypedSession = {
  user: TypedUser;
  session: {
    id: string;
    expiresAt: Date;
    token: string;
    createdAt: Date;
    updatedAt: Date;
    ipAddress?: string | null;
    userAgent?: string | null;
    userId: string;
  };
};
