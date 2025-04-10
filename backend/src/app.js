import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { errorHandler } from './middlewares/error.middleware.js';

const app = express();

// ✅ Use Cookie Parser Middleware
app.use(cookieParser());

// ✅ Define Allowed Origins
const allowedOrigins = [
  "https://ionia-next.vercel.app",
  "https://www.ionia.sbs",
  "https://ionia.sbs",
  "http://localhost:3000", // For local development
  "http://localhost:3001", // For local development
  "http://localhost:3002", // For local development
  "https://ionia-next-production.up.railway.app", // Your Railway backend URL
  /^https:\/\/ionia-next.*\.vercel\.app$/ // Allow all Vercel preview URLs
];

// ✅ Setup CORS Middleware
app.use(
  cors({
    origin: function (origin, callback) {
      console.log("Request Origin:", origin);  // Debugging CORS issues
      
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) {
        return callback(null, true);
      }

      // Check if origin matches any of our allowed origins
      const isAllowed = allowedOrigins.some(allowedOrigin => {
        if (allowedOrigin instanceof RegExp) {
          return allowedOrigin.test(origin);
        }
        return allowedOrigin === origin;
      });

      if (isAllowed) {
        callback(null, true);
      } else {
        console.log(`Origin ${origin} not allowed by CORS`);
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,  // 🔥 Required to send cookies
    methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Cookie"],
    exposedHeaders: ["Set-Cookie"]
  })
);

// ✅ Ensure Cookies Are Set Properly
app.use((req, res, next) => {
  // Get the origin from the request headers
  const origin = req.headers.origin;
  
  // Only set CORS headers if we have an origin (browser requests)
  if (origin) {
    // Check if origin is allowed
    const isAllowed = allowedOrigins.some(allowedOrigin => {
      if (allowedOrigin instanceof RegExp) {
        return allowedOrigin.test(origin);
      }
      return allowedOrigin === origin;
    });

    if (isAllowed) {
      res.header("Access-Control-Allow-Origin", origin);
      res.header("Access-Control-Allow-Credentials", "true");
      res.header("Access-Control-Allow-Methods", "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS");
      res.header("Access-Control-Allow-Headers", "Content-Type,Authorization,Cookie");
      res.header("Access-Control-Expose-Headers", "Set-Cookie");
    }
  }
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
