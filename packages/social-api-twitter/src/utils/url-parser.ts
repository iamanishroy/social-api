/**
 * URL parsing utilities for Twitter/X URLs
 */

/**
 * Extracts tweet ID from various Twitter URL formats
 * Supports:
 * - https://twitter.com/username/status/1234567890
 * - https://x.com/username/status/1234567890
 * - https://t.co/abc123 (shortened URLs)
 */
export function extractTweetId(url: string): string | null {
  if (!url || typeof url !== 'string') {
    return null;
  }

  const patterns = [
    /twitter\.com\/\w+\/status\/(\d+)/,
    /x\.com\/\w+\/status\/(\d+)/,
    /t\.co\/(\w+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

/**
 * Validates if a URL is a valid Twitter/X URL
 */
export function isValidTweetUrl(url: string): boolean {
  return extractTweetId(url) !== null;
}

/**
 * Normalizes Twitter URL to standard format
 */
export function normalizeTweetUrl(url: string): string | null {
  const tweetId = extractTweetId(url);
  if (!tweetId) {
    return null;
  }

  // For t.co URLs, we can't determine the username, so return null
  if (url.includes('t.co/')) {
    return null;
  }

  // Extract username from URL
  const usernameMatch = url.match(/(?:twitter\.com|x\.com)\/(\w+)\/status/);
  if (usernameMatch && usernameMatch[1]) {
    return `https://twitter.com/${usernameMatch[1]}/status/${tweetId}`;
  }

  return null;
}

