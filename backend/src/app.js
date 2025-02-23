import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

// ✅ Use Cookie Parser Middleware
app.use(cookieParser());

// ✅ Define Allowed Origins
const allowedOrigins = [
  "https://ionia-next.vercel.app",
  "https://www.ionia.sbs",
  "https://ionia.sbs",
  "http://localhost:3000", // For local development
  "https://ionia-next-production.up.railway.app" // Your Railway backend URL
];

// ✅ Setup CORS Middleware
app.use(
  cors({
    origin: function (origin, callback) {
      console.log("Request Origin:", origin);  // Debugging CORS issues
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,  // 🔥 Required to send cookies
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    allowedHeaders: ["Content-Type", "Authorization"]
  })
);

// ✅ Ensure Cookies Are Set Properly
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", req.headers.origin || "*");
  res.header("Access-Control-Allow-Credentials", "true");
  res.header("Access-Control-Allow-Methods", "GET,HEAD,PUT,PATCH,POST,DELETE");
  res.header("Access-Control-Allow-Headers", "Content-Type,Authorization");
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

// ✅ Routes Declaration
app.use("/api/v1/users", userRouter);
app.use("/api/v1/questions", questionRouter);
app.use("/api/v1/previous-year-papers", previousYearPaperRouter);
app.use("/api/v1/attempted-tests", attemptedTestRouter);  

// ✅ Example Endpoint
app.get("/", (req, res) => {
  res.send("API is running...");
});

// ✅ Export the App
export { app };
