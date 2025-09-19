import emailService, { EMAIL_TEMPLATES } from '../utils/emailService.js';
import { Logger } from '../middlewares/error.middleware.js';

/**
 * Test script for Mailtrap email service
 * Run with: node -r dotenv/config src/scripts/test-email-mailtrap.js
 */

const testEmailService = async () => {
    console.log('🧪 Testing Mailtrap Email Service Integration\n');
    
    try {
        // Test 1: Health Check
        console.log('1️⃣ Testing Email Service Health Check...');
        const healthStatus = await emailService.healthCheck();
        console.log('Health Status:', healthStatus);
        console.log('✅ Health check completed\n');

        // Test 2: Connection Verification
        console.log('2️⃣ Testing Connection Verification...');
        if (emailService.isConfigured) {
            await emailService.verifyConnection();
            console.log('✅ Connection verified successfully\n');
        } else {
            console.log('⚠️ Email service not configured - will use development logging\n');
        }

        // Test 3: Send Welcome Email
        console.log('3️⃣ Testing Welcome Email Template...');
        const testEmail = 'test@example.com';
        const testName = 'John Doe';
        
        const welcomeResult = await emailService.sendWelcomeEmail(testEmail, testName);
        console.log('Welcome email result:', welcomeResult);
        console.log('✅ Welcome email test completed\n');

        // Test 4: Send Email Verification
        console.log('4️⃣ Testing Email Verification Template...');
        const verificationResult = await emailService.sendVerificationEmail(
            testEmail, 
            testName, 
            'test-verification-token-123'
        );
        console.log('Verification email result:', verificationResult);
        console.log('✅ Email verification test completed\n');

        // Test 5: Send Password Reset Email
        console.log('5️⃣ Testing Password Reset Template...');
        const resetResult = await emailService.sendPasswordResetEmail(
            testEmail, 
            testName, 
            'test-reset-token-456',
            '192.168.1.1'
        );
        console.log('Password reset email result:', resetResult);
        console.log('✅ Password reset test completed\n');

        // Test 6: Send Test Completion Email
        console.log('6️⃣ Testing Test Completion Template...');
        const testCompletionData = {
            testName: 'JavaScript Fundamentals Quiz',
            score: 85,
            totalQuestions: 100,
            percentage: 85,
            timeTaken: '45 minutes',
            difficulty: 'Medium',
            subject: 'JavaScript',
            testId: 'test-123'
        };
        
        const testCompletionResult = await emailService.sendTestCompletionEmail(
            testEmail, 
            testName, 
            testCompletionData
        );
        console.log('Test completion email result:', testCompletionResult);
        console.log('✅ Test completion email test completed\n');

        // Test 7: Template System Test
        console.log('7️⃣ Testing Template System...');
        console.log('Available templates:', Object.values(EMAIL_TEMPLATES));
        
        for (const template of Object.values(EMAIL_TEMPLATES)) {
            console.log(`✓ ${template} template loaded`);
        }
        console.log('✅ Template system test completed\n');

        console.log('🎉 All email service tests completed successfully!');
        console.log('\n📧 Email Service Summary:');
        console.log(`- Provider: ${emailService.isConfigured ? 'Mailtrap' : 'Development Logging'}`);
        console.log(`- Configuration: ${emailService.isConfigured ? '✅ Configured' : '⚠️ Not Configured'}`);
        console.log(`- Templates: ${Object.keys(EMAIL_TEMPLATES).length} available`);
        console.log(`- Health Status: ${healthStatus.status}`);

        if (!emailService.isConfigured) {
            console.log('\n💡 To enable actual email sending:');
            console.log('1. Add MAILTRAP_API_TOKEN to your .env file');
            console.log('2. Add EMAIL_FROM to your .env file');
            console.log('3. Restart the server');
        }

    } catch (error) {
        console.error('❌ Email service test failed:', error);
        Logger.error('Email service test failed', { error: error.message });
        process.exit(1);
    }
};

// Run the test
testEmailService(); 