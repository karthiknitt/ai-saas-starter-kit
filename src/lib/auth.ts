import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { nextCookies } from 'better-auth/next-js';
import { Resend } from 'resend';
import ForgotPasswordEmail from '@/components/forms/reset-password';
import EmailVerification from '@/components/forms/verify-email';
import { db } from '@/db/drizzle';
import { schema } from '@/db/schema';

const resend = new Resend(process.env.RESEND_API_KEY as string);

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

    /*polar({
      client: polarClient,
      createCustomerOnSignUp: true,
      enableCustomerPortal: true, //api/auth/portal
      successUrl: process.env.POLAR_SUCCESS_URL!,
      checkout: {
        enabled: true,
        products: [
          {
            slug: 'Free',
            productId: process.env.POLAR_PRODUCT_FREE as string,
          },
          {
            slug: 'Pro',
            productId: process.env.POLAR_PRODUCT_PRO as string,
          },
          {
            slug: 'Startup',
            productId: process.env.POLAR_PRODUCT_STARTUP as string,
          },
        ],
      },
      use: [
        webhooks({
          secret: process.env.POLAR_WEBHOOK_SECRET!,
        }),
      ],
    }),*/
  ],
});

// Polar client configuration
/* export const polarClientConfig = {
  accessToken: process.env.POLAR_ACCESS_TOKEN!,
};
  */

// Export properly typed session and user interfaces
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
