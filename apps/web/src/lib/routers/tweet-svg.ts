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
 * Wraps text for SVG
 */
function wrapText(text: string, maxWidth: number, fontSize: number = 15): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    // Approximate width calculation (rough estimate: 0.6 * fontSize per character)
    const width = testLine.length * fontSize * 0.6;

    if (width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines.slice(0, 10); // Limit to 10 lines max
}

/**
 * Generates SVG for a tweet
 */
function generateTweetSVG(tweet: TweetData): string {
  const width = 600;
  const padding = 20;
  const avatarSize = 40;
  const avatarY = padding + avatarSize / 2;
  const contentX = padding * 2 + avatarSize;
  const contentWidth = width - contentX - padding;
  const maxTextWidth = contentWidth - 20;

  let y = padding + 20;
  const lineHeight = 20;
  const textLines = wrapText(tweet.text, maxTextWidth);
  const textHeight = textLines.length * lineHeight;

  let mediaHeight = 0;
  const firstMedia = tweet.media[0];
  if (firstMedia) {
    mediaHeight = 200;
  }

  const actionsHeight = 40;
  const totalHeight = Math.max(
    padding * 2 + avatarSize + textHeight + (mediaHeight > 0 ? mediaHeight + 10 : 0) + actionsHeight + padding,
    300
  );

  const verifiedBadge = tweet.author.verified
    ? `<g transform="translate(${contentX + getTextWidth(tweet.author.name, 15) + 4}, ${y - 2})">
        <path fill="#1d9bf0" d="M22.5 12.5c0-1.58-.875-2.95-2.148-3.6.154-.435.238-.905.238-1.4 0-2.21-1.71-3.998-3.818-3.998-.47 0-.92.084-1.336.25C14.818 2.415 13.51 1.5 12 1.5s-2.816.917-3.437 2.25c-.415-.165-.866-.25-1.336-.25-2.11 0-3.818 1.79-3.818 4 0 .495.083.965.238 1.4-1.272.65-2.147 2.018-2.147 3.6 0 1.495.782 2.798 1.942 3.486-.02.17-.032.34-.032.514 0 2.21 1.708 4 3.818 4 .47 0 .92-.086 1.335-.25.62 1.334 1.926 2.25 3.437 2.25 1.512 0 2.818-.916 3.437-2.25.415.163.865.248 1.336.248 2.11 0 3.818-1.79 3.818-4 0-.174-.012-.344-.033-.513 1.158-.687 1.943-1.99 1.943-3.484zm-6.616-3.334l-4.334 6.5c-.145.217-.382.334-.625.334-.143 0-.288-.04-.416-.126l-.115-.094-2.415-2.415c-.293-.293-.293-.768 0-1.06s.768-.294 1.06 0l1.77 1.767 3.825-5.74c.23-.345.696-.436 1.04-.207.346.23.44.696.21 1.04z"/>
      </g>`
    : '';

  let svgContent = `
    <!-- Background -->
    <rect width="${width}" height="${totalHeight}" fill="#ffffff" rx="12"/>
    
    <!-- Avatar -->
    <defs>
      <clipPath id="avatar-clip">
        <circle cx="${padding + avatarSize / 2}" cy="${avatarY}" r="${avatarSize / 2}"/>
      </clipPath>
    </defs>
    <image href="${tweet.author.avatar}" x="${padding}" y="${padding}" width="${avatarSize}" height="${avatarSize}" clip-path="url(#avatar-clip)"/>
    
    <!-- Author name -->
    <text x="${contentX}" y="${y}" font-family="system-ui, -apple-system, sans-serif" font-size="15" font-weight="600" fill="#0f1419">
      ${escapeSvg(tweet.author.name)}
    </text>
    ${verifiedBadge}
    
    <!-- Handle and time -->
    <text x="${contentX + getTextWidth(tweet.author.name, 15) + (tweet.author.verified ? 22 : 0) + 4}" y="${y}" font-family="system-ui, -apple-system, sans-serif" font-size="15" fill="#536471">
      @${escapeSvg(tweet.author.username)} · ${formatRelativeTime(tweet.created_at)}
    </text>
    
    <!-- X Logo -->
    <g transform="translate(${width - padding - 20}, ${padding + 4})">
      <path fill="#536471" opacity="0.4" d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" transform="scale(0.8)"/>
    </g>
    
    <!-- Tweet text -->
    <g transform="translate(${contentX}, ${y + lineHeight + 8})">
      ${textLines
        .map(
          (line, i) =>
            `<text x="0" y="${i * lineHeight}" font-family="system-ui, -apple-system, sans-serif" font-size="15" fill="#0f1419">${escapeSvg(line)}</text>`
        )
        .join('')}
    </g>
  `;

  y += textHeight + lineHeight + 16;

  // Media
  if (firstMedia && (firstMedia.url || firstMedia.thumbnail)) {
    const mediaUrl = firstMedia.url || firstMedia.thumbnail || '';
    svgContent += `
      <defs>
        <clipPath id="media-clip">
          <rect x="${contentX}" y="${y}" width="${maxTextWidth}" height="${mediaHeight}" rx="12"/>
        </clipPath>
      </defs>
      <image href="${mediaUrl}" x="${contentX}" y="${y}" width="${maxTextWidth}" height="${mediaHeight}" preserveAspectRatio="xMidYMid slice" clip-path="url(#media-clip)"/>
    `;
    y += mediaHeight + 10;
  }

  // Actions
  y += 5;
  svgContent += `
    <!-- Separator Line -->
    <line x1="${contentX}" y1="${y}" x2="${width - padding}" y2="${y}" stroke="#eff3f4" stroke-width="1"/>
  `;
  y += 15;
  svgContent += `
    <!-- Like button -->
    <g transform="translate(${contentX}, ${y})">
      <g transform="translate(9, 10)">
        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="none" stroke="#536471" stroke-width="1.5" transform="scale(0.65) translate(-12, -12)"/>
      </g>
      <text x="24" y="15" font-family="system-ui, -apple-system, sans-serif" font-size="14" fill="#536471">${formatCount(tweet.metrics.likes)}</text>
    </g>
    
    <!-- Share button -->
    <g transform="translate(${contentX + 100}, ${y})">
      <g transform="translate(9, 10)">
        <path d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316a3 3 0 105.367-2.684l-6.632-3.316m0 0a3 3 0 105.368 2.684l-6.632-3.316m0 0v-2.684" fill="none" stroke="#536471" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" transform="scale(0.65) translate(-12, -12)"/>
      </g>
      <text x="24" y="15" font-family="system-ui, -apple-system, sans-serif" font-size="14" fill="#536471">Share</text>
    </g>
  `;

  return `<svg width="${width}" height="${totalHeight}" viewBox="0 0 ${width} ${totalHeight}" xmlns="http://www.w3.org/2000/svg">
    ${svgContent}
  </svg>`;
}

function getTextWidth(text: string, fontSize: number): number {
  return text.length * fontSize * 0.6;
}

function escapeSvg(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * GET /tweet-svg
 * 
 * Query parameters:
 * - url: The tweet URL (required)
 * 
 * Example: /tweet-svg?url=https://x.com/username/status/1234567890
 */
app.get('/', cacheControl({ maxAge: env.cacheMaxAge, public: true }), async (c) => {
  const url = c.req.query('url');

  if (!url) {
    return c.text('Missing URL parameter', 400);
  }

  try {
    const tweet = await getCachedTweetData(url);
    const svg = generateTweetSVG(tweet);
    return c.html(svg, 200, {
      'Content-Type': 'image/svg+xml',
    });
  } catch (error: any) {
    let errorMessage = 'An error occurred';
    let statusCode = 500;

    if (error instanceof InvalidUrlError || error.name === 'InvalidUrlError' || error.code === 'INVALID_URL') {
      errorMessage = error.message;
      statusCode = 400;
    } else if (error instanceof TweetNotFoundError || error.name === 'TweetNotFoundError' || error.code === 'TWEET_NOT_FOUND') {
      errorMessage = error.message;
      statusCode = 404;
    } else if (error instanceof TimeoutError || error.name === 'TimeoutError' || error.code === 'TIMEOUT') {
      errorMessage = error.message;
      statusCode = 504;
    } else if (error instanceof ApiError || error.name === 'ApiError' || error.code === 'API_ERROR') {
      errorMessage = error.message;
      statusCode = error.statusCode || 500;
    }

    const errorSvg = `<svg width="600" height="200" xmlns="http://www.w3.org/2000/svg">
      <rect width="600" height="200" fill="#ffffff" rx="12"/>
      <text x="300" y="80" text-anchor="middle" font-family="system-ui" font-size="16" fill="#ef4444">${escapeSvg(errorMessage)}</text>
      <text x="300" y="110" text-anchor="middle" font-family="system-ui" font-size="12" fill="#666666">ID: ${(c as any).get('requestId') || 'unknown'}</text>
    </svg>`;

    return c.html(errorSvg, statusCode as 400 | 404 | 500 | 504, {
      'Content-Type': 'image/svg+xml',
    });
  }
});

export default app;

