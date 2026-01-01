import type { SyndicationData } from '../types';
import { ApiError, TimeoutError, TweetNotFoundError } from '../errors';

export interface RequestOptions {
  timeout: number;
  language: string;
  baseUrl: string;
}

/**
 * Fetches data from Twitter's Syndication API
 */
export async function fetchSyndicationAPI(
  tweetId: string,
  options: RequestOptions
): Promise<SyndicationData> {
  const apiUrl = `${options.baseUrl}/tweet-result?id=${tweetId}&lang=${options.language}&token=0`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), options.timeout);

  try {
    const response = await fetch(apiUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': '*/*',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      if (response.status === 404) {
        throw new TweetNotFoundError('Tweet not found');
      }
      throw new ApiError(`HTTP ${response.status}: ${response.statusText}`, response.status);
    }

    const data = await response.text();
    if (!data) {
      throw new ApiError('Empty response from API');
    }

    const jsonData = JSON.parse(data) as SyndicationData;

    if (jsonData.error || !jsonData.id_str) {
      throw new TweetNotFoundError(jsonData.error || 'Tweet not found');
    }

    return jsonData;
  } catch (error: any) {
    clearTimeout(timeoutId);
    
    if (error.name === 'AbortError') {
      throw new TimeoutError(`Request exceeded timeout of ${options.timeout}ms`);
    }
    
    if (error instanceof TweetNotFoundError || error instanceof ApiError) {
      throw error;
    }

    throw new ApiError(error.message);
  }
}
