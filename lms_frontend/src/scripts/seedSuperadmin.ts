/**
 * Seed Superadmin Script
 * Run this script to create the initial superadmin user
 * 
 * Usage:
 * npx ts-node src/scripts/seedSuperadmin.ts
 * 
 * Or add to package.json:
 * "seed:superadmin": "ts-node src/scripts/seedSuperadmin.ts"
 */

import { connectToDatabase, COLLECTIONS, User } from '@/lib/db';
import { generateUserId, hashPassword, getDefaultPermissions } from '@/lib/authUtils';

async function seedSuperadmin() {
  console.log('🌱 Starting superadmin seed...\n');

  try {
    const { db } = await connectToDatabase();
    const usersCollection = db.collection<User>(COLLECTIONS.USERS);

    // Check if superadmin already exists
    const existingSuperadmin = await usersCollection.findOne({ role: 'superadmin' });
    
    if (existingSuperadmin) {
      console.log('⚠️  Superadmin already exists!');
      console.log('📧 Email:', existingSuperadmin.email);
      console.log('🆔 User ID:', existingSuperadmin.userId);
      console.log('\n✅ No action needed. Exiting...\n');
      process.exit(0);
    }

    // Generate credentials
    const userId = generateUserId('superadmin');
    const plainPassword = 'Admin@2025!'; // You can change this
    const hashedPassword = hashPassword(plainPassword);

    // Create superadmin user
    const superadmin: User = {
      role: 'superadmin',
      userId,
      password: hashedPassword,
      name: 'System Administrator',
      email: 'superadmin@ionia.edu', // Change to your email
      displayName: 'Super Admin',
      status: 'active',
      permissions: getDefaultPermissions('superadmin'),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Insert into database
    const result = await usersCollection.insertOne(superadmin);

    console.log('✅ Superadmin created successfully!\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 SUPERADMIN CREDENTIALS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🆔 User ID:    ', userId);
    console.log('🔑 Password:   ', plainPassword);
    console.log('📧 Email:      ', superadmin.email);
    console.log('👤 Name:       ', superadmin.name);
    console.log('🆔 MongoDB ID: ', result.insertedId.toString());
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n⚠️  IMPORTANT: Save these credentials securely!\n');
    console.log('💡 You can now login at /login with these credentials\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding superadmin:', error);
    process.exit(1);
  }
}

// Run the seed function
seedSuperadmin();

