import { getTweetData as fetchTweetData, type TweetData } from '@social-api/twitter';
import { cache, getTweetCacheKey } from '../cache';

/**
 * Fetches tweet data with caching via Flamecache.
 * This ensures we don't hit the Twitter Syndication API unnecessarily.
 */
/**
 * Deeply removes undefined properties from an object.
 * Necessary for Firebase/Flamecache compatibility.
 */
function cleanObject(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(cleanObject);
  } else if (obj !== null && typeof obj === 'object') {
    return Object.fromEntries(
      Object.entries(obj)
        .filter((entry) => entry[1] !== undefined)
        .map(([k, v]) => [k, cleanObject(v)])
    );
  }
  return obj;
}

export async function getCachedTweetData(url: string) {
  const cacheKey = getTweetCacheKey(url);
  try {
    // Cache for 6 hours (21600 seconds) by default for the raw data
    return await cache.wrap<TweetData>(
      cacheKey,
      async () => {
        const data = await fetchTweetData(url);
        return cleanObject(data); // Strip undefineds before caching
      },
      21600 
    );
  } catch {
    // Fallback to direct fetch if cache fails
    return await fetchTweetData(url);
  }
}
