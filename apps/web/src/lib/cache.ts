import { createCache } from 'flamecache';

// Check environment variables
const config = {
  apiKey: process.env.FIREBASE_API_KEY,
  databaseURL: process.env.FIREBASE_DATABASE_URL,
  projectId: process.env.FIREBASE_PROJECT_ID,
};

const missingVars = Object.entries(config)
  .filter(([, value]) => !value)
  .map(([key]) => key);

if (missingVars.length > 0) {
  console.warn(`[Cache] Missing environment variables: ${missingVars.join(', ')}. Cache will be disabled.`);
} else {
  console.log('[Cache] Initializing with Firebase Project:', config.projectId);
}

/**
 * Cache instance using Flamecache (backed by Firebase Realtime Database)
 * This provides a Redis-like caching layer for the Edge Runtime.
 */
export const cache = createCache({
  firebase: {
    apiKey: config.apiKey || '',
    databaseURL: config.databaseURL || '',
    projectId: config.projectId || '',
  },
  rootPath: 'social-api',
  ttl: Number(process.env.CACHE_TTL) || 3600, // Default 1 hour
  disableCache: missingVars.length > 0,
});


/**
 * Helper to generate cache keys for tweets.
 * Extracts username and status ID from URL to create a safe, readable key.
 * Format: tweet:username:statusId
 */
export const getTweetCacheKey = (urlOrId: string) => {
  // Try to extract username and id from Twitter/X URL
  // Handles: twitter.com, x.com, and subdomains like mobile.twitter.com
  const match = urlOrId.match(/(?:^|https?:\/\/)(?:[^\/ \?]+\.)?(?:twitter\.com|x\.com)\/([^\/ \?]+)\/status\/(\d+)/i);
  
  if (match) {
    const [, username, id] = match;
    return `tweet:${username}:${id}`;
  }

  // Fallback: sanitize if it's not a standard URL
  return `tweet:${urlOrId.replace(/[.$#[\]/]/g, '_')}`;
};



