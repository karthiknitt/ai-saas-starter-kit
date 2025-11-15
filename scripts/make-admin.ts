#!/usr/bin/env tsx
import { config } from 'dotenv';
import { eq } from 'drizzle-orm';
import { db } from '@/db/drizzle';
import { user } from '@/db/schema';

config({ path: '.env' });

async function main() {
  const email = process.env.EMAIL || process.argv[2];
  if (!email) {
    console.error(
      'Usage: EMAIL=user@example.com npm run make-admin OR: npx tsx scripts/make-admin.ts user@example.com',
    );
    process.exit(1);
  }

  console.log(`Promoting ${email} to admin...`);
  const res = await db
    .update(user)
    .set({ role: 'admin' })
    .where(eq(user.email, email));
  console.log('Update result:', res);
  console.log('✅ Done');
}

main().catch((err) => {
  console.error('❌ Failed:', err);
  process.exit(1);
});
