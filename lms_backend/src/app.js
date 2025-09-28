import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import morgan from "morgan";

// Import middleware
import { errorHandler, requestIdMiddleware, requestCompletionLogger, enhancedAuthLogging, Logger } from './middlewares/error.middleware.js';
import { sanitizeInput, validateRequestSize, validateContentType } from './middlewares/validation.middleware.js';
import { performanceMonitoring, healthCheck, getMetrics, errorTracking } from './middlewares/monitoring.middleware.js';
import { rateLimiter } from './utils/rateLimiter.js';

// Import routes
import authRouter from "./routes/auth.routes.js";
import userRouter from "./routes/user.routes.js";
import questionRouter from "./routes/question.routes.js";
import chainRouter from "./routes/chain.routes.js";
import progressRouter from "./routes/progress.routes.js";
import analyticsRouter from "./routes/analytics.routes.js";

const app = express();

// ✅ Initialize Security Systems
Logger.info("Initializing LMS authentication security systems...");

// ✅ Environment Validation
const validateEnvironmentConfig = () => {
  const isProduction = process.env.NODE_ENV === 'production';
  const environment = process.env.NODE_ENV || 'development';
  
  const baseRequired = [
    'ACCESS_TOKEN_SECRET', 'REFRESH_TOKEN_SECRET', 'JWT_SECRET',
    'DATABASE_ATLAS', 'CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET',
    'LMS_FRONTEND_URL', 'COOKIE_DOMAIN', 'HTTPS_ENABLED', 'PORT'
  ];
  
  const productionRequired = ['NODE_ENV', 'HTTPS_ENABLED', 'COOKIE_DOMAIN', 'LMS_FRONTEND_URL'];
  const recommended = ['NODE_ENV', 'SESSION_SECRET', 'ENCRYPTION_KEY'];
  
  const required = isProduction ? [...baseRequired, ...productionRequired] : baseRequired;
  
  const missing = required.filter(key => !process.env[key]);
  if (missing.length > 0) {
    Logger.error(`Missing required environment variables for ${environment}`, { missing, environment });
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
  
  const missingRecommended = recommended.filter(key => !process.env[key]);
  if (missingRecommended.length > 0) {
    Logger.warn('Missing recommended environment variables', { missing: missingRecommended, environment });
  }
  
  Logger.info('✅ All required environment variables are set and valid');
  return true;
};

// Validate environment configuration
try {
  validateEnvironmentConfig();
} catch (error) {
  Logger.error('Environment validation failed', { error: error.message });
  process.exit(1);
}

Logger.info("Security systems initialized");

// ✅ Enhanced Middleware Stack (Order is important!)

// 1. Request ID tracking (must be first)
app.use(requestIdMiddleware);

// 2. Security headers with Helmet
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'", 
        "'unsafe-inline'", 
        "'unsafe-eval'",
        "https://www.googletagmanager.com",
        "https://www.google-analytics.com"
      ],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: [
        "'self'", 
        "data:", 
        "https:",
        "https://www.google-analytics.com",
        "https://www.googletagmanager.com"
      ],
      connectSrc: [
        "'self'",
        "https://www.google-analytics.com",
        "https://analytics.google.com",
        "https://apii.ionia.sbs",
        "https://www.ionia.sbs",
        "http://localhost:*",
        "https://localhost:*",
        "http://127.0.0.1:*",
        "https://127.0.0.1:*"
      ],
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

// 3. Trust proxy for accurate IP addresses
app.set('trust proxy', 1);

// 4. HTTPS Enforcement for Production
if (process.env.NODE_ENV === 'production' && process.env.HTTPS_ENABLED === 'true') {
  app.use((req, res, next) => {
    if (req.header('x-forwarded-proto') !== 'https') {
      res.redirect(`https://${req.header('host')}${req.url}`);
    } else {
      next();
    }
  });
}

// 5. Performance monitoring
app.use(performanceMonitoring);

// 6. Cookie Parser Middleware
app.use(cookieParser());

// 7. Request size validation
app.use(validateRequestSize('50mb'));

// 8. Content type validation
app.use(validateContentType(['application/json', 'multipart/form-data', 'application/x-www-form-urlencoded']));

// 9. CORS Configuration
const isOriginAllowed = (origin) => {
  if (!origin) return true;
  
  const baseOrigins = [
    'http://localhost:3001', 'http://localhost:3002', 
    'http://127.0.0.1:3001', 'http://127.0.0.1:3002'
  ];
  
  const productionOrigins = [
    process.env.LMS_FRONTEND_URL, process.env.FRONTEND_URL
  ].filter(Boolean);
  
  const allowedOrigins = [...baseOrigins, ...productionOrigins];
  
  if (allowedOrigins.includes(origin)) return true;
  
  if (origin.endsWith('.ionia.sbs') || origin === 'https://ionia.sbs') return true;
  
  if (origin.match(/https?:\/\/localhost(:\d+)?$/)) return true;
  
  if (process.env.NODE_ENV === 'development') {
    const allowedIPs = ['http://3.110.43.68', 'http://3.110.43.68/', 'https://3.110.43.68', 'https://3.110.43.68/'];
    if (allowedIPs.includes(origin)) return true;
  }
  
  return false;
};

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
    allowedHeaders: ["Origin", "X-Requested-With", "Content-Type", "Accept", "Authorization", "Cookie", "access-control-allow-credentials", "Access-Control-Allow-Credentials", "X-CSRF-Token", "x-csrf-token"],
    exposedHeaders: ["Set-Cookie", "Authorization", "X-Request-ID"]
  })
);

// 10. Additional Security Headers
app.use((req, res, next) => {
  res.header('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  next();
});

// 11. Body Parsing Middleware
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(express.static("public"));

// 12. Input Sanitization (skip for multipart uploads)
const isFileUploadRoute = (req) => {
  return req.originalUrl.includes('/upload') || 
         (req.method === 'PATCH' && req.originalUrl.match(/\/questions\/[^\/]+$/));
};

app.use((req, res, next) => {
  if (isFileUploadRoute(req)) {
    return next();
  }
  sanitizeInput(req, res, next);
});

// 13. JSON Parsing Middleware (skip for multipart uploads)
app.use((req, res, next) => {
  if (isFileUploadRoute(req)) {
    return next();
  }
  express.json({ limit: "50mb" })(req, res, next);
});

// 14. Request Completion Logging
app.use(requestCompletionLogger);

// 15. Enhanced Auth Logging
app.use(enhancedAuthLogging);

// 16. Morgan logging
app.use(morgan('combined'));

// ✅ Health and Monitoring Endpoints
app.get('/health', healthCheck);
app.get('/metrics', getMetrics);

// ✅ LMS Status Endpoint
app.get('/api/status', (req, res) => {
  try {
    const stats = {
      service: 'LMS Backend',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      database: 'connected', // This would be checked dynamically
      features: {
        authentication: true,
        questionChaining: true,
        progressTracking: true,
        analytics: true
      }
    };
    
    res.json({
      success: true,
      data: stats,
      message: 'LMS service is running',
      meta: {
        requestId: req.requestId
      }
    });
  } catch (error) {
    Logger.error('Status endpoint error', { 
      requestId: req.requestId, 
      error: error.message 
    });
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get service status',
      meta: {
        requestId: req.requestId
      }
    });
  }
});

// ✅ Routes Declaration
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/questions", questionRouter);
app.use("/api/v1/chains", chainRouter);
app.use("/api/v1/progress", progressRouter);
app.use("/api/v1/analytics", analyticsRouter);

// ✅ Root Endpoint
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "LMS API is running with enhanced security and monitoring...",
    service: "Learning Management System",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
    requestId: req.requestId,
    endpoints: {
      auth: "/api/v1/auth",
      users: "/api/v1/users",
      questions: "/api/v1/questions",
      chains: "/api/v1/chains",
      progress: "/api/v1/progress",
      analytics: "/api/v1/analytics"
    }
  });
});

// ✅ Enhanced Error Handling Middleware Stack
app.use(errorTracking);
app.use(errorHandler);

// ✅ Export the App
export { app };
