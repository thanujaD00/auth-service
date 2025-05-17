import "dotenv/config";
import express, { Express } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import passport from "passport";
import "express-async-errors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

import connectDB from "./config/db.config";
import logger from "./config/logger.config";
import authRoutes from "./routes/auth.routes";
import notFoundMiddleware from "./middleware/notfound.middleware";
import errorHandlerMiddleware from "./middleware/errorhandler.middleware";
import "./utils/passport-config";

const app: Express = express();
const PORT = process.env.PORT;

// Add security headers with helmet
app.use(helmet());

// Rate limiting middleware
const limiter = rateLimit({
 windowMs: 15 * 60 * 1000, // 15 minutes
 max: 100, // limit each IP to 100 requests per windowMs
 standardHeaders: true, // Return rate limit info in the RateLimit-* headers
 legacyHeaders: false, // Disable the X-RateLimit-* headers
 message: "Too many requests from this IP, please try again after 15 minutes"
});

// Apply rate limiting to all requests
app.use(limiter);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
 cors({
   origin: process.env.FRONTEND_URL || "*",
   credentials: true,
   methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
 })
);
app.use(passport.initialize());
app.use(cookieParser());

// Routes
app.get("/health", (req, res) => {
 res.status(200).json({ status: "Auth Service is running" });
});

app.use("/api/v1/auth", authRoutes);

// Error Handling
app.use(notFoundMiddleware);
app.use(errorHandlerMiddleware);

// Start server
async function startServer() {
 console.log("Environment variables PORT:", process.env.PORT);
 console.log("Starting application...");
 try {
   await connectDB();
   const server = app.listen(PORT, () => {
     logger.info(`Auth Service is running on port ${PORT}🚀`);
   });

   // Graceful shutdown
   process.on("SIGINT", () => {
     logger.info("SIGINT signal received: closing HTTP server");
     server.close(() => {
       logger.info("HTTP server closed");
       process.exit(0);
     });
   });

   process.on("SIGTERM", () => {
     logger.info("SIGTERM signal received: closing HTTP server");
     server.close(() => {
       logger.info("HTTP server closed");
       process.exit(0);
     });
   });
 } catch (error) {
   logger.error("Failed to start server:", error);
   process.exit(1);
 }
}

if (process.env.NODE_ENV !== "test") {
 startServer();
}

export default app;