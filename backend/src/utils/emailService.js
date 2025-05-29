import { MailtrapClient } from 'mailtrap';
import { ApiError } from "./ApiError.js";
import { Logger } from '../middlewares/error.middleware.js';

// Email service configuration validation
const validateEmailConfig = () => {
    const required = ['MAILTRAP_API_TOKEN', 'EMAIL_FROM'];
    const missing = required.filter(key => !process.env[key]);
    
    if (missing.length > 0) {
        Logger.warn(`Email service not configured - missing environment variables`, {
            missingVars: missing
        });
        return false;
    }
    return true;
};

// Initialize email service
const isEmailConfigured = validateEmailConfig();
let mailtrapClient = null;

if (isEmailConfigured) {
    try {
        mailtrapClient = new MailtrapClient({ 
            token: process.env.MAILTRAP_API_TOKEN 
        });
        Logger.info('✅ Mailtrap email service initialized successfully');
    } catch (error) {
        Logger.error('Failed to initialize Mailtrap client', { error: error.message });
    }
} else {
    Logger.warn('⚠️ Email service not configured - emails will be logged only');
}

// Sender configuration
const sender = {
    email: process.env.EMAIL_FROM || 'noreply@ionia.sbs',
    name: process.env.EMAIL_FROM_NAME || 'Ionia'
};

// Email templates
const EMAIL_TEMPLATES = {
    WELCOME: 'welcome',
    EMAIL_VERIFICATION: 'email_verification', 
    PASSWORD_RESET: 'password_reset',
    TEST_COMPLETION: 'test_completion',
    ACCOUNT_LOCKED: 'account_locked'
};

/**
 * Beautiful email templates with modern design
 */
const getEmailTemplate = (type, data) => {
    const baseStyle = `
        <style>
            body { margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f6f9fc; }
            .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center; }
            .header h1 { color: white; margin: 0; font-size: 28px; font-weight: 600; }
            .content { padding: 40px 30px; }
            .button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
            .button:hover { transform: translateY(-2px); transition: all 0.3s ease; }
            .footer { background-color: #f8f9fa; padding: 30px; text-align: center; color: #6c757d; font-size: 14px; }
            .highlight { background-color: #e3f2fd; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2196f3; }
        </style>
    `;

    const templates = {
        [EMAIL_TEMPLATES.WELCOME]: `
            ${baseStyle}
            <div class="container">
                <div class="header">
                    <h1>Welcome to Ionia! 🎉</h1>
                </div>
                <div class="content">
                    <h2>Hello ${data.name || 'there'}!</h2>
                    <p>Welcome to <strong>Ionia</strong> - your comprehensive learning platform! We're excited to have you join our community of learners.</p>
                    
                    <div class="highlight">
                        <h3>🚀 What's Next?</h3>
                        <ul>
                            <li>Complete your profile setup</li>
                            <li>Browse our extensive question bank</li>
                            <li>Take practice tests to track your progress</li>
                            <li>Join discussions with fellow learners</li>
                        </ul>
                    </div>
                    
                    <p style="text-align: center;">
                        <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard" class="button">
                            Start Learning 📚
                        </a>
                    </p>
                    
                    <p>If you have any questions, feel free to reach out to our support team. We're here to help!</p>
                </div>
                <div class="footer">
                    <p>&copy; 2024 Ionia. All rights reserved.</p>
                    <p>Happy Learning! 🌟</p>
                </div>
            </div>
        `,
        
        [EMAIL_TEMPLATES.EMAIL_VERIFICATION]: `
            ${baseStyle}
            <div class="container">
                <div class="header">
                    <h1>Verify Your Email 📧</h1>
                </div>
                <div class="content">
                    <h2>Hello ${data.name || 'there'}!</h2>
                    <p>Thank you for joining <strong>Ionia</strong>! To complete your registration and secure your account, please verify your email address.</p>
                    
                    <div class="highlight">
                        <h3>🔐 Why verify your email?</h3>
                        <ul>
                            <li>Secure your account</li>
                            <li>Receive important updates</li>
                            <li>Reset your password if needed</li>
                            <li>Get notifications about your progress</li>
                        </ul>
                    </div>
                    
                    <p style="text-align: center;">
                        <a href="${data.verificationUrl}" class="button">
                            Verify Email Address ✅
                        </a>
                    </p>
                    
                    <p><strong>⏰ Important:</strong> This verification link will expire in 24 hours for security reasons.</p>
                    
                    <p>If the button doesn't work, copy and paste this URL into your browser:</p>
                    <p style="word-break: break-all; background-color: #f8f9fa; padding: 10px; border-radius: 4px; font-family: monospace;">
                        ${data.verificationUrl}
                    </p>
                    
                    <p><em>If you didn't create an account with us, please ignore this email.</em></p>
                </div>
                <div class="footer">
                    <p>&copy; 2024 Ionia. All rights reserved.</p>
                    <p>Secure. Reliable. Trusted. 🔒</p>
                </div>
            </div>
        `,
        
        [EMAIL_TEMPLATES.PASSWORD_RESET]: `
            ${baseStyle}
            <div class="container">
                <div class="header">
                    <h1>Reset Your Password 🔑</h1>
                </div>
                <div class="content">
                    <h2>Hello ${data.name || 'there'}!</h2>
                    <p>We received a request to reset your password for your <strong>Ionia</strong> account. Don't worry, we've got you covered!</p>
                    
                    <div class="highlight">
                        <h3>🛡️ Security Notice</h3>
                        <p>This password reset was requested from IP: <code>${data.ip || 'Unknown'}</code></p>
                        <p>If this wasn't you, please contact our support team immediately.</p>
                    </div>
                    
                    <p style="text-align: center;">
                        <a href="${data.resetUrl}" class="button">
                            Reset Password 🔐
                        </a>
                    </p>
                    
                    <p><strong>⏰ Time Sensitive:</strong> This reset link will expire in 30 minutes for your security.</p>
                    
                    <p>If the button doesn't work, copy and paste this URL into your browser:</p>
                    <p style="word-break: break-all; background-color: #f8f9fa; padding: 10px; border-radius: 4px; font-family: monospace;">
                        ${data.resetUrl}
                    </p>
                    
                    <p><em>If you didn't request a password reset, please ignore this email and your password will remain unchanged.</em></p>
                </div>
                <div class="footer">
                    <p>&copy; 2024 Ionia. All rights reserved.</p>
                    <p>Keep your account secure! 🛡️</p>
                </div>
            </div>
        `,
        
        [EMAIL_TEMPLATES.TEST_COMPLETION]: `
            ${baseStyle}
            <div class="container">
                <div class="header">
                    <h1>Test Completed! 🎯</h1>
                </div>
                <div class="content">
                    <h2>Great job, ${data.name || 'there'}!</h2>
                    <p>You've successfully completed the test: <strong>${data.testName}</strong></p>
                    
                    <div class="highlight">
                        <h3>📊 Your Results</h3>
                        <ul>
                            <li><strong>Score:</strong> ${data.score}/${data.totalQuestions} (${data.percentage}%)</li>
                            <li><strong>Time Taken:</strong> ${data.timeTaken}</li>
                            <li><strong>Difficulty:</strong> ${data.difficulty}</li>
                            <li><strong>Subject:</strong> ${data.subject}</li>
                        </ul>
                    </div>
                    
                    <p style="text-align: center;">
                        <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/results/${data.testId}" class="button">
                            View Detailed Results 📈
                        </a>
                    </p>
                    
                    <p>Keep up the excellent work! Your consistent effort is key to mastering the subject.</p>
                </div>
                <div class="footer">
                    <p>&copy; 2024 Ionia. All rights reserved.</p>
                    <p>Keep learning, keep growing! 📚✨</p>
                </div>
            </div>
        `
    };

    return templates[type] || templates[EMAIL_TEMPLATES.WELCOME];
};

/**
 * Enhanced EmailService class with Mailtrap integration
 */
class EmailService {
    constructor() {
        this.client = mailtrapClient;
        this.isConfigured = isEmailConfigured;
        this.sender = sender;
    }

    /**
     * Verify email service connection
     */
    async verifyConnection() {
        if (!this.isConfigured) {
            throw new Error('Email service not configured');
        }

        try {
            // For Mailtrap, we'll just verify the client is initialized
            if (!this.client) {
                throw new Error('Mailtrap client not initialized');
            }
            
            Logger.info('Email service connection verified');
            return true;
        } catch (error) {
            Logger.error('Email service connection failed', { error: error.message });
            throw new ApiError(500, 'Email service connection failed');
        }
    }

    /**
     * Send email with template
     */
    async sendTemplatedEmail(type, recipientEmail, recipientName, templateData, options = {}) {
        try {
            if (!this.isConfigured) {
                // Log email in development mode
                Logger.warn('Email not configured - logging email instead', {
                    type,
                    to: recipientEmail,
                    name: recipientName,
                    data: templateData
                });
                return { success: true, mode: 'development-log' };
            }

            const htmlContent = getEmailTemplate(type, { 
                name: recipientName, 
                ...templateData 
            });

            const emailOptions = {
                from: this.sender,
                to: [{ email: recipientEmail, name: recipientName || '' }],
                subject: options.subject || this.getDefaultSubject(type),
                html: htmlContent,
                category: type,
                ...options
            };

            const response = await this.client.send(emailOptions);
            
            Logger.info('Email sent successfully via Mailtrap', {
                type,
                to: recipientEmail,
                messageId: response.message_id
            });

            return { 
                success: true, 
                messageId: response.message_id,
                mode: 'mailtrap'
            };

        } catch (error) {
            Logger.error('Failed to send email', {
                type,
                to: recipientEmail,
                error: error.message
            });
            throw new ApiError(500, `Failed to send ${type} email: ${error.message}`);
        }
    }

    /**
     * Get default subject based on email type
     */
    getDefaultSubject(type) {
        const subjects = {
            [EMAIL_TEMPLATES.WELCOME]: '🎉 Welcome to Ionia - Let\'s Start Learning!',
            [EMAIL_TEMPLATES.EMAIL_VERIFICATION]: '📧 Please verify your email address',
            [EMAIL_TEMPLATES.PASSWORD_RESET]: '🔑 Reset your Ionia password',
            [EMAIL_TEMPLATES.TEST_COMPLETION]: '🎯 Test completed - View your results!',
            [EMAIL_TEMPLATES.ACCOUNT_LOCKED]: '🔒 Account security alert'
        };
        return subjects[type] || 'Notification from Ionia';
    }

    /**
     * Send welcome email
     */
    async sendWelcomeEmail(email, name) {
        return this.sendTemplatedEmail(EMAIL_TEMPLATES.WELCOME, email, name, {});
    }

    /**
     * Send email verification
     */
    async sendVerificationEmail(email, name, token) {
        const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${token}`;
        return this.sendTemplatedEmail(EMAIL_TEMPLATES.EMAIL_VERIFICATION, email, name, {
            verificationUrl
        });
    }

    /**
     * Send password reset email
     */
    async sendPasswordResetEmail(email, name, token, ip = 'Unknown') {
        const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${token}`;
        return this.sendTemplatedEmail(EMAIL_TEMPLATES.PASSWORD_RESET, email, name, {
            resetUrl,
            ip
        });
    }

    /**
     * Send test completion notification
     */
    async sendTestCompletionEmail(email, name, testData) {
        return this.sendTemplatedEmail(EMAIL_TEMPLATES.TEST_COMPLETION, email, name, testData);
    }

    /**
     * Health check for monitoring
     */
    async healthCheck() {
        try {
            if (!this.isConfigured) {
                return {
                    status: 'unhealthy',
                    error: 'Email service not configured',
                    lastCheck: new Date().toISOString()
                };
            }

            await this.verifyConnection();
            return {
                status: 'healthy',
                provider: 'Mailtrap',
                lastCheck: new Date().toISOString()
            };
        } catch (error) {
            return {
                status: 'unhealthy',
                error: error.message,
                lastCheck: new Date().toISOString()
            };
        }
    }
}

// Create singleton instance
const emailService = new EmailService();

// Export both the class and legacy function for backward compatibility
export { EmailService, EMAIL_TEMPLATES };
export default emailService;

// Legacy function for backward compatibility
export const sendEmail = async (options) => {
    try {
        return await emailService.sendTemplatedEmail(
            EMAIL_TEMPLATES.WELCOME, 
            options.email, 
            options.name || '', 
            {}, 
            {
                subject: options.subject,
                html: options.html
            }
        );
    } catch (error) {
        throw new ApiError(500, "Error sending email");
    }
}; 