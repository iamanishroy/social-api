import { createCache } from 'flamecache';

/**
 * Cache instance using Flamecache (backed by Firebase Realtime Database)
 * This provides a Redis-like caching layer for the Edge Runtime.
 */
export const cache = createCache({
  firebase: {
    apiKey: process.env.FIREBASE_API_KEY || '',
    databaseURL: process.env.FIREBASE_DATABASE_URL || '',
    projectId: process.env.FIREBASE_PROJECT_ID || '',
  },
  rootPath: 'social-api',
  ttl: Number(process.env.CACHE_TTL) || 3600, // Default 1 hour
  disableCache: !process.env.FIREBASE_API_KEY || !process.env.FIREBASE_DATABASE_URL, 
});

/**
 * Helper to generate cache keys for tweets.
 * Sanitize the URL/ID because Firebase keys cannot contain: . $ # [ ] /
 */
export const getTweetCacheKey = (urlOrId: string) => {
  const sanitized = urlOrId.replace(/[.$#[\]/]/g, '_');
  return `tweet:${sanitized}`;
};
