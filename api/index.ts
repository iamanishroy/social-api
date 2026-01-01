import { Hono } from 'hono';
import { cors } from 'hono/cors';
import tweet from './tweet';
import { logger, rateLimit, securityHeaders, cacheControl } from '../src/middleware';
import { env } from '../src/config/env';

const app = new Hono();

// Apply middleware
app.use('/*', logger());
app.use('/*', securityHeaders());
app.use('/*', rateLimit({
  windowMs: env.rateLimitWindowMs,
  maxRequests: env.rateLimitMaxRequests,
}));

// Enable CORS
app.use('/*', cors({
  origin: env.nodeEnv === 'production' && process.env.ALLOWED_ORIGINS 
    ? process.env.ALLOWED_ORIGINS.split(',') 
    : '*',
  allowMethods: ['GET', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'X-Request-ID'],
  credentials: true,
}));

// Health check endpoint with caching
app.get('/', cacheControl({ maxAge: 60, public: true }), (c) => {
  return c.json({
    status: 'ok',
    service: 'Twitter Tweet API',
    version: '1.0.0',
    environment: env.nodeEnv,
    timestamp: new Date().toISOString(),
    endpoints: {
      tweet: '/api/tweet?url=<tweet-url>',
      health: '/api',
    },
  });
});

// Mount tweet endpoint
app.route('/tweet', tweet);

// 404 handler for unmatched routes
app.notFound((c) => {
  const requestId = (c as any).get?.('requestId') || 'unknown';
  return c.json({
    error: 'Not Found',
    message: `Route ${c.req.path} not found`,
    requestId,
    availableRoutes: {
      health: '/api',
      tweet: '/api/tweet?url=<tweet-url>',
    },
  }, 404);
});

export default app;

