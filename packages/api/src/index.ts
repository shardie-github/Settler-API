import express, { Express, Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { authMiddleware } from "./middleware/auth";
import { errorHandler } from "./middleware/error";
import { validateRequest } from "./middleware/validation";
import { jobsRouter } from "./routes/jobs";
import { reportsRouter } from "./routes/reports";
import { webhooksRouter } from "./routes/webhooks";
import { adaptersRouter } from "./routes/adapters";
import { healthRouter } from "./routes/health";

const app: Express = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(",") || "*",
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
});
app.use("/api/", limiter);

// Body parsing
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Health check (no auth required)
app.use("/health", healthRouter);

// API routes (auth required)
app.use("/api/v1/jobs", authMiddleware, jobsRouter);
app.use("/api/v1/reports", authMiddleware, reportsRouter);
app.use("/api/v1/webhooks", authMiddleware, webhooksRouter);
app.use("/api/v1/adapters", authMiddleware, adaptersRouter);

// Error handling
app.use(errorHandler);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: "Not Found",
    message: `Cannot ${req.method} ${req.path}`,
  });
});

// Start server
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 Reconcilify API server running on port ${PORT}`);
    console.log(`📚 API docs: http://localhost:${PORT}/api/v1/docs`);
  });
}

export default app;
