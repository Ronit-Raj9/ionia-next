// Test script for email functionality
import { config } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { sendEmail } from '../utils/emailService.js';

// Get the directory name using ES module approach
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file
config({ path: path.resolve(__dirname, '../../.env') });

const testEmail = async () => {
  try {
    console.log('Testing email sending functionality...');
    console.log('Using TEST_EMAIL mode:', process.env.TEST_EMAIL === 'true' ? 'Yes' : 'No');
    
    const testEmailAddress = process.env.TEST_EMAIL_ADDRESS || process.env.EMAIL_USERNAME;
    if (!testEmailAddress) {
      throw new Error('No test email address found. Set TEST_EMAIL_ADDRESS in your .env file');
    }
    
    // Send a test email
    await sendEmail({
      email: testEmailAddress,
      subject: 'Test Email from Ionia',
      text: 'This is a test email to verify that the email sending functionality works correctly.',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <h1 style="color: #10b981; text-align: center;">Test Email</h1>
          <p>This is a test email to verify that the email sending functionality works correctly.</p>
          <p>If you received this email, your email configuration is working properly!</p>
          <p style="margin-top: 30px; font-size: 12px; color: #666; text-align: center;">
            &copy; ${new Date().getFullYear()} Ionia. All rights reserved.
          </p>
        </div>
      `
    });
    
    console.log('Test email sent successfully!');
    return 'Test completed successfully';
  } catch (error) {
    console.error('Error sending test email:', error);
    throw error;
  }
};

// Run the test
testEmail()
  .then((result) => {
    console.log(result);
    process.exit(0);
  })
  .catch((error) => {
    console.error('Test failed:', error);
    process.exit(1);
  }); 