/**
 * Seed Permissions Script
 *
 * Initializes permissions and role-permission mappings in the database.
 * Run this script after database migrations to set up the permission system.
 *
 * Usage: pnpm tsx scripts/seed-permissions.ts
 */

import { initializePermissions, seedRolePermissions } from '@/lib/permissions';

async function main() {
  console.log('🔐 Seeding permissions...\n');

  try {
    // Initialize all permissions
    console.log('1. Initializing permissions...');
    await initializePermissions();
    console.log('✅ Permissions initialized\n');

    // Seed role-permission mappings
    console.log('2. Seeding role-permission mappings...');
    await seedRolePermissions();
    console.log('✅ Role permissions seeded\n');

    console.log('🎉 Permission seeding complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding permissions:', error);
    process.exit(1);
  }
}

main();
