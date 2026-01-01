import type { Context, Next } from 'hono';

interface CacheOptions {
  maxAge: number;
  staleWhileRevalidate?: number;
  public?: boolean;
}

/**
 * Cache control middleware
 */
export function cacheControl(options: CacheOptions) {
  const { maxAge, staleWhileRevalidate, public: isPublic = true } = options;

  return async (c: Context, next: Next) => {
    await next();

    const directives: string[] = [];
    
    if (isPublic) {
      directives.push('public');
    } else {
      directives.push('private');
    }

    directives.push(`max-age=${maxAge}`);

    if (staleWhileRevalidate) {
      directives.push(`stale-while-revalidate=${staleWhileRevalidate}`);
    }

    c.header('Cache-Control', directives.join(', '));
    
    // Add ETag support
    const etag = `"${Date.now()}-${c.req.path}"`;
    c.header('ETag', etag);

    // Handle If-None-Match
    const ifNoneMatch = c.req.header('If-None-Match');
    if (ifNoneMatch === etag) {
      return c.body(null, 304);
    }

    return;
  };
}

