"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const auth_1 = require("./middleware/auth");
const error_1 = require("./middleware/error");
const idempotency_1 = require("./middleware/idempotency");
const health_1 = require("./routes/health");
const metrics_1 = require("./routes/metrics");
const openapi_1 = require("./routes/openapi");
const auth_2 = require("./routes/auth");
const rate_limiter_1 = require("./utils/rate-limiter");
const db_1 = require("./db");
const config_1 = require("./config");
const logger_1 = require("./utils/logger");
const uuid_1 = require("uuid");
const data_retention_1 = require("./jobs/data-retention");
const materialized_view_refresh_1 = require("./jobs/materialized-view-refresh");
const webhook_queue_1 = require("./utils/webhook-queue");
const versioning_1 = require("./middleware/versioning");
const v1_1 = require("./routes/v1");
const v2_1 = require("./routes/v2");
const reconciliation_summary_1 = require("./routes/reconciliation-summary");
const SecretsManager_1 = require("./infrastructure/security/SecretsManager");
const tracing_1 = require("./infrastructure/observability/tracing");
const compression_1 = require("./middleware/compression");
const observability_1 = require("./middleware/observability");
const graceful_shutdown_1 = require("./utils/graceful-shutdown");
const request_timeout_1 = require("./middleware/request-timeout");
const sentry_1 = require("./middleware/sentry");
const app = (0, express_1.default)();
const PORT = config_1.config.port;
// Initialize Sentry before other middleware
(0, sentry_1.initializeSentry)();
// Sentry request and tracing handlers (must be first)
app.use((0, sentry_1.sentryRequestHandler)());
app.use((0, sentry_1.sentryTracingHandler)());
// Security middleware
app.use((0, helmet_1.default)({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
        },
    },
}));
app.use((0, cors_1.default)({
    origin: config_1.config.allowedOrigins,
    credentials: true,
}));
// Compression middleware (Gzip and Brotli)
app.use(compression_1.compressionMiddleware);
app.use(compression_1.brotliCompressionMiddleware);
// Observability middleware (tracing, metrics, logging)
app.use(observability_1.observabilityMiddleware);
// Request timeout middleware (must be before routes)
if (config_1.config.features.enableRequestTimeout) {
    app.use((req, res, next) => {
        const timeout = (0, request_timeout_1.getRequestTimeout)(req.path, req.method);
        return (0, request_timeout_1.requestTimeoutMiddleware)(timeout)(req, res, next);
    });
}
// Trace ID middleware
app.use((req, res, next) => {
    const traceId = req.headers['x-trace-id'] || (0, uuid_1.v4)();
    req.traceId = traceId;
    res.setHeader('X-Trace-Id', traceId);
    next();
});
// Global IP-based rate limiting (backup)
const ipLimiter = (0, express_rate_limit_1.default)({
    windowMs: config_1.config.rateLimiting.windowMs,
    max: 1000, // Higher limit for legitimate users
    message: "Too many requests from this IP, please try again later.",
    standardHeaders: true,
    legacyHeaders: false,
});
app.use("/api/", ipLimiter);
// Body parsing with size and depth limits
function countDepth(obj, current = 0) {
    if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) {
        return current;
    }
    const depths = Object.values(obj).map(v => countDepth(v, current + 1));
    return Math.max(current, ...depths);
}
app.use(express_1.default.json({
    limit: "1mb", // Reduced from 10mb
    verify: (req, res, buf) => {
        try {
            const parsed = JSON.parse(buf.toString());
            const depth = countDepth(parsed);
            if (depth > 20) {
                throw new Error('JSON depth exceeds maximum of 20 levels');
            }
        }
        catch (error) {
            if (error instanceof Error && error.message.includes('depth')) {
                throw error;
            }
            // Ignore JSON parse errors, let express handle them
        }
    },
}));
app.use(express_1.default.urlencoded({ extended: true, limit: "1mb" }));
// Initialize tracing
(0, tracing_1.initializeTracing)();
// Validate secrets at startup (production and preview)
if (config_1.config.nodeEnv === 'production' || config_1.config.nodeEnv === 'preview') {
    try {
        SecretsManager_1.SecretsManager.validateSecrets(SecretsManager_1.REQUIRED_SECRETS);
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error('Secret validation failed:', message);
        process.exit(1);
    }
}
// Health check (no auth required)
app.use("/health", health_1.healthRouter);
// Metrics endpoint (no auth required, but should be protected in production)
app.use("/metrics", metrics_1.metricsRouter);
// API Documentation (no auth required)
app.use("/api/v1", openapi_1.openApiRouter);
// API versioning middleware
app.use("/api", versioning_1.versionMiddleware);
// Idempotency middleware for state-changing operations
app.use("/api/v1", (0, idempotency_1.idempotencyMiddleware)());
app.use("/api/v2", (0, idempotency_1.idempotencyMiddleware)());
// Rate limiting per API key
app.use("/api/v1", auth_1.authMiddleware, (0, rate_limiter_1.rateLimitMiddleware)());
app.use("/api/v2", auth_1.authMiddleware, (0, rate_limiter_1.rateLimitMiddleware)());
// Auth routes (no auth required for login/refresh)
app.use("/api/v1/auth", auth_2.authRouter);
app.use("/api/v2/auth", auth_2.authRouter);
// Versioned API routes
app.use("/api/v1", auth_1.authMiddleware, v1_1.v1Router);
app.use("/api/v2", auth_1.authMiddleware, v2_1.v2Router);
// Optimized reconciliation summary endpoint
app.use("/api/v1/reconciliations", auth_1.authMiddleware, reconciliation_summary_1.reconciliationSummaryRouter);
// Sentry error handler (before custom error handler)
app.use((0, sentry_1.sentryErrorHandler)());
// Error handling
app.use(error_1.errorHandler);
// 404 handler
app.use((req, res) => {
    res.status(404).json({
        error: "Not Found",
        message: `Cannot ${req.method} ${req.path}`,
    });
});
// Initialize database on startup
async function startServer() {
    try {
        await (0, db_1.initDatabase)();
        (0, logger_1.logInfo)('Database initialized');
        // Start background jobs
        (0, data_retention_1.startDataRetentionJob)();
        (0, materialized_view_refresh_1.startMaterializedViewRefreshJob)();
        // Process pending webhooks every minute
        const webhookInterval = setInterval(() => {
            (0, webhook_queue_1.processPendingWebhooks)().catch(error => {
                (0, logger_1.logError)('Failed to process pending webhooks', error);
            });
        }, 60000);
        // Register webhook interval cleanup
        (0, graceful_shutdown_1.registerShutdownHandler)(async () => {
            clearInterval(webhookInterval);
            (0, logger_1.logInfo)('Webhook processing stopped');
        });
        const server = app.listen(PORT, () => {
            (0, logger_1.logInfo)(`Settler API server running on port ${PORT}`, { port: PORT });
        });
        // Setup graceful shutdown handlers
        (0, graceful_shutdown_1.setupSignalHandlers)(server, {
            timeout: 30000, // 30 seconds
            onShutdown: async () => {
                (0, logger_1.logInfo)('Custom shutdown tasks completed');
            },
        });
        return server;
    }
    catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}
// Start server
if (require.main === module) {
    startServer();
}
exports.default = app;
//# sourceMappingURL=index.js.map