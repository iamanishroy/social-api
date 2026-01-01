import { Hono } from 'hono';
import { cors } from 'hono/cors';
import tweet from './routers/tweet';
import tweetHtml from './routers/tweet-html';
import tweetSvg from './routers/tweet-svg';
import { logger, rateLimit, securityHeaders, cacheControl } from './middleware';

// Initialize Hono app
const app = new Hono().basePath('/api');

// Apply middleware
app.use('/*', logger());
app.use('/*', securityHeaders());

// Health check endpoint (JSON)
const healthHandler = (c: any) => {
  return c.json({
    status: 'ok',
    service: 'Social API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
};

app.get('/health', cacheControl({ maxAge: 60, public: true }), healthHandler);

// Mount JSON API
app.route('/tweet', tweet);
app.route('/tweet-json', tweet);

// Mount HTML View
app.route('/tweet-html', tweetHtml);

// Mount SVG View
app.route('/tweet-svg', tweetSvg);

// 404 handler
app.notFound((c) => {
  const requestId = (c as any).get?.('requestId') || 'unknown';
  return c.json({
    error: 'Not Found',
    message: 'Route ' + c.req.path + ' not found',
    requestId,
    availableRoutes: {
      health: '/api/health',
      tweetJson: '/api/tweet?url=<tweet-url>',
      tweetHtml: '/api/tweet-html?url=<tweet-url>',
      tweetSvg: '/api/tweet-svg?url=<tweet-url>',
    },
  }, 404);
});

export default app;
