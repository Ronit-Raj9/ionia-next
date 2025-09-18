import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";

// Enhanced middleware imports
import { errorHandler, requestIdMiddleware, requestCompletionLogger, enhancedAuthLogging, Logger } from './middlewares/error.middleware.js';
import { sanitizeInput, validateRequestSize, validateContentType } from './middlewares/validation.middleware.js';
import { performanceMonitoring, healthCheck, getMetrics, errorTracking } from './middlewares/monitoring.middleware.js';

import { logCookieConfig, validateCookieConfig } from './utils/cookieConfig.js';

// Note: Passport removed - using JWT-only authentication for educational platform

const app = express();

// ✅ Initialize Security Systems
Logger.info("Initializing authentication security systems...");

// Validate environment configuration
const validateProductionConfig = () => {
  const required = [
    'ACCESS_TOKEN_SECRET',
    'REFRESH_TOKEN_SECRET',
    'JWT_SECRET',
    'DATABASE_ATLAS',
    'CLOUDINARY_CLOUD_NAME',
    'CLOUDINARY_API_KEY',
    'CLOUDINARY_API_SECRET',
    'FRONTEND_URL',
    'COOKIE_DOMAIN',
    'HTTPS_ENABLED',
    'PORT'
  ];
  
  // PRODUCTION FIX: Add optional but recommended variables
  const recommended = [
    'NODE_ENV',
    'SESSION_SECRET',
    'ENCRYPTION_KEY'
  ];
  
  // Add production-specific validation
  if (process.env.NODE_ENV === 'production') {
    const productionRequired = [
      'NODE_ENV',
      'HTTPS_ENABLED',
      'COOKIE_DOMAIN',
      'FRONTEND_URL'
    ];
    
    const missing = [...required, ...productionRequired].filter(key => !process.env[key]);
    
    if (missing.length > 0) {
      Logger.error('Missing required environment variables for production', { 
        missing,
        environment: process.env.NODE_ENV
      });
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
  } else {
    const missing = required.filter(key => !process.env[key]);
    
    if (missing.length > 0) {
      Logger.error('Missing required environment variables', { 
        missing,
        environment: process.env.NODE_ENV || 'development'
      });
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
  }
  
  // PRODUCTION FIX: Warn about missing recommended variables
  const missingRecommended = recommended.filter(key => !process.env[key]);
  if (missingRecommended.length > 0) {
    Logger.warn('Missing recommended environment variables', { 
      missing: missingRecommended,
      environment: process.env.NODE_ENV || 'development'
    });
  }
  
  // Validate specific values
  const validations = [
    {
      key: 'ACCESS_TOKEN_SECRET',
      condition: process.env.ACCESS_TOKEN_SECRET && process.env.ACCESS_TOKEN_SECRET.length >= 32,
      message: 'ACCESS_TOKEN_SECRET must be at least 32 characters'
    },
    {
      key: 'REFRESH_TOKEN_SECRET', 
      condition: process.env.REFRESH_TOKEN_SECRET && process.env.REFRESH_TOKEN_SECRET.length >= 32,
      message: 'REFRESH_TOKEN_SECRET must be at least 32 characters'
    },
    {
      key: 'PORT',
      condition: !isNaN(parseInt(process.env.PORT)) && parseInt(process.env.PORT) > 0,
      message: 'PORT must be a valid positive number'
    },
    {
      key: 'HTTPS_ENABLED',
      condition: ['true', 'false'].includes(process.env.HTTPS_ENABLED),
      message: 'HTTPS_ENABLED must be "true" or "false"'
    },
    {
      key: 'SESSION_SECRET',
      condition: !process.env.SESSION_SECRET || process.env.SESSION_SECRET.length >= 32,
      message: 'SESSION_SECRET must be at least 32 characters (recommended)'
    },
    {
      key: 'ENCRYPTION_KEY',
      condition: !process.env.ENCRYPTION_KEY || process.env.ENCRYPTION_KEY.length >= 32,
      message: 'ENCRYPTION_KEY must be at least 32 characters (recommended)'
    }
  ];
  
  for (const validation of validations) {
    if (!validation.condition) {
      Logger.error('Invalid environment variable', { 
        key: validation.key,
        value: process.env[validation.key],
        message: validation.message
      });
      throw new Error(validation.message);
    }
  }
  
  Logger.info('✅ All required environment variables are set and valid');
  return true;
};

// Validate production configuration
try {
  validateProductionConfig();
} catch (error) {
  Logger.error('Environment validation failed', { error: error.message });
  process.exit(1);
}

// Validate cookie configuration
validateCookieConfig();
logCookieConfig();

// Import security utilities (this initializes them)
import { tokenBlacklist } from './utils/tokenBlacklist.js';
import { rateLimiter } from './utils/rateLimiter.js';

Logger.info("Security systems initialized");

// ✅ Enhanced Middleware Stack (Order is important!)

// 1. Request ID tracking (must be first)
app.use(requestIdMiddleware);

// 2. Security headers with Helmet (must be early in the stack)
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  noSniff: true,
  xssFilter: true,
  referrerPolicy: { policy: "strict-origin-when-cross-origin" }
}));

// 3. Trust proxy for accurate IP addresses (important for rate limiting)
app.set('trust proxy', 1);

// 2.5. HTTPS Enforcement for Production
if (process.env.NODE_ENV === 'production' && process.env.HTTPS_ENABLED === 'true') {
  app.use((req, res, next) => {
    if (req.header('x-forwarded-proto') !== 'https') {
      res.redirect(`https://${req.header('host')}${req.url}`);
    } else {
      next();
    }
  });
}

// 3. Performance monitoring
app.use(performanceMonitoring);

// 4. Cookie Parser Middleware
app.use(cookieParser());

// Note: Sessions removed - using JWT-only authentication for educational platform
// This allows users to stay logged in for months without server dependencies

// 5. Request size validation
app.use(validateRequestSize('50mb')); // Increase for file uploads and large questions

// 6. Content type validation (allow multipart for file uploads)
app.use(validateContentType(['application/json', 'multipart/form-data', 'application/x-www-form-urlencoded']));

// Add a pre-flight handler that responds to all OPTIONS requests
app.options('*', (req, res) => {
  // Accept any origin that sends a request
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cookie, access-control-allow-credentials, Access-Control-Allow-Credentials');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.status(200).end();
});

// ✅ Define Allowed Origins - using environment variables for production
const getAllowedOrigins = () => {
  const baseOrigins = [
    'http://localhost:3000',
    'http://localhost:3001', 
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001'
  ];
  
  // Add production origins from environment variables
  const productionOrigins = [
    process.env.FRONTEND_URL,
    process.env.ADMIN_URL,
    process.env.API_URL
  ].filter(Boolean);
  
  return [...baseOrigins, ...productionOrigins];
};

const isOriginAllowed = (origin) => {
  // Allow requests with no origin (like mobile apps or curl requests)
  if (!origin) return true;
  
  // Get allowed origins from environment
  const allowedOrigins = getAllowedOrigins();
  
  // Check exact matches first
  if (allowedOrigins.includes(origin)) return true;
  
  // Allow any subdomain of ionia.sbs
  if (origin.endsWith('.ionia.sbs') || origin === 'https://ionia.sbs') return true;
  
  // Allow all localhost origins
  if (origin.match(/https?:\/\/localhost(:\d+)?$/)) return true;
  
  // Allow specific IP addresses (remove hardcoded IPs in production)
  if (process.env.NODE_ENV === 'development') {
    const allowedIPs = [
      'http://3.110.43.68',
      'http://3.110.43.68/',
      'https://3.110.43.68',
      'https://3.110.43.68/'
    ];
    if (allowedIPs.includes(origin)) return true;
  }
  
  // Reject all other origins
  return false;
};

// ✅ Setup CORS Middleware with maximum flexibility
app.use(
  cors({
    origin: function (origin, callback) {
      Logger.debug("Request Origin", { origin });
      
      if (isOriginAllowed(origin)) {
        callback(null, true);
      } else {
        Logger.warn(`Origin not allowed by CORS`, { origin });
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: ["Origin", "X-Requested-With", "Content-Type", "Accept", "Authorization", "Cookie", "access-control-allow-credentials", "Access-Control-Allow-Credentials"],
    exposedHeaders: ["Set-Cookie", "Authorization", "X-Request-ID"]
  })
);

// ✅ Enhanced Security and CORS Headers for all responses
app.use((req, res, next) => {
  // Set the origin based on the request's origin header
  const origin = req.headers.origin;
  if (origin && isOriginAllowed(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  
  // Always set these headers for every response
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, HEAD, PUT, PATCH, POST, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cookie, access-control-allow-credentials, Access-Control-Allow-Credentials');
  
  // Enhanced Security Headers
  res.header('X-Content-Type-Options', 'nosniff');
  res.header('X-Frame-Options', 'DENY');
  res.header('X-XSS-Protection', '1; mode=block');
  res.header('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.header('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  
  // Add CSP header with enhanced security
  const cspPolicy = [
    "default-src 'self'",
    "connect-src 'self' http://3.110.43.68/ https://ionia.sbs https://www.ionia.sbs https://api.ionia.sbs http://localhost:* https://localhost:* http://127.0.0.1:* https://127.0.0.1:*",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "img-src 'self' data: blob: https: http: https://res.cloudinary.com",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'"
  ].join('; ');
  
  res.header('Content-Security-Policy', cspPolicy);
  
  next();
});

// ✅ Body Parsing Middleware - Apply URL encoding for all requests
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(express.static("public"));

// ✅ Input Sanitization (skip for multipart uploads)
app.use((req, res, next) => {
  // Skip sanitization for file upload routes to avoid processing multipart data
  if (req.originalUrl.includes('/questions/upload') || 
      req.originalUrl.includes('/questions') && req.method === 'PATCH' && req.originalUrl.match(/\/questions\/[^\/]+$/)) {
    return next();
  }
  // Apply sanitization for other requests
  sanitizeInput(req, res, next);
});

// ✅ Request Completion Logging
app.use(requestCompletionLogger);

// ✅ Enhanced Auth Logging
app.use(enhancedAuthLogging);

// ✅ Routes Import
import userRouter from "./routes/user.routes.js";
import questionRouter from "./routes/question.routes.js";
import attemptedTestRouter from "./routes/attemptedTest.routes.js";  
import analyticsRouter from './routes/analytics.routes.js';
import testRouter from './routes/test.routes.js';

// ✅ Enhanced Health and Monitoring Endpoints
app.get('/health', healthCheck);
app.get('/metrics', getMetrics);

// ✅ Security Status Endpoint (for monitoring)
app.get('/api/security/status', (req, res) => {
  try {
    const stats = {
      tokenBlacklist: tokenBlacklist.getStats(),
      rateLimiter: rateLimiter.getStats(),
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development'
    };
    
    res.json({
      success: true,
      data: stats,
      message: 'Security system status',
      meta: {
        requestId: req.requestId
      }
    });
  } catch (error) {
    Logger.error('Security status error', { 
      requestId: req.requestId, 
      error: error.message 
    });
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get security status',
      meta: {
        requestId: req.requestId
      }
    });
  }
});

// ✅ Apply JSON parsing middleware, but skip for multipart upload routes
app.use((req, res, next) => {
  // Skip JSON parsing for specific file upload endpoints
  if (req.originalUrl.includes('/questions/upload') || 
      req.originalUrl.includes('/questions') && req.method === 'PATCH' && req.originalUrl.match(/\/questions\/[^\/]+$/)) {
    return next();
  }
  // Apply JSON parsing for other requests
  express.json({ limit: "50mb" })(req, res, next);
});

// ✅ Routes Declaration
app.use("/api/v1/users", userRouter);
app.use("/api/v1/questions", questionRouter);
app.use("/api/v1/attempted-tests", attemptedTestRouter);  
app.use('/api', analyticsRouter); 
app.use('/api/v1/tests', testRouter);

// ✅ Add direct debug endpoint for admin analytics
app.get('/api/debug-analytics', async (req, res) => {
  try {
    Logger.debug('Debug analytics endpoint accessed', { requestId: req.requestId });
    res.json({
      success: true,
      data: {
      totalTests: 5,
      totalQuestions: 150,
      activeUsers: 25,
      totalStudents: 100,
      testsBySubject: {
        'Physics': 20,
        'Chemistry': 15,
        'Mathematics': 30
      },
      completionRates: {
        'Physics Test 1': 75,
        'Chemistry Basics': 60
      },
      recentTests: [
        {
          id: '1',
          title: 'Physics Test 1', 
          questions: 20,
          attempts: 15,
          createdAt: new Date().toISOString()
        }
      ],
      recentQuestions: [
        {
          id: '1',
          title: 'Newton\'s Laws Question', 
          subject: 'Physics',
          createdAt: new Date().toISOString()
        }
      ]
      },
      meta: {
        requestId: req.requestId
      }
    });
  } catch (error) {
    Logger.error('Debug endpoint error', { 
      requestId: req.requestId, 
      error: error.message 
    });
    res.status(500).json({ 
      success: false,
      error: 'Debug endpoint failed',
      meta: {
        requestId: req.requestId
      }
    });
  }
});

// ✅ Root Endpoint
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "API is running with enhanced security and monitoring...",
    timestamp: new Date().toISOString(),
    requestId: req.requestId
  });
});

// ✅ Enhanced Error Handling Middleware Stack (Order is important!)
app.use(errorTracking); // Track errors in metrics
app.use(errorHandler);  // Handle and format errors

// ✅ Export the App
export { app };
