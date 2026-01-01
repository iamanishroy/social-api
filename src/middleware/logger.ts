import type { Context, Next } from 'hono';

interface LogData {
  method: string;
  path: string;
  status: number;
  duration: number;
  ip?: string;
  userAgent?: string;
  requestId?: string;
}

/**
 * Request logging middleware
 */
export function logger() {
  return async (c: Context, next: Next) => {
    const start = Date.now();
    const requestId = crypto.randomUUID();
    
    // Add request ID to context (using any to bypass Hono's strict typing)
    (c as any).set('requestId', requestId);
    c.header('X-Request-ID', requestId);

    await next();

    const duration = Date.now() - start;
    const logData: LogData = {
      method: c.req.method,
      path: c.req.path,
      status: c.res.status,
      duration,
      ip: c.req.header('x-forwarded-for') || c.req.header('x-real-ip'),
      userAgent: c.req.header('user-agent'),
      requestId,
    };

    // Log in production-friendly format
    const logMessage = JSON.stringify({
      timestamp: new Date().toISOString(),
      level: logData.status >= 500 ? 'error' : logData.status >= 400 ? 'warn' : 'info',
      ...logData,
    });

    console.log(logMessage);

    return;
  };
}

