#!/usr/bin/env node

/**
 * Database Seeding Script
 *
 * This script creates the database schema defined in src/db/schema.ts
 * in a target database. It uses drizzle-kit push to apply the schema.
 *
 * Usage:
 *   npm run db:seed                    # Seeds the database specified in DATABASE_URL
 *   SEED_DATABASE_URL=<url> npm run db:seed  # Seeds a different database
 *
 * The script will:
 * 1. Use SEED_DATABASE_URL if set, otherwise DATABASE_URL
 * 2. Run drizzle-kit push to create all tables and constraints
 * 3. Report success or failure
 */

import { config } from 'dotenv';

// Load environment variables
config({ path: '.env' });

// Get the target database URL
const targetDbUrl = process.env.SEED_DATABASE_URL || process.env.DATABASE_URL;

if (!targetDbUrl) {
  console.error('Error: Neither SEED_DATABASE_URL nor DATABASE_URL is set');
  process.exit(1);
}

console.log(`Seeding database schema to: ${targetDbUrl.replace(/:\/\/.*@/, '://***:***@')}`);

async function seedDatabase() {
  try {
    // Push schema to database using drizzle-kit
    console.log('Creating tables...');

    // Use drizzle-kit push with environment variable override
    const { execSync } = await import('child_process');

    try {
      // Set the DATABASE_URL environment variable for drizzle-kit
      const env = { ...process.env, DATABASE_URL: targetDbUrl };

      // Run drizzle-kit push
      execSync('npx drizzle-kit push', {
        stdio: 'inherit',
        env,
        cwd: process.cwd()
      });

      console.log('✅ Database schema seeded successfully!');
    } catch (error) {
      console.error(`❌ Failed to seed database schema:`, error);
      throw error;
    }

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
}

// Run the seed function
seedDatabase()
  .then(() => {
    console.log('🎉 Database seeding completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Database seeding failed:', error);
    process.exit(1);
  });