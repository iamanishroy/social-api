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

/**
 * Helper to wrap a promise with a timeout
 */
async function withTimeout<T>(promise: Promise<T>, ms: number, fallback: () => Promise<T>): Promise<T> {
  let timeoutId: any;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(`Operation timed out after ${ms}ms`));
    }, ms);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } catch (error) {
    console.warn(`[Cache] Cache operation failed or timed out. Falling back to direct fetch.`, error);
    return await fallback();
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function getCachedTweetData(url: string) {
  const cacheKey = getTweetCacheKey(url);
  
  // Try to use cache with a 3-second timeout
  return await withTimeout(
    cache.wrap<TweetData>(
      cacheKey,
      async () => {
        const data = await fetchTweetData(url);
        return cleanObject(data); 
      },
      21600 
    ),
    3000, // 3 second timeout for cache operations
    async () => {
      console.log('[Cache] Falling back to direct fetch for:', url);
    return await fetchTweetData(url);
  }
  );
}
