import { betterAuth } from 'better-auth';
import { polar, checkout, usage, portal } from '@polar-sh/better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from '@/db/drizzle';
import { nextCookies } from 'better-auth/next-js';
import { schema } from '@/db/schema';
import { Resend } from 'resend';
import { Polar } from '@polar-sh/sdk';

import ForgotPasswordEmail from '@/components/forms/reset-password';
import EmailVerification from '@/components/forms/verify-email';

const resend = new Resend(process.env.RESEND_API_KEY as string);

// Polar client
const polarClient = new Polar({
  accessToken: process.env.POLAR_ACCESS_TOKEN!,
  // Use 'sandbox' if you're using the Polar Sandbox environment
  server: 'sandbox',
});

// Polar configuration
export const polarConfig = {
  accessToken: process.env.POLAR_ACCESS_TOKEN!,
  successUrl: process.env.POLAR_SUCCESS_URL!,
};

export const auth = betterAuth({
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
    polar({
      client: polarClient,
      createCustomerOnSignUp: true,
      use: [
        checkout({
          products: [
            {
              slug: 'free',
              productId: process.env.POLAR_PRODUCT_FREE as string,
            },
            {
              slug: 'pro',
              productId: process.env.POLAR_PRODUCT_PRO as string,
            },
            {
              slug: 'startup',
              productId: process.env.POLAR_PRODUCT_STARTUP as string,
            },
          ],
          successUrl: '/billing/success?checkout_id={CHECKOUT_ID}',
          authenticatedUsersOnly: true,
        }),
        portal(),
        usage(),
      ],
    }),

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
