/**
 * Environment variable configuration
 */

export interface EnvConfig {
  port: number;
  nodeEnv: 'development' | 'production' | 'test';
  rateLimitWindowMs: number;
  rateLimitMaxRequests: number;
  cacheMaxAge: number;
  apiTimeout: number;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}

/**
 * Loads and validates environment variables
 */
export function loadEnv(): EnvConfig {
  const port = Number(process.env.PORT) || 7000;
  const nodeEnv = (process.env.NODE_ENV || 'development') as EnvConfig['nodeEnv'];
  const rateLimitWindowMs = Number(process.env.RATE_LIMIT_WINDOW_MS) || 60 * 1000;
  const rateLimitMaxRequests = Number(process.env.RATE_LIMIT_MAX_REQUESTS) || 100;
  const cacheMaxAge = Number(process.env.CACHE_MAX_AGE) || 3600;
  const apiTimeout = Number(process.env.API_TIMEOUT) || 10000;
  const logLevel = (process.env.LOG_LEVEL || 'info') as EnvConfig['logLevel'];

  return {
    port,
    nodeEnv,
    rateLimitWindowMs,
    rateLimitMaxRequests,
    cacheMaxAge,
    apiTimeout,
    logLevel,
  };
}

export const env = loadEnv();

