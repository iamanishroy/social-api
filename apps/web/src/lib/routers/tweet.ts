import { Hono } from 'hono';
import { InvalidUrlError, TweetNotFoundError, ApiError, TimeoutError } from '@social-api/twitter';
import { getCachedTweetData } from '../services/twitter';
import { cacheControl } from '../middleware';
import { env } from '../config/env';

const app = new Hono();

/**
 * GET /api/tweet
 * 
 * Query parameters:
 * - url: The tweet URL (required)
 * 
 * Example: /api/tweet?url=https://x.com/username/status/1234567890
 */
app.get('/', cacheControl({ maxAge: env.cacheMaxAge, public: true }), async (c) => {
  const url = c.req.query('url');

  if (!url) {
    return c.json(
      {
        error: 'Missing required parameter: url',
        message: 'Please provide a tweet URL as a query parameter',
        example: '/api/tweet?url=https://x.com/username/status/1234567890',
      },
      400
    );
  }

  try {
    const tweet = await getCachedTweetData(url);

    return c.json({
      success: true,
      data: tweet,
    });
  } catch (error: any) {
    if (error instanceof InvalidUrlError || error.name === 'InvalidUrlError' || error.code === 'INVALID_URL') {
      return c.json(
        {
          success: false,
          error: 'INVALID_URL',
          message: error.message,
        },
        400
      );
    }

    if (error instanceof TweetNotFoundError || error.name === 'TweetNotFoundError' || error.code === 'TWEET_NOT_FOUND') {
      return c.json(
        {
          success: false,
          error: 'TWEET_NOT_FOUND',
          message: error.message,
        },
        404
      );
    }

    if (error instanceof TimeoutError || error.name === 'TimeoutError' || error.code === 'TIMEOUT') {
      return c.json(
        {
          success: false,
          error: 'TIMEOUT',
          message: error.message,
        },
        504
      );
    }

    if (error instanceof ApiError || error.name === 'ApiError' || error.code === 'API_ERROR') {
      const statusCode = error.statusCode && error.statusCode >= 400 && error.statusCode < 600 
        ? (error.statusCode as 400 | 401 | 403 | 404 | 500 | 502 | 503 | 504)
        : 500;
      return c.json(
        {
          success: false,
          error: 'API_ERROR',
          message: error.message,
          statusCode: error.statusCode,
        },
        statusCode
      );
    }

    // Unknown error
    return c.json(
      {
        success: false,
        error: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'An unknown error occurred',
      },
      500
    );
  }
});

export default app;

