import type { TweetServiceConfig } from '../types';

/**
 * Default configuration for the tweet service
 */
export const DEFAULT_CONFIG: Required<TweetServiceConfig> = {
  timeout: 10000, // 10 seconds
  language: 'en',
  baseUrl: 'https://cdn.syndication.twimg.com',
};

/**
 * Merges user configuration with defaults
 */
export function mergeConfig(
  userConfig?: TweetServiceConfig
): Required<TweetServiceConfig> {
  return {
    timeout: userConfig?.timeout ?? DEFAULT_CONFIG.timeout,
    language: userConfig?.language ?? DEFAULT_CONFIG.language,
    baseUrl: userConfig?.baseUrl ?? DEFAULT_CONFIG.baseUrl,
  };
}

