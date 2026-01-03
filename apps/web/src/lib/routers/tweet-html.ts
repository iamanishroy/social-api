import { Hono } from 'hono';
import { TweetData, InvalidUrlError, TweetNotFoundError, ApiError, TimeoutError } from '@social-api/twitter';
import { getCachedTweetData } from '../services/twitter';
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
 * Options for tweet HTML generation
 */
interface TweetOptions {
  theme?: 'light' | 'dark' | 'dim' | 'black';
  hideMedia?: boolean;
  hideMetrics?: boolean;
  hideBorder?: boolean;
  hideTimestamp?: boolean;
  bgTransparent?: boolean;
  width?: string;
  accentColor?: string;
  fontSize?: 'small' | 'medium' | 'large';
  hideFooter?: boolean;
}

/**
 * Generates HTML for a tweet
 */
function generateTweetHTML(tweet: TweetData, options: TweetOptions = {}): string {
  const {
    theme = 'light',
    hideMedia = false,
    hideMetrics = false,
    hideBorder = false,
    hideTimestamp = false,
    bgTransparent = false,
    width = '550px',
    accentColor = '#1d9bf0',
    fontSize = 'medium',
    hideFooter = false,
  } = options;

  const fontSizes = {
    small: '14px',
    medium: '15px',
    large: '18px'
  };

  const verifiedBadge = tweet.author.verified
    ? `<svg viewBox="0 0 24 24" class="verified-badge" role="img" aria-label="Verified account">
        <path fill="currentColor" d="M22.5 12.5c0-1.58-.875-2.95-2.148-3.6.154-.435.238-.905.238-1.4 0-2.21-1.71-3.998-3.818-3.998-.47 0-.92.084-1.336.25C14.818 2.415 13.51 1.5 12 1.5s-2.816.917-3.437 2.25c-.415-.165-.866-.25-1.336-.25-2.11 0-3.818 1.79-3.818 4 0 .495.083.965.238 1.4-1.272.65-2.147 2.018-2.147 3.6 0 1.495.782 2.798 1.942 3.486-.02.17-.032.34-.032.514 0 2.21 1.708 4 3.818 4 .47 0 .92-.086 1.335-.25.62 1.334 1.926 2.25 3.437 2.25 1.512 0 2.818-.916 3.437-2.25.415.163.865.248 1.336.248 2.11 0 3.818-1.79 3.818-4 0-.174-.012-.344-.033-.513 1.158-.687 1.943-1.99 1.943-3.484zm-6.616-3.334l-4.334 6.5c-.145.217-.382.334-.625.334-.143 0-.288-.04-.416-.126l-.115-.094-2.415-2.415c-.293-.293-.293-.768 0-1.06s.768-.294 1.06 0l1.77 1.767 3.825-5.74c.23-.345.696-.436 1.04-.207.346.23.44.696.21 1.04z"/>
      </svg>`
    : '';

  const mediaHTML = !hideMedia && tweet.media
    ? tweet.media
      .map((item) => {
        if (item.type === 'photo' && item.url) {
          return `<img src="${item.url}" alt="Tweet media" class="tweet-media" loading="lazy" />`;
        }
        if (item.type === 'video') {
          const videoUrl = (item.variants as any[])?.find(v => v.type === 'video/mp4' || v.content_type === 'video/mp4')?.url;
          if (videoUrl) {
            return `
            <div class="video-container">
              <video 
                src="${videoUrl}" 
                poster="${item.thumbnail}" 
                class="tweet-media" 
                controls 
                playsinline
                preload="metadata"
              ></video>
            </div>`;
          }
          return `
            <div class="video-container">
              <img src="${item.thumbnail}" alt="Tweet video" class="tweet-media" loading="lazy" />
              <div class="video-play-button">
                <svg viewBox="0 0 24 24" class="play-icon"><path fill="currentColor" d="M8 5v14l11-7z"/></svg>
              </div>
            </div>`;
        }
        return '';
      })
      .join('')
    : '';

  return `<!DOCTYPE html>
<html lang="en" data-theme="${theme}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Tweet by ${tweet.author.name} (@${tweet.author.username})</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg-color: ${bgTransparent ? 'transparent' : '#ffffff'};
      --card-bg: ${bgTransparent ? 'transparent' : '#ffffff'};
      --text-main: #0f1419;
      --text-sub: #536471;
      --border-color: #eff3f4;
      --accent-color: ${accentColor};
      --link-color: ${accentColor};
      --like-color: #f91880;
      --hover-bg: rgba(15, 20, 25, 0.1);
      --font-size: ${fontSizes[fontSize]};
      --tweet-width: ${width};
      --shadow: ${hideBorder ? 'none' : '0 2px 12px rgba(0, 0, 0, 0.08)'};
      --border-radius: 12px;
      --font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    }

    [data-theme="dim"] {
      --bg-color: ${bgTransparent ? 'transparent' : '#15202b'};
      --card-bg: ${bgTransparent ? 'transparent' : '#15202b'};
      --text-main: #ffffff;
      --text-sub: #8b98a5;
      --border-color: #38444d;
      --hover-bg: rgba(255, 255, 255, 0.1);
      --shadow: ${hideBorder ? 'none' : '0 2px 12px rgba(0, 0, 0, 0.2)'};
    }

    [data-theme="dark"], [data-theme="black"] {
      --bg-color: ${bgTransparent ? 'transparent' : '#000000'};
      --card-bg: ${bgTransparent ? 'transparent' : '#000000'};
      --text-main: #e7e9ea;
      --text-sub: #71767b;
      --border-color: #2f3336;
      --hover-bg: rgba(255, 255, 255, 0.1);
      --shadow: none;
    }

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: var(--font-family);
      background: var(--bg-color);
      color: var(--text-main);
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      padding: 20px;
      line-height: 1.4;
    }

    .tweet-container {
      max-width: var(--tweet-width);
      width: 100%;
    }

    .tweet-card {
      background: var(--card-bg);
      border-radius: var(--border-radius);
      border: ${hideBorder ? 'none' : '1px solid var(--border-color)'};
      padding: 16px;
      box-shadow: var(--shadow);
    }

    .tweet-header {
      display: flex;
      gap: 12px;
      margin-bottom: 12px;
    }

    .avatar {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      object-fit: cover;
    }

    .author-meta {
      display: flex;
      flex-direction: column;
      flex: 1;
      min-width: 0;
    }

    .author-name-row {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .author-name {
      font-weight: 700;
      font-size: var(--font-size);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .author-handle {
      color: var(--text-sub);
      font-size: var(--font-size);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .verified-badge {
      width: 18px;
      height: 18px;
      color: var(--accent-color);
      flex-shrink: 0;
    }

    .x-logo {
      width: 18px;
      height: 18px;
      color: var(--text-main);
      margin-left: auto;
    }

    .tweet-text {
      font-size: var(--font-size);
      white-space: pre-wrap;
      word-wrap: break-word;
      margin-bottom: 12px;
    }

    .tweet-link, .tweet-mention, .tweet-hashtag {
      color: var(--link-color);
      text-decoration: none;
    }

    .tweet-link:hover {
      text-decoration: underline;
    }

    .tweet-blockquote {
      border-left: 3px solid var(--border-color);
      padding-left: 12px;
      margin: 8px 0;
      color: var(--text-sub);
    }

    .tweet-media-container {
      margin-top: 12px;
      border-radius: 12px;
      overflow: hidden;
      border: 1px solid var(--border-color);
      display: grid;
      gap: 2px;
    }

    .tweet-media {
      width: 100%;
      height: auto;
      max-height: 512px;
      object-fit: cover;
      display: block;
    }

    .video-container {
      position: relative;
      background: black;
    }

    .tweet-footer {
      margin-top: 12px;
      padding-top: 12px;
      border-top: 1px solid var(--border-color);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .like-count {
      display: flex;
      align-items: center;
      gap: 6px;
      color: var(--text-sub);
      font-size: 14px;
      font-weight: 500;
    }

    .like-icon {
      width: 20px;
      height: 20px;
      color: var(--like-color);
    }

    .share-link {
      color: var(--link-color);
      text-decoration: none;
      font-size: 14px;
      font-weight: 600;
    }

    .timestamp {
      color: var(--text-sub);
      font-size: 14px;
      margin-top: 12px;
    }

    @media (max-width: 500px) {
      body { padding: 10px; }
      .tweet-card { border-radius: 0; border-left: none; border-right: none; }
    }
  </style>
</head>
<body>
  <div class="tweet-container">
    <article class="tweet-card">
      <div class="tweet-header">
        <img src="${tweet.author.avatar}" alt="${tweet.author.name}" class="avatar" />
        <div class="author-meta">
          <div class="author-name-row">
            <span class="author-name">${tweet.author.name}</span>
            ${verifiedBadge}
          </div>
          <span class="author-handle">@${tweet.author.username}</span>
        </div>
        <svg viewBox="0 0 300 271" class="x-logo" role="img" aria-label="X logo">
          <path fill="currentColor" d="m236 0h46l-101 115 118 156h-92.6l-72.5-94.8-83 94.8h-46l107-123-113-148h94.9l65.5 86.6zm-16.1 244h25.5l-165-218h-27.4z"/>
        </svg>
      </div>
      
      <div class="tweet-body">
        <div class="tweet-text">${processTweetText(tweet.text)}</div>
        ${mediaHTML ? `<div class="tweet-media-container">${mediaHTML}</div>` : ''}
        
        ${!hideTimestamp ? `
        <div class="timestamp">
          ${new Date(tweet.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · 
          ${new Date(tweet.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
        </div>
        ` : ''}

        ${!hideFooter ? `
        <footer class="tweet-footer">
          ${!hideMetrics ? `
          <div class="like-count">
            <svg class="like-icon" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20.884 13.19c-1.351 2.48-4.001 5.12-8.381 7.67-.19.11-.41.11-.6 0-4.38-2.55-7.03-5.19-8.381-7.67-1.15-2.11-1.1-4.65.14-6.52A6.155 6.155 0 018.783 4.5c1.11 0 2.25.3 3.217 1 0-.01 0-.02.001-.03.97-.7 2.11-1 3.22-1a6.16 6.16 0 015.11 2.17c1.24 1.87 1.253 4.41.153 6.55z"/>
            </svg>
            <span>${formatCount(tweet.metrics.likes)}</span>
          </div>
          ` : '<div></div>'}
          <a href="${tweet.url}" target="_blank" rel="noopener noreferrer" class="share-link">View on X</a>
        </footer>
        ` : ''}
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
 * Processes tweet text for display
 */
function processTweetText(text: string): string {
  if (!text) return '';
  let escaped = escapeHtml(text);
  escaped = escaped.replace(/\n{3,}/g, '\n\n');

  // URLs
  escaped = escaped.replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer" class="tweet-link">$1</a>');

  // Mentions
  escaped = escaped.replace(/@(\w+)/g, '<span class="tweet-mention">@$1</span>');

  // Hashtags
  escaped = escaped.replace(/#(\w+)/g, '<span class="tweet-hashtag">#$1</span>');

  // Blockquotes (must be last to handle previous tags well)
  const lines = escaped.split('\n');
  return lines.map(line => {
    if (line.trim().startsWith('&gt;')) {
      return `<div class="tweet-blockquote">${line.trim().substring(4)}</div>`;
    }
    return line;
  }).join('\n');
}

/**
 * GET /tweet
 */
app.get('/', cacheControl({ maxAge: env.cacheMaxAge, public: true }), async (c) => {
  const url = c.req.query('url');

  if (!url) {
    return c.html('<h1>Missing URL parameter</h1>', 400);
  }

  const options: TweetOptions = {
    theme: c.req.query('theme') as any,
    hideMedia: c.req.query('hide_media') === 'true',
    hideMetrics: c.req.query('hide_metrics') === 'true',
    hideBorder: c.req.query('hide_border') === 'true',
    hideTimestamp: c.req.query('hide_timestamp') === 'true',
    bgTransparent: c.req.query('bg_transparent') === 'true',
    accentColor: c.req.query('accent_color'),
    fontSize: c.req.query('font_size') as any,
    width: c.req.query('width'),
    hideFooter: c.req.query('hide_footer') === 'true',
  };

  try {
    const tweet = await getCachedTweetData(url);
    const html = generateTweetHTML(tweet, options);
    return c.html(html);
  } catch (error: any) {
    let errorMessage = 'An error occurred';
    let statusCode: any = 500;

    if (error instanceof InvalidUrlError || error.code === 'INVALID_URL') {
      errorMessage = error.message;
      statusCode = 400;
    } else if (error instanceof TweetNotFoundError || error.code === 'TWEET_NOT_FOUND') {
      errorMessage = error.message;
      statusCode = 404;
    } else if (error instanceof TimeoutError || error.code === 'TIMEOUT') {
      errorMessage = error.message;
      statusCode = 504;
    }

    return c.html(`<h1>Error</h1><p>${escapeHtml(errorMessage)}</p>`, statusCode);
  }
});

export default app;

