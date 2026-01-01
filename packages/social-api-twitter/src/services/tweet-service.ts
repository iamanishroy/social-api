import type { TweetData, TweetServiceConfig, SyndicationData } from '../types';
import { InvalidUrlError } from '../errors';
import { extractTweetId } from '../utils/url-parser';
import { parseMedia } from '../utils/media-parser';
import { fetchSyndicationAPI } from '../api/syndication-client';
import { mergeConfig } from '../config';

/**
 * Main service class for fetching tweet data
 */
export class TweetService {
  private config: Required<TweetServiceConfig>;

  constructor(config?: TweetServiceConfig) {
    this.config = mergeConfig(config);
  }

  /**
   * Updates the service configuration
   */
  updateConfig(config: Partial<TweetServiceConfig>): void {
    this.config = mergeConfig({ ...this.config, ...config });
  }

  /**
   * Fetches tweet data using Twitter's Syndication API
   * This is what powers the embedded tweets
   *
   * @param tweetUrl - The URL of the tweet (supports twitter.com, x.com, or t.co)
   * @returns Promise resolving to tweet data
   * @throws {InvalidUrlError} If the URL is invalid
   * @throws {TweetNotFoundError} If the tweet is not found
   * @throws {ApiError} If the API request fails
   * @throws {TimeoutError} If the request times out
   */
  async getTweetData(tweetUrl: string): Promise<TweetData> {
    // Validate and extract tweet ID
    const tweetId = extractTweetId(tweetUrl);

    if (!tweetId) {
      throw new InvalidUrlError(
        `Invalid tweet URL: ${tweetUrl}. Supported formats: twitter.com/username/status/ID, x.com/username/status/ID, or t.co/ID`
      );
    }

    // Fetch data from API
    const syndicationData = await fetchSyndicationAPI(tweetId, {
      timeout: this.config.timeout,
      language: this.config.language,
      baseUrl: this.config.baseUrl,
    });

    // Transform to our data structure
    return this.transformTweetData(syndicationData);
  }

  /**
   * Transforms syndication API data to TweetData format
   */
  private transformTweetData(syndicationData: SyndicationData): TweetData {
    return {
      id: syndicationData.id_str,
      url: `https://twitter.com/${syndicationData.user.screen_name}/status/${syndicationData.id_str}`,
      text: syndicationData.text,
      created_at: syndicationData.created_at,
      author: {
        id: syndicationData.user.id_str,
        name: syndicationData.user.name,
        username: syndicationData.user.screen_name,
        avatar: syndicationData.user.profile_image_url_https,
        verified: syndicationData.user.verified,
      },
      metrics: {
        likes: syndicationData.favorite_count || 0,
        retweets: syndicationData.retweet_count || 0,
        replies: syndicationData.reply_count || 0,
        quotes: syndicationData.quote_count || 0,
      },
      media: parseMedia(syndicationData),
      raw: syndicationData,
    };
  }
}

/**
 * Convenience function that creates a service instance and fetches tweet data
 */
export async function getTweetData(
  tweetUrl: string,
  config?: TweetServiceConfig
): Promise<TweetData> {
  const service = new TweetService(config);
  return service.getTweetData(tweetUrl);
}

