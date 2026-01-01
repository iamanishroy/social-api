import { Hono } from 'hono';
import { cors } from 'hono/cors';
import tweet from './tweet';

const app = new Hono();

// Enable CORS
app.use('/*', cors({
  origin: '*',
  allowMethods: ['GET', 'OPTIONS'],
  allowHeaders: ['Content-Type'],
}));

// Health check endpoint
app.get('/', (c) => {
  return c.json({
    status: 'ok',
    service: 'Twitter Tweet API',
    version: '1.0.0',
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
  return c.json({
    error: 'Not Found',
    message: `Route ${c.req.path} not found`,
    availableRoutes: {
      health: '/api',
      tweet: '/api/tweet?url=<tweet-url>',
    },
  }, 404);
});

export default app;

