# Email Verification Fields Migration

## Overview
This migration adds email verification and user preference fields to support the new Mailtrap email service integration.

## Migration Summary
- **Date**: 2025-05-29
- **Users Affected**: 46 users
- **Status**: ✅ **COMPLETED SUCCESSFULLY**
- **Zero Downtime**: Yes

## Fields Added

### 1. Email Verification Token Fields
```javascript
emailVerificationToken: {
  type: String,
  default: null
}
emailVerificationExpires: {
  type: Date,
  default: null
}
```

### 2. Email Verification Attempts (Rate Limiting)
```javascript
emailVerificationAttempts: {
  count: { type: Number, default: 0 },
  lastAttempt: { type: Date, default: null },
  blocked: { type: Boolean, default: false },
  blockedUntil: { type: Date, default: null }
}
```

### 3. Email Preferences
```javascript
emailPreferences: {
  welcome: { type: Boolean, default: true },           // Welcome emails
  testCompletion: { type: Boolean, default: true },    // Test completion notifications
  weeklyProgress: { type: Boolean, default: true },    // Weekly progress reports
  marketing: { type: Boolean, default: false },        // Marketing emails
  security: { type: Boolean, default: true },          // Security notifications (always true)
  systemUpdates: { type: Boolean, default: true },     // System updates
  achievements: { type: Boolean, default: true },      // Achievement notifications
  reminders: { type: Boolean, default: true },         // Study reminders
  newsletter: { type: Boolean, default: false }        // Newsletter subscription
}
```

## New User Model Methods

### Email Verification Methods
```javascript
// Generate verification token (24-hour expiry)
user.generateEmailVerificationToken()

// Validate token
user.isEmailVerificationTokenValid(token)

// Clear token after verification
user.clearEmailVerificationToken()

// Rate limiting
user.incrementEmailVerificationAttempts()
user.isEmailVerificationBlocked()
user.resetEmailVerificationAttempts()
```

### Email Preferences Methods
```javascript
// Update user preferences
user.updateEmailPreferences({
  testCompletion: false,
  marketing: true
})

// Check if user can receive email type
user.canReceiveEmail('testCompletion') // Returns boolean
```

## Integration with Mailtrap Email Service

### Supported Email Types
1. **Welcome** - New user onboarding
2. **Email Verification** - Account verification
3. **Password Reset** - Secure password reset
4. **Test Completion** - Test results and analytics
5. **Security Alerts** - Account security notifications

### Usage Examples
```javascript
import emailService from '../utils/emailService.js';

// Send welcome email (respects user preferences)
if (user.canReceiveEmail('welcome')) {
  await emailService.sendWelcomeEmail(user.email, user.fullName);
}

// Send verification email
const token = user.generateEmailVerificationToken();
await user.save();
await emailService.sendVerificationEmail(user.email, user.fullName, token);

// Send test completion (respects user preferences)
if (user.canReceiveEmail('testCompletion')) {
  await emailService.sendTestCompletionEmail(user.email, user.fullName, testData);
}
```

## Migration Commands

### Check Migration Status
```bash
npm run migrate:email-verification:check
```

### Run Migration
```bash
npm run migrate:email-verification migrate
```

### Rollback Migration (if needed)
```bash
npm run migrate:email-verification:rollback
```

## Security Features

### Rate Limiting
- **Max Attempts**: 5 verification attempts
- **Block Duration**: 1 hour after 5 failed attempts
- **Auto-Reset**: Blocked status expires automatically

### Token Security
- **Expiry**: 24 hours
- **Format**: UUID v4
- **Storage**: Encrypted in database

### Email Preferences Security
- **Security Emails**: Cannot be disabled (always `true`)
- **User Control**: Users can control marketing, progress, and optional emails
- **Default Safe**: Conservative defaults (marketing off, security on)

## Testing

### Test Email Service
```bash
node -r dotenv/config src/scripts/test-email-mailtrap.js
```

### Test User Model Methods
```javascript
// Create test user
const user = new User({ /* user data */ });

// Test token generation
const token = user.generateEmailVerificationToken();
console.log('Token:', token);
console.log('Expires:', user.emailVerificationExpires);

// Test validation
console.log('Valid:', user.isEmailVerificationTokenValid(token));

// Test preferences
console.log('Can receive welcome:', user.canReceiveEmail('welcome'));
```

## Production Deployment Notes

### Pre-Migration Checklist
- ✅ Database backup completed
- ✅ Mailtrap credentials configured
- ✅ Email service tested
- ✅ Migration script tested

### Post-Migration Verification
- ✅ All 46 users have new fields
- ✅ Email service health check passes
- ✅ Default preferences applied correctly
- ✅ Rate limiting functionality works

## Rollback Plan
If rollback is needed:
```bash
npm run migrate:email-verification:rollback
```

This will remove all email verification fields from users and revert to the previous schema.

## Support for Future Features

The migration enables:
- **Email Verification Flow**: Complete verification system
- **User Preference Management**: Granular email controls
- **Email Analytics**: Track delivery and user engagement
- **Template System**: Beautiful, branded email templates
- **Rate Limiting**: Prevent abuse and spam

## Next Steps

1. **Frontend Integration**: Add email preference settings UI
2. **Email Verification Flow**: Implement complete verification process
3. **Email Analytics**: Track email engagement metrics
4. **Advanced Templates**: Add more email types as needed

## Monitoring

Monitor the email service health:
```bash
curl http://localhost:4000/health | jq '.data.services.email'
```

Expected response:
```json
{
  "status": "healthy",
  "provider": "Mailtrap",
  "lastCheck": "2025-05-29T07:49:28.005Z"
}
``` 