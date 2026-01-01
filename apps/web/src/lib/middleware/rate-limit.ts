import type { Context, Next } from 'hono';

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};

interface RateLimitOptions {
  windowMs: number;
  maxRequests: number;
}

const defaultOptions: RateLimitOptions = {
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 100, // 100 requests per minute
};

/**
 * Rate limiting middleware
 */
export function rateLimit(options: Partial<RateLimitOptions> = {}) {
  const opts = { ...defaultOptions, ...options };

  return async (c: Context, next: Next) => {
    const key = c.req.header('x-forwarded-for') || 
                c.req.header('x-real-ip') || 
                'unknown';
    
    const now = Date.now();
    const record = store[key];

    // Clean up old entries periodically
    if (Math.random() < 0.01) {
      Object.keys(store).forEach((k) => {
        const entry = store[k];
        if (entry && entry.resetTime < now) {
          delete store[k];
        }
      });
    }

    if (!record || record.resetTime < now) {
      // New window
      store[key] = {
        count: 1,
        resetTime: now + opts.windowMs,
      };
      return next();
    }

    if (record && record.count >= opts.maxRequests) {
      const retryAfter = Math.ceil((record.resetTime - now) / 1000);
      return c.json(
        {
          error: 'RATE_LIMIT_EXCEEDED',
          message: `Rate limit exceeded. Try again in ${retryAfter} seconds.`,
          retryAfter,
        },
        429,
        {
          'Retry-After': retryAfter.toString(),
          'X-RateLimit-Limit': opts.maxRequests.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': new Date(record.resetTime).toISOString(),
        }
      );
    }

    if (record) {
      record.count++;
      c.header('X-RateLimit-Limit', opts.maxRequests.toString());
      c.header('X-RateLimit-Remaining', (opts.maxRequests - record.count).toString());
      c.header('X-RateLimit-Reset', new Date(record.resetTime).toISOString());
    }

    return next();
  };
}

