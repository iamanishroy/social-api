import { serve } from 'bun';
import { Hono } from 'hono';
import app from './api/index';
import { env } from './src/config/env';

const requestedPort = env.port;

/**
 * Checks if a port is available by attempting to bind to it
 */
async function isPortAvailable(port: number): Promise<boolean> {
  try {
    const server = Bun.serve({
      port,
      fetch: () => new Response(),
    });
    server.stop(true);
    return true;
  } catch {
    return false;
  }
}

/**
 * Finds an available port starting from the requested port
 */
async function findAvailablePort(startPort: number, maxAttempts: number = 10): Promise<number> {
  for (let i = 0; i < maxAttempts; i++) {
    const port = startPort + i;
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`Could not find an available port after ${maxAttempts} attempts starting from ${startPort}`);
}

async function startServer(): Promise<void> {
  try {
    const port = await findAvailablePort(requestedPort);
    
    if (port !== requestedPort) {
      console.warn(`⚠️  Port ${requestedPort} is in use, using port ${port} instead`);
    }
    
    const server = serve({
      fetch: app.fetch,
      port,
    });
    
    // Graceful shutdown
    const shutdown = () => {
      console.log('\n🛑 Shutting down gracefully...');
      server.stop();
      process.exit(0);
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
    
    console.log(`🚀 Server is running on port ${port}`);
    console.log(`📍 Environment: ${env.nodeEnv}`);
    console.log(`📍 API available at http://localhost:${port}/api`);
    console.log(`   Health check: http://localhost:${port}/api`);
    console.log(`   Tweet JSON: http://localhost:${port}/api/tweet?url=<tweet-url>`);
    console.log(`   Tweet HTML: http://localhost:${port}/tweet?url=<tweet-url>`);
    console.log(`   Tweet SVG: http://localhost:${port}/tweet-svg?url=<tweet-url>`);
  } catch (error) {
    console.error('❌ Failed to start server:', error instanceof Error ? error.message : error);
    console.error(`   Please free up port ${requestedPort} or set a different PORT environment variable.`);
    process.exit(1);
  }
}

startServer();

