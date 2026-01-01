/**
 * Vercel serverless function entry point
 * This file handles all API routes for Vercel deployment
 * 
 * Routes:
 * - GET /api - Health check
 * - GET /api/tweet?url=<tweet-url> - Fetch tweet data
 */
import app from './index';

export default app;

