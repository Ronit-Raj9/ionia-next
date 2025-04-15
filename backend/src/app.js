import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { errorHandler } from './middlewares/error.middleware.js';

const app = express();

// ✅ Use Cookie Parser Middleware
app.use(cookieParser());

// ✅ Define Allowed Origins
const allowedOrigins = [
  "https://ionia.sbs",
  "http://localhost:3000",
  "http://3.7.73.172"
];

// ✅ Setup CORS Middleware
app.use(
  cors({
    origin: function (origin, callback) {
      console.log("Request Origin:", origin);
      
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
        callback(null, true);
      } else {
        console.log(`Origin ${origin} not allowed by CORS`);
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization", "Cookie", "Accept"],
    exposedHeaders: ["Set-Cookie"]
  })
);

// ✅ Additional Security Headers
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cookie');
  
  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
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
