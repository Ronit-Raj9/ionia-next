import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { errorHandler } from './middlewares/error.middleware.js';

const app = express();

// ✅ Use Cookie Parser Middleware
app.use(cookieParser());

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
      console.log("Request Origin:", origin);
      
      if (isOriginAllowed(origin)) {
        callback(null, true);
      } else {
        console.log(`Origin ${origin} not allowed by CORS`);
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: ["Origin", "X-Requested-With", "Content-Type", "Accept", "Authorization", "Cookie", "access-control-allow-credentials", "Access-Control-Allow-Credentials"],
    exposedHeaders: ["Set-Cookie", "Authorization"]
  })
);

// ✅ Additional Security and CORS Headers for all responses
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
  
  // Add CSP header 
  res.header('Content-Security-Policy', "default-src 'self'; connect-src 'self' http://3.110.43.68/ https://ionia.sbs https://www.ionia.sbs https://api.ionia.sbs http://localhost:* https://localhost:* http://127.0.0.1:* https://127.0.0.1:*; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; script-src 'self' 'unsafe-inline' 'unsafe-eval'; img-src 'self' data: blob: https: http: https://res.cloudinary.com;");
  
  next();
});

// ✅ Body Parsing Middleware
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));

// ✅ Routes Import
import userRouter from "./routes/user.routes.js";
import questionRouter from "./routes/question.routes.js";
// import previousYearPaperRouter from "./routes/previousYearPaper.routes.js"; // REMOVE: No longer needed
import attemptedTestRouter from "./routes/attemptedTest.routes.js";  
import analyticsRouter from './routes/analytics.routes.js';
import testRouter from './routes/test.routes.js'; // Use this for ALL test types, including PYQ

// ✅ Routes Declaration
app.use("/api/v1/users", userRouter);
app.use("/api/v1/questions", questionRouter);
app.use("/api/v1/attempted-tests", attemptedTestRouter);  
app.use('/api', analyticsRouter); 
app.use('/api/v1/tests', testRouter); // Use this router for fetching/managing PYQs as well

// ✅ Add direct debug endpoint for admin analytics
app.get('/api/debug-analytics', async (req, res) => {
  try {
    console.log('Debug analytics endpoint accessed');
    res.json({
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
    });
  } catch (error) {
    console.error('Debug endpoint error:', error);
    res.status(500).json({ error: 'Debug endpoint failed' });
  }
});

// Log all incoming requests for debugging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
  next();
});

// ✅ Example Endpoint
app.get("/", (req, res) => {
  res.send("API is running...");
});

// Error handling middleware
app.use(errorHandler);

// ✅ Export the App
export { app };
