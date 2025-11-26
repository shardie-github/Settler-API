import express, { Express, Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { authMiddleware, AuthRequest } from "./middleware/auth";
import { errorHandler } from "./middleware/error";
import { validateRequest } from "./middleware/validation";
import { idempotencyMiddleware } from "./middleware/idempotency";
import { jobsRouter } from "./routes/jobs";
import { reportsRouter } from "./routes/reports";
import { webhooksRouter } from "./routes/webhooks";
import { adaptersRouter } from "./routes/adapters";
import { healthRouter } from "./routes/health";
import { metricsRouter } from "./routes/metrics";
import { usersRouter } from "./routes/users";
import { authRouter } from "./routes/auth";
import { rateLimitMiddleware } from "./utils/rate-limiter";
import { initDatabase } from "./db";
import { config } from "./config";
import { logInfo } from "./utils/logger";
import { v4 as uuidv4 } from "uuid";
import { startDataRetentionJob } from "./jobs/data-retention";
import { processPendingWebhooks } from "./utils/webhook-queue";

const app: Express = express();
const PORT = config.port;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

app.use(cors({
  origin: config.allowedOrigins,
  credentials: true,
}));

// Trace ID middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const traceId = (req.headers['x-trace-id'] as string) || uuidv4();
  (req as AuthRequest).traceId = traceId;
  res.setHeader('X-Trace-Id', traceId);
  next();
});

// Global IP-based rate limiting (backup)
const ipLimiter = rateLimit({
  windowMs: config.rateLimiting.windowMs,
  max: 1000, // Higher limit for legitimate users
  message: "Too many requests from this IP, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

app.use("/api/", ipLimiter);

// Body parsing with size and depth limits
function countDepth(obj: any, current = 0): number {
  if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) {
    return current;
  }
  const depths = Object.values(obj).map(v => countDepth(v, current + 1));
  return Math.max(current, ...depths);
}

app.use(express.json({
  limit: "1mb", // Reduced from 10mb
  verify: (req, res, buf) => {
    try {
      const parsed = JSON.parse(buf.toString());
      const depth = countDepth(parsed);
      if (depth > 20) {
        throw new Error('JSON depth exceeds maximum of 20 levels');
      }
    } catch (error: any) {
      if (error.message.includes('depth')) {
        throw error;
      }
      // Ignore JSON parse errors, let express handle them
    }
  },
}));

app.use(express.urlencoded({ extended: true, limit: "1mb" }));

// Health check (no auth required)
app.use("/health", healthRouter);

// Metrics endpoint (no auth required, but should be protected in production)
app.use("/metrics", metricsRouter);

// Idempotency middleware for state-changing operations
app.use("/api/v1", idempotencyMiddleware());

// Rate limiting per API key
app.use("/api/v1", authMiddleware, rateLimitMiddleware());

// Auth routes (no auth required for login/refresh)
app.use("/api/v1/auth", authRouter);

// API routes (auth required)
app.use("/api/v1/jobs", authMiddleware, jobsRouter);
app.use("/api/v1/reports", authMiddleware, reportsRouter);
app.use("/api/v1/webhooks", authMiddleware, webhooksRouter);
app.use("/api/v1/adapters", authMiddleware, adaptersRouter);
app.use("/api/v1/users", authMiddleware, usersRouter);

// Error handling
app.use(errorHandler);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: "Not Found",
    message: `Cannot ${req.method} ${req.path}`,
  });
});

// Initialize database on startup
async function startServer() {
  try {
    await initDatabase();
    logInfo('Database initialized');
    
    // Start background jobs
    startDataRetentionJob();
    
    // Process pending webhooks every minute
    setInterval(() => {
      processPendingWebhooks().catch(error => {
        logError('Failed to process pending webhooks', error);
      });
    }, 60000);
    
    app.listen(PORT, () => {
      logInfo(`Settler API server running on port ${PORT}`, { port: PORT });
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start server
if (require.main === module) {
  startServer();
}

export default app;
