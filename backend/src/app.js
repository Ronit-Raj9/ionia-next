import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

// Enhanced middleware imports
import { errorHandler, requestIdMiddleware, requestCompletionLogger, Logger } from './middlewares/error.middleware.js';
import { sanitizeInput, validateRequestSize, validateContentType } from './middlewares/validation.middleware.js';
import { performanceMonitoring, healthCheck, getMetrics, errorTracking } from './middlewares/monitoring.middleware.js';

import { logCookieConfig, validateCookieConfig } from './utils/cookieConfig.js';

const app = express();

// ✅ Initialize Security Systems
Logger.info("Initializing authentication security systems...");

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

// 2. Trust proxy for accurate IP addresses (important for rate limiting)
app.set('trust proxy', 1);

// 3. Performance monitoring
app.use(performanceMonitoring);

// 4. Cookie Parser Middleware
app.use(cookieParser());

// 5. Request size validation
app.use(validateRequestSize('16mb')); // Increase for file uploads

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

// ✅ Define Allowed Origins - using function instead of array for more flexibility
const isOriginAllowed = (origin) => {
  // Allow requests with no origin (like mobile apps or curl requests)
  if (!origin) return true;
  
  // Allow any subdomain of ionia.sbs
  if (origin.endsWith('.ionia.sbs') || origin === 'https://ionia.sbs') return true;
  
  // Allow all localhost origins
  if (origin.match(/https?:\/\/localhost(:\d+)?$/)) return true;
  
  // Allow specific IP addresses
  const allowedIPs = [
    'http://3.110.43.68',
    'http://3.110.43.68/',
    'https://3.110.43.68',
    'https://3.110.43.68/'
  ];
  if (allowedIPs.includes(origin)) return true;
  
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

// ✅ Body Parsing Middleware
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));

// ✅ Input Sanitization (after body parsing)
app.use(sanitizeInput);

// ✅ Request Completion Logging
app.use(requestCompletionLogger);

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
