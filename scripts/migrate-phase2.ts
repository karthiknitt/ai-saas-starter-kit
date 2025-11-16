/**
 * Phase 2 Database Migration Script
 *
 * Applies Phase 2 schema changes:
 * 1. Adds warning flags to usage_quota table
 * 2. Creates webhook_event table for webhook retry mechanism
 *
 * Usage:
 *   pnpm tsx scripts/migrate-phase2.ts
 */

import 'dotenv/config';
import { neon } from '@neondatabase/serverless';
import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/neon-http';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('❌ DATABASE_URL environment variable is not set');
  process.exit(1);
}

const client = neon(databaseUrl);
const db = drizzle(client);

async function migrate() {
  console.log('🚀 Starting Phase 2 database migration...\n');

  try {
    // Migration 1: Add warning flags to usage_quota
    console.log('📝 Adding warning flags to usage_quota table...');
    await db.execute(sql`
      ALTER TABLE usage_quota
      ADD COLUMN IF NOT EXISTS warning_80_sent BOOLEAN DEFAULT FALSE NOT NULL,
      ADD COLUMN IF NOT EXISTS warning_90_sent BOOLEAN DEFAULT FALSE NOT NULL,
      ADD COLUMN IF NOT EXISTS warning_100_sent BOOLEAN DEFAULT FALSE NOT NULL;
    `);
    console.log('✅ Warning flags added successfully\n');

    // Migration 2: Create webhook_event table
    console.log('📝 Creating webhook_event table...');
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS webhook_event (
        id TEXT PRIMARY KEY,
        source TEXT NOT NULL,
        event_type TEXT NOT NULL,
        payload TEXT NOT NULL,
        status TEXT NOT NULL,
        retry_count INTEGER DEFAULT 0 NOT NULL,
        last_error TEXT,
        processed_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `);
    console.log('✅ webhook_event table created successfully\n');

    // Migration 3: Create index on webhook_event
    console.log('📝 Creating index on webhook_event...');
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_webhook_status ON webhook_event(status, created_at);
    `);
    console.log('✅ Index created successfully\n');

    // Verify migrations
    console.log('🔍 Verifying migrations...');

    // Check usage_quota columns
    const quotaColumns = await db.execute(sql`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'usage_quota'
      AND column_name IN ('warning_80_sent', 'warning_90_sent', 'warning_100_sent')
      ORDER BY column_name;
    `);

    console.log('\nusage_quota columns:');
    for (const col of quotaColumns.rows) {
      console.log(`  ✓ ${col.column_name} (${col.data_type})`);
    }

    // Check webhook_event table
    const webhookTable = await db.execute(sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_name = 'webhook_event';
    `);

    if (webhookTable.rows.length > 0) {
      console.log('\n✓ webhook_event table exists');

      // Check webhook_event columns
      const webhookColumns = await db.execute(sql`
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_name = 'webhook_event'
        ORDER BY ordinal_position;
      `);

      console.log('\nwebhook_event columns:');
      for (const col of webhookColumns.rows) {
        console.log(`  ✓ ${col.column_name} (${col.data_type})`);
      }
    }

    console.log('\n✅ All migrations completed successfully!');
    console.log('\n📚 Next steps:');
    console.log('  1. Review PHASE_2_IMPLEMENTATION.md for usage instructions');
    console.log('  2. Update environment variables (see .env.example)');
    console.log('  3. Test email notifications locally with Mailhog');
    console.log('  4. Deploy to production\n');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrate();
