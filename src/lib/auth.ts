import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from '@/db/drizzle'; // your drizzle instance
import { nextCookies } from 'better-auth/next-js';
import { schema } from '@/db/schema'; // your drizzle schema
import { Resend } from 'resend';
const resend = new Resend(process.env.RESEND_API_KEY as string);
import ForgotPasswordEmail from '@/components/forms/reset-password';

// Initialize better-auth
export const auth = betterAuth({
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
  },
  database: drizzleAdapter(db, {
    provider: 'pg', // or "mysql", "sqlite"
    schema,
  }),
  plugins: [nextCookies()],
});
