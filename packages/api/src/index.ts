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
import { openApiRouter } from "./routes/openapi";
import { usersRouter } from "./routes/users";
import { authRouter } from "./routes/auth";
import { apiKeysRouter } from "./routes/api-keys";
import { exceptionsRouter } from "./routes/exceptions";
import { testModeRouter } from "./routes/test-mode";
import { dashboardsRouter } from "./routes/dashboards";
import { feedbackRouter } from "./routes/feedback";
import { alertsRouter } from "./routes/alerts";
import { adapterTestRouter } from "./routes/adapter-test";
import { reportsEnhancedRouter } from "./routes/reports-enhanced";
import { confidenceRouter } from "./routes/confidence";
import { reconciliationStatusRouter } from "./routes/reconciliation-status";
import { rulesEditorRouter } from "./routes/rules-editor";
import { playgroundRouter } from "./routes/playground";
import { cliWizardRouter } from "./routes/cli-wizard";
import { exportEnhancedRouter } from "./routes/export-enhanced";
import { aiAssistantRouter } from "./routes/ai-assistant";
import { auditTrailRouter } from "./routes/audit-trail";
import { testModeMiddleware, validateTestMode } from "./middleware/test-mode";
import { rateLimitMiddleware } from "./utils/rate-limiter";
import { initDatabase } from "./db";
import { config } from "./config";
import { logInfo, logError } from "./utils/logger";
import { v4 as uuidv4 } from "uuid";
import { startDataRetentionJob } from "./jobs/data-retention";
import { startMaterializedViewRefreshJob } from "./jobs/materialized-view-refresh";
import { processPendingWebhooks } from "./utils/webhook-queue";
import { versionMiddleware } from "./middleware/versioning";
import { v1Router } from "./routes/v1";
import { v2Router } from "./routes/v2";
import { reconciliationSummaryRouter } from "./routes/reconciliation-summary";
import { SecretsManager, REQUIRED_SECRETS } from "./infrastructure/security/SecretsManager";
import { initializeTracing } from "./infrastructure/observability/tracing";
import { compressionMiddleware, brotliCompressionMiddleware } from "./middleware/compression";
import { etagMiddleware } from "./middleware/etag";
import { observabilityMiddleware } from "./middleware/observability";
import { eventTrackingMiddleware } from "./middleware/event-tracking";
import { setupSignalHandlers, registerShutdownHandler } from "./utils/graceful-shutdown";
import { requestTimeoutMiddleware, getRequestTimeout } from "./middleware/request-timeout";
import { initializeSentry, sentryRequestHandler, sentryTracingHandler, sentryErrorHandler } from "./middleware/sentry";

const app: Express = express();
const PORT = config.port;

// Initialize Sentry before other middleware
initializeSentry();

// Sentry request and tracing handlers (must be first)
app.use(sentryRequestHandler());
app.use(sentryTracingHandler());

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

// Compression middleware (Gzip and Brotli)
app.use(compressionMiddleware);
app.use(brotliCompressionMiddleware);

// Observability middleware (tracing, metrics, logging)
app.use(observabilityMiddleware);

// Event tracking middleware (for analytics)
app.use("/api", eventTrackingMiddleware);

// Request timeout middleware (must be before routes)
if (config.features.enableRequestTimeout) {
  app.use((req: Request, res: Response, next: NextFunction) => {
    const timeout = getRequestTimeout(req.path, req.method);
    return requestTimeoutMiddleware(timeout)(req, res, next);
  });
}

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
function countDepth(obj: unknown, current = 0): number {
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
    } catch (error: unknown) {
      if (error instanceof Error && error.message.includes('depth')) {
        throw error;
      }
      // Ignore JSON parse errors, let express handle them
    }
  },
}));

app.use(express.urlencoded({ extended: true, limit: "1mb" }));

// Initialize tracing
initializeTracing();

// Validate secrets at startup (production and preview)
if (config.nodeEnv === 'production' || config.nodeEnv === 'preview') {
  try {
    SecretsManager.validateSecrets(REQUIRED_SECRETS);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Secret validation failed:', message);
    process.exit(1);
  }
}

// Health check (no auth required)
app.use("/health", healthRouter);

// Metrics endpoint (no auth required, but should be protected in production)
app.use("/metrics", metricsRouter);

// API Documentation (no auth required)
app.use("/api/v1", openApiRouter);

// API versioning middleware
app.use("/api", versionMiddleware);

// Idempotency middleware for state-changing operations
app.use("/api/v1", idempotencyMiddleware());
app.use("/api/v2", idempotencyMiddleware());

// Rate limiting per API key
app.use("/api/v1", authMiddleware, rateLimitMiddleware());
app.use("/api/v2", authMiddleware, rateLimitMiddleware());

// Test mode middleware (after auth, before routes)
app.use("/api/v1", authMiddleware, testModeMiddleware);
app.use("/api/v2", authMiddleware, testModeMiddleware);
app.use("/api/v1", authMiddleware, validateTestMode);
app.use("/api/v2", authMiddleware, validateTestMode);

// Auth routes (no auth required for login/refresh)
app.use("/api/v1/auth", authRouter);
app.use("/api/v2/auth", authRouter);

// API Keys routes (requires auth)
app.use("/api/v1", authMiddleware, apiKeysRouter);
app.use("/api/v2", authMiddleware, apiKeysRouter);

// Exceptions routes (requires auth)
app.use("/api/v1", authMiddleware, exceptionsRouter);
app.use("/api/v2", authMiddleware, exceptionsRouter);

// Test mode routes (requires auth)
app.use("/api/v1", authMiddleware, testModeRouter);
app.use("/api/v2", authMiddleware, testModeRouter);

// Dashboard routes (requires auth)
app.use("/api/v1", authMiddleware, dashboardsRouter);
app.use("/api/v2", authMiddleware, dashboardsRouter);

// Feedback routes (requires auth)
app.use("/api/v1", authMiddleware, feedbackRouter);
app.use("/api/v2", authMiddleware, feedbackRouter);

// Alert routes (requires auth)
app.use("/api/v1", authMiddleware, alertsRouter);
app.use("/api/v2", authMiddleware, alertsRouter);

// Adapter test routes (requires auth)
app.use("/api/v1", authMiddleware, adapterTestRouter);
app.use("/api/v2", authMiddleware, adapterTestRouter);

// Enhanced reports routes (requires auth)
app.use("/api/v1", authMiddleware, reportsEnhancedRouter);
app.use("/api/v2", authMiddleware, reportsEnhancedRouter);

// Confidence score routes (requires auth)
app.use("/api/v1", authMiddleware, confidenceRouter);
app.use("/api/v2", authMiddleware, confidenceRouter);

// Reconciliation status routes (requires auth)
app.use("/api/v1", authMiddleware, reconciliationStatusRouter);
app.use("/api/v2", authMiddleware, reconciliationStatusRouter);

// Rules editor routes (requires auth)
app.use("/api/v1", authMiddleware, rulesEditorRouter);
app.use("/api/v2", authMiddleware, rulesEditorRouter);

// Playground routes (no auth, rate-limited)
app.use("/api/v1/playground", playgroundRouter);
app.use("/api/v2/playground", playgroundRouter);

// CLI wizard routes (requires auth)
app.use("/api/v1", authMiddleware, cliWizardRouter);
app.use("/api/v2", authMiddleware, cliWizardRouter);

// Enhanced export routes (requires auth)
app.use("/api/v1", authMiddleware, exportEnhancedRouter);
app.use("/api/v2", authMiddleware, exportEnhancedRouter);

// AI assistant routes (requires auth)
app.use("/api/v1", authMiddleware, aiAssistantRouter);
app.use("/api/v2", authMiddleware, aiAssistantRouter);

// Audit trail routes (requires auth)
app.use("/api/v1", authMiddleware, auditTrailRouter);
app.use("/api/v2", authMiddleware, auditTrailRouter);

// Versioned API routes
app.use("/api/v1", authMiddleware, v1Router);
app.use("/api/v2", authMiddleware, v2Router);

// Optimized reconciliation summary endpoint
app.use("/api/v1/reconciliations", authMiddleware, reconciliationSummaryRouter);

// Sentry error handler (before custom error handler)
app.use(sentryErrorHandler());

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
    startMaterializedViewRefreshJob();
    
    // Process pending webhooks every minute
    const webhookInterval = setInterval(() => {
      processPendingWebhooks().catch(error => {
        logError('Failed to process pending webhooks', error);
      });
    }, 60000);
    
    // Register webhook interval cleanup
    registerShutdownHandler(async () => {
      clearInterval(webhookInterval);
      logInfo('Webhook processing stopped');
    });
    
    const server = app.listen(PORT, () => {
      logInfo(`Settler API server running on port ${PORT}`, { port: PORT });
    });
    
    // Setup graceful shutdown handlers
    setupSignalHandlers(server, {
      timeout: 30000, // 30 seconds
      onShutdown: async () => {
        logInfo('Custom shutdown tasks completed');
      },
    });
    
    return server;
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
