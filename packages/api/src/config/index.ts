export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    name: process.env.DB_NAME || 'settler',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    accessTokenExpiry: process.env.JWT_ACCESS_EXPIRY || '15m',
    refreshTokenExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',
    refreshSecret: process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
  },
  encryption: {
    algorithm: 'aes-256-gcm',
    key: process.env.ENCRYPTION_KEY, // 32-byte key for AES-256
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    url: process.env.REDIS_URL,
  },
  rateLimiting: {
    defaultLimit: parseInt(process.env.RATE_LIMIT_DEFAULT || '1000', 10),
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
  },
  webhook: {
    maxRetries: parseInt(process.env.WEBHOOK_MAX_RETRIES || '5', 10),
    initialDelay: parseInt(process.env.WEBHOOK_INITIAL_DELAY || '2000', 10),
    maxDelay: parseInt(process.env.WEBHOOK_MAX_DELAY || '32000', 10),
  },
  dataRetention: {
    defaultDays: parseInt(process.env.DATA_RETENTION_DAYS || '365', 10),
  },
  allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',') || ['*'],
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    samplingRate: parseFloat(process.env.LOG_SAMPLING_RATE || '1.0'),
  },
  observability: {
    serviceName: process.env.SERVICE_NAME || 'settler-api',
    otlpEndpoint: process.env.OTLP_ENDPOINT,
    jaegerEndpoint: process.env.JAEGER_ENDPOINT,
  },
  features: {
    enableSchemaPerTenant: process.env.ENABLE_SCHEMA_PER_TENANT === 'true',
  },
};

// Validate critical configuration
if (config.nodeEnv === 'production') {
  if (!config.jwt.secret || config.jwt.secret === 'your-secret-key-change-in-production') {
    throw new Error('JWT_SECRET must be set to a secure random value in production');
  }
  if (!config.encryption.key) {
    throw new Error('ENCRYPTION_KEY must be set in production');
  }
  if (config.allowedOrigins.includes('*')) {
    console.warn('WARNING: CORS allows all origins in production');
  }
}
