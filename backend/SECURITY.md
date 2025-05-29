# 🔐 Authentication Security System

This document outlines the comprehensive security improvements implemented in the backend authentication system.

## 🚀 Overview

The authentication system has been completely overhauled with production-grade security features including:

- **Token Blacklisting**: Proper token invalidation and session management
- **Rate Limiting**: Protection against brute force attacks
- **Secure Cookie Handling**: HttpOnly cookies with proper domain/path settings
- **Session Tracking**: Enhanced user session monitoring
- **Account Lockout**: Protection against repeated failed login attempts
- **Enhanced Logging**: Comprehensive security event logging

## 🔧 Core Security Components

### 1. Token Blacklist Manager (`utils/tokenBlacklist.js`)

**Purpose**: Manages invalidated tokens and active refresh tokens

**Features**:
- In-memory token blacklisting (upgradeable to Redis)
- Automatic cleanup of expired tokens
- Refresh token rotation tracking
- Session management per user

**Key Methods**:
```javascript
tokenBlacklist.addToBlacklist(token, expiresAt)
tokenBlacklist.isBlacklisted(token)
tokenBlacklist.storeRefreshToken(userId, refreshToken, expiresAt)
tokenBlacklist.invalidateRefreshToken(userId, refreshToken)
```

### 2. Rate Limiter (`utils/rateLimiter.js`)

**Purpose**: Prevents brute force attacks and API abuse

**Rate Limits**:
- **Login**: 5 attempts per 15 minutes → 30 minute block
- **Register**: 3 attempts per hour → 1 hour block
- **Forgot Password**: 3 attempts per hour → 1 hour block
- **Refresh Token**: 10 attempts per 5 minutes → 15 minute block

**Features**:
- IP-based rate limiting
- Automatic cleanup of old attempts
- Configurable limits per endpoint type
- Express middleware integration

### 3. Cookie Configuration (`utils/cookieConfig.js`)

**Purpose**: Centralized secure cookie settings

**Security Features**:
- **HttpOnly**: Prevents XSS attacks
- **Secure**: HTTPS-only in production
- **SameSite**: CSRF protection
- **Domain**: Proper domain scoping
- **Path**: Restricted paths for refresh tokens

**Cookie Types**:
- **Access Token**: 15 minutes, available on all paths
- **Refresh Token**: 7 days, only on `/api/v1/users/refresh-token`

### 4. Enhanced Authentication Middleware (`middlewares/auth.middleware.js`)

**Improvements**:
- **Cookie-only authentication**: More secure than headers
- **Token blacklist checking**: Validates token hasn't been invalidated
- **Enhanced error handling**: Clear, actionable error messages
- **User validation**: Ensures user still exists and is active
- **Session tracking**: Updates user activity timestamps

**New Middleware Functions**:
- `verifyJWT`: Enhanced JWT verification
- `verifyRole`: Role-based access control
- `optionalAuth`: Optional authentication for public/private endpoints
- `verifyOwnershipOrAdmin`: Resource ownership validation
- `logAuthEvent`: Security event logging

## 🔒 User Model Enhancements (`models/user.model.js`)

### New Security Fields

```javascript
// Session tracking
lastLoginAt: Date
lastLoginIP: String
lastActivity: Date

// Security fields
isActive: Boolean
isEmailVerified: Boolean

// Token tracking
activeTokens: [{
  jti: String,           // JWT ID for tracking
  type: String,          // 'access' or 'refresh'
  createdAt: Date,
  expiresAt: Date,
  ip: String,
  userAgent: String
}]
```

### New Security Methods

```javascript
// Token management
user.generateAccessToken(clientInfo)
user.generateRefreshToken(clientInfo)
user.invalidateToken(jti)
user.invalidateAllTokens()
user.cleanupExpiredTokens()

// Session management
user.getActiveSessionsCount()
user.updateActivity()
```

## 🛡️ Security Features

### 1. Token Security

**Access Tokens**:
- **Lifetime**: 15 minutes
- **Storage**: HttpOnly cookies only
- **Blacklisting**: Immediate invalidation on logout
- **Tracking**: JWT ID (jti) for precise tracking

**Refresh Tokens**:
- **Lifetime**: 7 days
- **Rotation**: New token issued on each refresh
- **Invalidation**: Old token immediately blacklisted
- **Scope**: Limited to refresh endpoint only

### 2. Session Management

**Features**:
- Track active sessions per user
- Monitor login locations (IP addresses)
- Update activity timestamps
- Logout from all devices functionality

### 3. Enhanced Logging

**Security Events Logged**:
- Login attempts (success/failure)
- Registration attempts
- Password changes
- Token refresh attempts
- Admin actions
- Rate limit violations

**Log Format**:
```
🔒 AUTH EVENT: LOGIN_ATTEMPT | IP: 192.168.1.1 | UA: Mozilla/5.0... | Time: 2024-01-01T12:00:00.000Z
```

## 🚦 API Endpoints

### Authentication Endpoints

```
POST /api/v1/users/register     - Rate limited registration
POST /api/v1/users/login        - Rate limited login
POST /api/v1/users/logout       - Secure logout
POST /api/v1/users/logout-all   - Logout from all devices
POST /api/v1/users/refresh-token - Rate limited token refresh
```

### Security Monitoring

```
GET /api/v1/users/auth/status   - Authentication system status (admin)
GET /api/security/status        - Security system statistics
GET /health                     - Health check with security stats
```

## 🔧 Configuration

### Environment Variables

```bash
# JWT Secrets (use strong, unique values)
ACCESS_TOKEN_SECRET=your-super-secret-access-token-key
REFRESH_TOKEN_SECRET=your-super-secret-refresh-token-key

# Environment
NODE_ENV=production

# Cookie Domain (production)
COOKIE_DOMAIN=.ionia.sbs

# HTTPS (production)
HTTPS_ENABLED=true
```

### Production Recommendations

1. **Use Redis for Token Blacklisting**:
   ```javascript
   // Replace in-memory storage with Redis
   import Redis from 'ioredis';
   const redis = new Redis(process.env.REDIS_URL);
   ```

2. **Implement Proper Logging Service**:
   ```javascript
   // Use Winston, Bunyan, or similar
   import winston from 'winston';
   ```

3. **Add Monitoring and Alerting**:
   - Monitor failed login attempts
   - Alert on rate limit violations
   - Track token blacklist growth

4. **Database Indexes**:
   ```javascript
   // Already implemented in user model
   userSchema.index({ email: 1 });
   userSchema.index({ 'activeTokens.jti': 1 });
   userSchema.index({ 'activeTokens.expiresAt': 1 });
   ```

## 🚨 Security Considerations

### Current Limitations

1. **In-Memory Storage**: Token blacklist uses memory (upgrade to Redis for production)
2. **Rate Limiting**: IP-based only (consider user-based limits)
3. **Logging**: Console-based (upgrade to proper logging service)

### Future Enhancements

1. **Two-Factor Authentication (2FA)**
2. **Device Fingerprinting**
3. **Geolocation-based Security**
4. **Advanced Threat Detection**
5. **OAuth2/OpenID Connect Integration**

## 🔍 Monitoring and Debugging

### Security Status Endpoint

```bash
curl -X GET http://localhost:8000/api/security/status
```

**Response**:
```json
{
  "success": true,
  "data": {
    "tokenBlacklist": {
      "blacklistedTokens": 5,
      "activeRefreshTokens": 12,
      "usersWithTokens": 8
    },
    "rateLimiter": {
      "activeAttempts": 3,
      "blockedIPs": 1,
      "totalFailedAttempts": 15
    },
    "timestamp": "2024-01-01T12:00:00.000Z",
    "uptime": 3600,
    "environment": "production"
  }
}
```

### Health Check

```bash
curl -X GET http://localhost:8000/health
```

## 🛠️ Troubleshooting

### Common Issues

1. **"Access token required"**:
   - Check if cookies are being sent
   - Verify cookie domain settings
   - Ensure HTTPS in production

2. **"Rate limit exceeded"**:
   - Check IP-based limits
   - Verify rate limiter configuration
   - Consider whitelisting trusted IPs

3. **"Token has been invalidated"**:
   - Check token blacklist
   - Verify refresh token rotation
   - Ensure proper logout handling

### Debug Commands

```javascript
// Check token blacklist stats
console.log(tokenBlacklist.getStats());

// Check rate limiter stats
console.log(rateLimiter.getStats());

// Check user active sessions
console.log(user.getActiveSessionsCount());
```

## 📚 Additional Resources

- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [JWT Best Practices](https://auth0.com/blog/a-look-at-the-latest-draft-for-jwt-bcp/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)

---

**Last Updated**: January 2024  
**Version**: 2.0.0  
**Maintainer**: Backend Security Team 