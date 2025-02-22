import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

app.use(cookieParser());

const allowedOrigins = [
    "https://ionia-next.vercel.app", // Your Vercel frontend
    "http://localhost:3000" // For local development
  ];
  
  app.use(
    cors({
      origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error("Not allowed by CORS"));
        }
      },
      credentials: true, // Allows cookies, sessions, etc.
      methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
      allowedHeaders: "Content-Type,Authorization"
    })
  );
  
app.use(express.json({limit: "16kb"}));
app.use(express.urlencoded({extended: true, limit: "16kb"}));
app.use(express.static("public"));

// Routes import 
import userRouter from "./routes/user.routes.js";
import questionRouter from "./routes/question.routes.js";
import previousYearPaperRouter from "./routes/previousYearPaper.routes.js";
import attemptedTestRouter from "./routes/attemptedTest.routes.js";  // <-- Import the attemptedTest router

// Routes declaration
app.use("/api/v1/users", userRouter);
app.use("/api/v1/questions", questionRouter);
app.use("/api/v1/previous-year-papers", previousYearPaperRouter);
app.use("/api/v1/attempted-tests", attemptedTestRouter);  // <-- Register the attemptedTest routes

// Example: http://localhost:3000/api/v1/users/register

export { app };
