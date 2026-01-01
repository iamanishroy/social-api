import { Hono } from 'hono';
import { cors } from 'hono/cors';
import fs from 'fs/promises';
import path from 'path';
import tweet from '../src/routers/tweet';
import tweetHtml from '../src/routers/tweet-html';
import tweetSvg from '../src/routers/tweet-svg';
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

// Health check endpoint (JSON)
app.get('/health', cacheControl({ maxAge: 60, public: true }), (c) => {
  return c.json({
    status: 'ok',
    service: 'Twitter Tweet API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// Serve landing page from static file
app.get('/', cacheControl({ maxAge: 3600, public: true }), async (c) => {
  try {
    const htmlPath = path.resolve(process.cwd(), 'public/index.html');
    const html = await fs.readFile(htmlPath, 'utf-8');
    return c.html(html);
  } catch (e) {
    return c.text('Social API - Documentation', 200);
  }
});

app.get('/index.html', (c) => c.redirect('/'));

// Mount endpoints
app.route('/api/tweet', tweet);
app.route('/tweet', tweetHtml);
app.route('/tweet-svg', tweetSvg);

// Fallback for /api to health check
app.get('/api', (c) => c.redirect('/health'));

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

