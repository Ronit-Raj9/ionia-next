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
  "https://ionia-next-ronit-rajvs-projects.vercel.app", // Vercel preview deployment
  "https://ionia-next-git-main-ronit-rajvs-projects.vercel.app", // Vercel branch deployment
  "https://ionia-next.onrender.com" // Render deployment (if you use it)
];

// ✅ Setup CORS Middleware
app.use(
  cors({
    origin: function (origin, callback) {
      console.log("Request Origin:", origin);  // Debugging CORS issues
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(null, true); // Allow any origin in production for now - you can restrict this later
        console.log("Origin not in allowed list, but accepted:", origin);
      }
    },
    credentials: true,  // 🔥 Required to send cookies
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"]
  })
);

// ✅ Ensure Cookies Are Set Properly
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.header("Access-Control-Allow-Origin", origin);
  } else {
    res.header("Access-Control-Allow-Origin", "*"); // Fallback for development
  }
  res.header("Access-Control-Allow-Credentials", "true");
  res.header("Access-Control-Allow-Methods", "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type,Authorization,X-Requested-With");
  next();
});

// ✅ Set Secure Cookies in Responses
app.use((req, res, next) => {
  res.cookie("token", "your_token_here", {
    httpOnly: true,   // Prevent client-side JavaScript from accessing cookies
    secure: true,     // 🔥 Ensures cookies are sent only over HTTPS
    sameSite: "None", // 🔥 Allows cross-origin cookies
  });
  next();
});

// ✅ Body Parsing Middleware
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));

// ✅ Routes Import
import userRouter from "./routes/user.routes.js";
import questionRouter from "./routes/question.routes.js";
import previousYearPaperRouter from "./routes/previousYearPaper.routes.js";
import attemptedTestRouter from "./routes/attemptedTest.routes.js";  
import scheduledTestRouter from "./routes/scheduledTest.routes.js";

// ✅ Routes Declaration
app.use("/api/v1/users", userRouter);
app.use("/api/v1/questions", questionRouter);
app.use("/api/v1/previous-year-papers", previousYearPaperRouter);
app.use("/api/v1/attempted-tests", attemptedTestRouter);  
app.use("/api/v1/scheduled-tests", scheduledTestRouter);

// ✅ Example Endpoint
app.get("/", (req, res) => {
  res.send("API is running...");
});

// Error handling middleware
app.use(errorHandler);

// ✅ Export the App
export { app };
