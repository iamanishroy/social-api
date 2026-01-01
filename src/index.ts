/**
 * Twitter Tweet Data Fetcher
 * 
 * A production-ready TypeScript library for fetching tweet data
 * using Twitter's Syndication API.
 */

// Main exports
export { TweetService, getTweetData } from './services/tweet-service';

// Type exports
export type {
  TweetData,
  TweetAuthor,
  TweetMetrics,
  MediaItem,
  TweetServiceConfig,
  SyndicationData,
} from './types';

// Error exports
export {
  TweetError,
  InvalidUrlError,
  TweetNotFoundError,
  ApiError,
  TimeoutError,
} from './errors';

// Utility exports
export { extractTweetId, isValidTweetUrl, normalizeTweetUrl } from './utils/url-parser';

