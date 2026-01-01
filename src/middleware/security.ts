import type { Context, Next } from 'hono';

/**
 * Security headers middleware
 */
export function securityHeaders() {
  return async (c: Context, next: Next) => {
    await next();

    // Security headers
    c.header('X-Content-Type-Options', 'nosniff');
    c.header('X-Frame-Options', 'DENY');
    c.header('X-XSS-Protection', '1; mode=block');
    c.header('Referrer-Policy', 'strict-origin-when-cross-origin');
    c.header('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
    
    // Only add CSP for HTML responses
    const contentType = c.res.headers.get('content-type');
    if (contentType?.includes('text/html')) {
      c.header(
        'Content-Security-Policy',
        "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:;"
      );
    }

    return;
  };
}

