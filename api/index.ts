import { Hono } from 'hono';
import { cors } from 'hono/cors';
import tweet from '../src/routers/tweet';
import tweetHtml from '../src/routers/tweet-html';
import tweetSvg from '../src/routers/tweet-svg';
import { logger, rateLimit, securityHeaders, cacheControl } from '../src/middleware';
import { env } from '../src/config/env';

const LANDING_HTML = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Social API — Docs</title>
    <style>
      :root {
        --bg: #ffffff;
        --fg: #000000;
        --acc: #666666;
        --code-bg: #f5f5f5;
        --border: #eaeaea;
      }

      @media (prefers-color-scheme: dark) {
        :root {
          --bg: #000000;
          --fg: #ffffff;
          --acc: #a1a1a1;
          --code-bg: #111111;
          --border: #333333;
        }
      }

      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      body {
        font-family: -apple-system, BlinkMacSystemFont, "Inter", "Segoe UI",
          Roboto, sans-serif;
        background-color: var(--bg);
        color: var(--fg);
        line-height: 1.6;
        padding: 40px 20px;
        max-width: 650px;
        margin: 0 auto;
        word-wrap: break-word;
      }

      header {
        margin-bottom: 60px;
      }
      h1 {
        font-size: 18px;
        font-weight: 600;
        margin-bottom: 8px;
        letter-spacing: -0.02em;
      }
      p.desc {
        color: var(--acc);
        font-size: 14px;
      }

      section {
        margin-bottom: 48px;
      }
      h2 {
        font-size: 14px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        margin-bottom: 16px;
        color: var(--acc);
      }

      .endpoint {
        margin-bottom: 32px;
      }
      .method-path {
        display: flex;
        align-items: baseline;
        gap: 8px;
        margin-bottom: 8px;
      }
      .method {
        font-size: 11px;
        font-weight: 700;
        padding: 2px 4px;
        border: 1px solid var(--fg);
      }
      .path {
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
          monospace;
        font-size: 14px;
        font-weight: 600;
      }
      .info {
        font-size: 14px;
        margin-bottom: 12px;
      }

      pre {
        background: var(--code-bg);
        padding: 16px;
        border: 1px solid var(--border);
        border-radius: 4px;
        overflow-x: auto;
        margin-bottom: 12px;
      }
      code {
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
          monospace;
        font-size: 13px;
      }

      .param {
        font-size: 13px;
        color: var(--acc);
        margin-top: 4px;
      }
      .param span {
        color: var(--fg);
        font-weight: 500;
      }

      footer {
        margin-top: 80px;
        padding-top: 24px;
        border-top: 1px solid var(--border);
        font-size: 12px;
        color: var(--acc);
        display: flex;
        justify-content: space-between;
      }
      a {
        color: var(--fg);
        text-decoration: none;
        border-bottom: 1px solid var(--border);
        transition: border-color 0.2s;
      }
      a:hover {
        border-color: var(--fg);
      }

      @media (max-width: 480px) {
        body {
          padding: 30px 15px;
        }
        header {
          margin-bottom: 40px;
        }
      }
    </style>
  </head>
  <body>
    <header>
      <h1>Social API</h1>
      <p class="desc">
        A high-performance, minimalist API for fetching Twitter/X tweet data,
        HTML renders, and SVG snapshots.
      </p>
    </header>

    <section id="endpoints">
      <h2>Endpoints</h2>

      <div class="endpoint">
        <div class="method-path">
          <span class="method">GET</span>
          <span class="path">/api/tweet</span>
        </div>
        <p class="info">Returns complete tweet data in JSON format.</p>
        <pre><code>curl "https://social-api.anishroy.com/api/tweet?url={TWEET_URL}"</code></pre>
        <p class="param">
          query <span>url</span> — The full Twitter/X status URL.
        </p>
      </div>

      <div class="endpoint">
        <div class="method-path">
          <span class="method">GET</span>
          <span class="path">/tweet</span>
        </div>
        <p class="info">Returns a clean HTML render of the tweet.</p>
        <pre><code>https://social-api.anishroy.com/tweet?url={TWEET_URL}</code></pre>
      </div>

      <div class="endpoint">
        <div class="method-path">
          <span class="method">GET</span>
          <span class="path">/tweet-svg</span>
        </div>
        <p class="info">Returns a vector SVG capture of the tweet.</p>
        <pre><code>https://social-api.anishroy.com/tweet-svg?url={TWEET_URL}</code></pre>
      </div>
    </section>

    <section id="examples">
      <h2>Example Status</h2>
      <p class="info" style="font-size: 14px; margin-bottom: 8px">
        Try it out with a real tweet:
      </p>
      <a
        href="/api/tweet?url=https://x.com/iamanishroy/status/1595377607071121410"
        style="font-size: 13px; font-family: monospace"
        >/api/tweet?url=https://x.com/iamanishroy/status/1595377607071121410</a
      >
    </section>

    <footer>
      <span>Built by <a href="https://anishroy.com">Anish Roy</a></span>
      <span
        ><a href="https://github.com/iamanishroy/social-api">Source</a></span
      >
    </footer>
  </body>
</html>`;

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
const healthHandler = (c: any) => {
  return c.json({
    status: 'ok',
    service: 'Twitter Tweet API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
};

app.get('/health', cacheControl({ maxAge: 60, public: true }), healthHandler);
app.get('/api/health', cacheControl({ maxAge: 60, public: true }), healthHandler);

// Root landing page
const landingHandler = (c: any) => {
  return c.html(LANDING_HTML);
};

app.get('/', cacheControl({ maxAge: 3600, public: true }), landingHandler);
app.get('/api', cacheControl({ maxAge: 3600, public: true }), landingHandler);
app.get('/index.html', (c) => c.redirect('/'));

// Mount JSON API
app.route('/api/tweet', tweet);
app.route('/api/tweet-json', tweet);

// Mount HTML View
app.route('/tweet', tweetHtml);
app.route('/tweet-html', tweetHtml);
app.route('/api/tweet-html', tweetHtml);

// Mount SVG View
app.route('/tweet-svg', tweetSvg);
app.route('/api/tweet-svg', tweetSvg);

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

