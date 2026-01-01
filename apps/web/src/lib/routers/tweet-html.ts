import { Hono } from 'hono';
import { getTweetData, InvalidUrlError, TweetNotFoundError, ApiError, TimeoutError } from '@social-api/twitter';
import { cacheControl } from '../middleware';
import { env } from '../config/env';

const app = new Hono();

/**
 * Formats a number with K/M suffixes
 */
function formatCount(count: number): string {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`;
  }
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`;
  }
  return count.toString();
}

/**
 * Formats relative time in Twitter style (e.g., "52w", "3d", "2h", "5m", "30s")
 */
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return `${diffInSeconds}s`;
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d`;
  if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 604800)}w`;
  return `${Math.floor(diffInSeconds / 31536000)}y`;
}

/**
 * Generates HTML for a tweet
 */
function generateTweetHTML(tweet: Awaited<ReturnType<typeof getTweetData>>): string {
  const verifiedBadge = tweet.author.verified
    ? `<svg viewBox="0 0 24 24" class="verified-badge" role="img" aria-label="Verified account">
        <path fill="currentColor" d="M22.5 12.5c0-1.58-.875-2.95-2.148-3.6.154-.435.238-.905.238-1.4 0-2.21-1.71-3.998-3.818-3.998-.47 0-.92.084-1.336.25C14.818 2.415 13.51 1.5 12 1.5s-2.816.917-3.437 2.25c-.415-.165-.866-.25-1.336-.25-2.11 0-3.818 1.79-3.818 4 0 .495.083.965.238 1.4-1.272.65-2.147 2.018-2.147 3.6 0 1.495.782 2.798 1.942 3.486-.02.17-.032.34-.032.514 0 2.21 1.708 4 3.818 4 .47 0 .92-.086 1.335-.25.62 1.334 1.926 2.25 3.437 2.25 1.512 0 2.818-.916 3.437-2.25.415.163.865.248 1.336.248 2.11 0 3.818-1.79 3.818-4 0-.174-.012-.344-.033-.513 1.158-.687 1.943-1.99 1.943-3.484zm-6.616-3.334l-4.334 6.5c-.145.217-.382.334-.625.334-.143 0-.288-.04-.416-.126l-.115-.094-2.415-2.415c-.293-.293-.293-.768 0-1.06s.768-.294 1.06 0l1.77 1.767 3.825-5.74c.23-.345.696-.436 1.04-.207.346.23.44.696.21 1.04z"/>
      </svg>`
    : '';

  const mediaHTML = tweet.media
    .map((item) => {
      if (item.type === 'photo' && item.url) {
        return `<img src="${item.url}" alt="Tweet media" class="tweet-media" loading="lazy" />`;
      }
      if (item.type === 'video' && item.thumbnail) {
        return `<img src="${item.thumbnail}" alt="Tweet video" class="tweet-media" loading="lazy" />`;
      }
      return '';
    })
    .join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Tweet by @${tweet.author.username}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background: #f7f9f9;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      padding: 20px;
    }
    .tweet-container {
      max-width: 600px;
      width: 100%;
    }
    .tweet-card {
      background: white;
      border-radius: 12px;
      border: 1px solid #e1e8ed;
      padding: 16px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
    }
    .tweet-header {
      display: flex;
      gap: 12px;
    }
    .avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      object-fit: cover;
      flex-shrink: 0;
    }
    .tweet-content {
      flex: 1;
      min-width: 0;
    }
    .author-info {
      display: flex;
      align-items: center;
      gap: 4px;
      margin-bottom: 4px;
    }
    .author-name {
      font-weight: 600;
      font-size: 15px;
      color: #0f1419;
    }
    .verified-badge {
      width: 18px;
      height: 18px;
      color: #1d9bf0;
      flex-shrink: 0;
    }
    .author-handle {
      color: #536471;
      font-size: 15px;
      margin-left: 4px;
    }
    .tweet-time {
      color: #536471;
      font-size: 15px;
      margin-left: 4px;
    }
    .tweet-text {
      font-size: 15px;
      line-height: 1.5;
      color: #0f1419;
      margin-top: 4px;
      white-space: pre-wrap;
      word-wrap: break-word;
    }
    .tweet-media {
      margin-top: 12px;
      width: 100%;
      border-radius: 12px;
      max-height: 500px;
      object-fit: cover;
    }
    .tweet-actions {
      display: flex;
      align-items: center;
      gap: 24px;
      margin-top: 12px;
      padding-top: 12px;
      border-top: 1px solid #f0f0f0;
    }
    .action-button {
      display: flex;
      align-items: center;
      gap: 6px;
      background: none;
      border: none;
      color: #536471;
      font-size: 14px;
      cursor: pointer;
      padding: 4px 8px;
      border-radius: 4px;
      transition: all 0.2s;
    }
    .action-button:hover {
      background: rgba(29, 155, 240, 0.1);
    }
    .action-button.like:hover {
      color: #f91880;
      background: rgba(249, 24, 128, 0.1);
    }
    .action-icon {
      width: 18px;
      height: 18px;
    }
    .x-logo {
      width: 16px;
      height: 16px;
      color: #536471;
      opacity: 0.4;
      margin-left: auto;
    }
    .author-header {
      display: flex;
      align-items: start;
      justify-content: space-between;
      gap: 8px;
    }
  </style>
</head>
<body>
  <div class="tweet-container">
    <article class="tweet-card">
      <div class="tweet-header">
        <img src="${tweet.author.avatar}" alt="${tweet.author.name} avatar" class="avatar" />
        <div class="tweet-content">
          <div class="author-header">
            <div class="author-info">
              <span class="author-name">${tweet.author.name}</span>
              ${verifiedBadge}
              <span class="author-handle">@${tweet.author.username}</span>
              <span class="tweet-time">· ${formatRelativeTime(tweet.created_at)}</span>
            </div>
            <svg viewBox="0 0 300 271" class="x-logo" role="img" aria-label="X logo">
              <path fill="currentColor" d="m236 0h46l-101 115 118 156h-92.6l-72.5-94.8-83 94.8h-46l107-123-113-148h94.9l65.5 86.6zm-16.1 244h25.5l-165-218h-27.4z"/>
            </svg>
          </div>
          <div class="tweet-text">${escapeHtml(tweet.text)}</div>
          ${mediaHTML ? `<div class="tweet-media-container">${mediaHTML}</div>` : ''}
          <div class="tweet-actions">
            <button class="action-button like" aria-label="Like">
              <svg class="action-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
              </svg>
              <span>${formatCount(tweet.metrics.likes)}</span>
            </button>
            <button class="action-button" aria-label="Share">
              <svg class="action-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316a3 3 0 105.367-2.684l-6.632-3.316m0 0a3 3 0 105.368 2.684l-6.632-3.316m0 0v-2.684"/>
              </svg>
              <span>Share</span>
            </button>
          </div>
        </div>
      </div>
    </article>
  </div>
</body>
</html>`;
}

function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (m) => map[m] || m);
}

/**
 * GET /tweet
 * 
 * Query parameters:
 * - url: The tweet URL (required)
 * 
 * Example: /tweet?url=https://x.com/username/status/1234567890
 */
app.get('/', cacheControl({ maxAge: env.cacheMaxAge, public: true }), async (c) => {
  const url = c.req.query('url');

  if (!url) {
    return c.html(
      `<!DOCTYPE html>
<html>
<head><title>Error</title></head>
<body>
  <h1>Missing URL parameter</h1>
  <p>Please provide a tweet URL: /tweet?url=https://x.com/username/status/1234567890</p>
</body>
</html>`,
      400 as const
    );
  }

  try {
    const tweet = await getTweetData(url);
    const html = generateTweetHTML(tweet);
    return c.html(html);
  } catch (error) {
    let errorMessage = 'An error occurred';
    let statusCode: 400 | 404 | 500 | 504 = 500;

    if (error instanceof InvalidUrlError) {
      errorMessage = error.message;
      statusCode = 400;
    } else if (error instanceof TweetNotFoundError) {
      errorMessage = error.message;
      statusCode = 404;
    } else if (error instanceof TimeoutError) {
      errorMessage = error.message;
      statusCode = 504;
    } else if (error instanceof ApiError) {
      errorMessage = error.message;
      const apiStatusCode = error.statusCode && error.statusCode >= 400 && error.statusCode < 600
        ? (error.statusCode as 400 | 404 | 500 | 504)
        : 500;
      statusCode = apiStatusCode;
    }

    return c.html(
      `<!DOCTYPE html>
<html>
<head><title>Error</title></head>
<body>
  <h1>Error</h1>
  <p>${escapeHtml(errorMessage)}</p>
</body>
</html>`,
      statusCode
    );
  }
});

export default app;

