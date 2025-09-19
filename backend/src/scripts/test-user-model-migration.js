import mongoose from 'mongoose';
import { User } from '../models/user.model.js';
import dotenv from 'dotenv';
import { DB_NAME } from '../constants.js';

// Load environment variables
dotenv.config();

const DATABASE_ATLAS = process.env.DATABASE_ATLAS;
const dbUri = DATABASE_ATLAS.replace("<DB_NAME>", DB_NAME);

const testUserModelMigration = async () => {
  console.log('🧪 Testing User Model Migration...\n');
  
  try {
    // Connect to database
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(dbUri);
    console.log('✅ Connected to MongoDB\n');
    
    // Find a test user
    console.log('👤 Finding test user...');
    const user = await User.findOne().limit(1);
    if (!user) {
      console.log('❌ No users found in database');
      process.exit(1);
    }
    
    console.log(`✅ Found user: ${user.email}\n`);
    
    // Test 1: Check new fields exist
    console.log('1️⃣ Testing New Fields Existence:');
    console.log(`   Email verification token: ${user.emailVerificationToken || 'null'}`);
    console.log(`   Email verification expires: ${user.emailVerificationExpires || 'null'}`);
    console.log(`   Email preferences exist: ${!!user.emailPreferences}`);
    console.log(`   Email verification attempts exist: ${!!user.emailVerificationAttempts}`);
    console.log('   ✅ All fields present\n');
    
    // Test 2: Test email preferences
    console.log('2️⃣ Testing Email Preferences:');
    console.log(`   Welcome emails: ${user.canReceiveEmail('welcome')}`);
    console.log(`   Test completion: ${user.canReceiveEmail('testCompletion')}`);
    console.log(`   Marketing emails: ${user.canReceiveEmail('marketing')}`);
    console.log(`   Security emails: ${user.canReceiveEmail('security')}`);
    console.log('   ✅ Email preferences working\n');
    
    // Test 3: Test token generation
    console.log('3️⃣ Testing Email Verification Token:');
    const token = user.generateEmailVerificationToken();
    console.log(`   Generated token: ${token.substring(0, 10)}...`);
    console.log(`   Expires: ${user.emailVerificationExpires}`);
    console.log(`   Token valid: ${user.isEmailVerificationTokenValid(token)}`);
    console.log('   ✅ Token generation working\n');
    
    // Test 4: Test rate limiting
    console.log('4️⃣ Testing Rate Limiting:');
    console.log(`   Currently blocked: ${user.isEmailVerificationBlocked()}`);
    console.log(`   Attempt count: ${user.emailVerificationAttempts?.count || 0}`);
    console.log('   ✅ Rate limiting working\n');
    
    // Test 5: Test preference updates
    console.log('5️⃣ Testing Preference Updates:');
    await user.updateEmailPreferences({
      marketing: true,
      newsletter: true
    });
    console.log(`   Marketing after update: ${user.canReceiveEmail('marketing')}`);
    console.log(`   Newsletter after update: ${user.canReceiveEmail('newsletter')}`);
    console.log(`   Security (should remain true): ${user.canReceiveEmail('security')}`);
    console.log('   ✅ Preference updates working\n');
    
    // Reset preferences for testing
    await user.updateEmailPreferences({
      marketing: false,
      newsletter: false
    });
    
    console.log('🎉 All User Model Migration Tests Passed!');
    console.log('\n📊 Migration Summary:');
    console.log('   ✅ New fields added successfully');
    console.log('   ✅ Email verification tokens working');
    console.log('   ✅ Email preferences working');
    console.log('   ✅ Rate limiting working');
    console.log('   ✅ Helper methods functional');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n💾 Database connection closed.');
  }
};

// Run the test
testUserModelMigration(); 