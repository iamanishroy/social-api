# Twitter Tweet Data Fetcher

A production-ready TypeScript library for fetching tweet data using Twitter's Syndication API.

## Features

- ✅ **Type-safe**: Full TypeScript support with comprehensive type definitions
- ✅ **Production-ready**: Error handling, timeouts, and proper error classes
- ✅ **Modular**: Clean separation of concerns with organized file structure
- ✅ **Configurable**: Customizable timeout, language, and base URL
- ✅ **Multiple URL formats**: Supports `twitter.com`, `x.com`, and `t.co` URLs
- ✅ **Media parsing**: Extracts photos and videos from tweets
- ✅ **Error handling**: Custom error classes for different failure scenarios

## Installation

```bash
bun install
```

## Usage

### Basic Usage

```typescript
import { getTweetData } from './src';

const tweet = await getTweetData('https://x.com/username/status/1234567890');
console.log(tweet.text);
console.log(tweet.author.name);
```

### Using the Service Class

```typescript
import { TweetService } from './src';

const service = new TweetService({
  timeout: 15000, // 15 seconds
  language: 'en',
});

const tweet = await service.getTweetData('https://x.com/username/status/1234567890');
```

### Error Handling

```typescript
import { getTweetData, InvalidUrlError, TweetNotFoundError, ApiError } from './src';

try {
  const tweet = await getTweetData(url);
} catch (error) {
  if (error instanceof InvalidUrlError) {
    console.error('Invalid URL');
  } else if (error instanceof TweetNotFoundError) {
    console.error('Tweet not found');
  } else if (error instanceof ApiError) {
    console.error('API error:', error.message);
  }
}
```

## API Reference

### `getTweetData(tweetUrl: string, config?: TweetServiceConfig): Promise<TweetData>`

Convenience function to fetch tweet data.

**Parameters:**
- `tweetUrl`: Twitter/X URL (supports `twitter.com`, `x.com`, or `t.co`)
- `config`: Optional configuration object

**Returns:** Promise resolving to `TweetData`

### `TweetService`

Main service class for fetching tweets.

**Constructor:**
```typescript
new TweetService(config?: TweetServiceConfig)
```

**Methods:**
- `getTweetData(tweetUrl: string): Promise<TweetData>` - Fetch tweet data
- `updateConfig(config: Partial<TweetServiceConfig>): void` - Update configuration

### Configuration

```typescript
interface TweetServiceConfig {
  timeout?: number;      // Request timeout in ms (default: 10000)
  language?: string;     // Language code (default: 'en')
  baseUrl?: string;      // API base URL (default: Twitter's CDN)
}
```

### Types

```typescript
interface TweetData {
  id: string;
  url: string;
  text: string;
  created_at: string;
  author: TweetAuthor;
  metrics: TweetMetrics;
  media: MediaItem[];
  raw: SyndicationData; // Raw API response
}
```

## Error Classes

- `TweetError` - Base error class
- `InvalidUrlError` - Invalid tweet URL
- `TweetNotFoundError` - Tweet not found or unavailable
- `ApiError` - API request failed
- `TimeoutError` - Request timeout

## Project Structure

```
.
├── src/
│   ├── api/              # API client
│   │   └── syndication-client.ts
│   ├── config/           # Configuration
│   │   └── index.ts
│   ├── errors/           # Custom error classes
│   │   └── index.ts
│   ├── services/         # Service layer
│   │   └── tweet-service.ts
│   ├── types/            # Type definitions
│   │   └── index.ts
│   ├── utils/            # Utility functions
│   │   ├── media-parser.ts
│   │   └── url-parser.ts
│   └── index.ts          # Main entry point
├── examples/             # Example usage
│   └── main.ts
├── index.ts              # Root entry point
└── package.json
```

## Running Examples

```bash
bun run example
# or
bun run examples/main.ts
```

## API Server

### Local Development

Start the development server:

```bash
bun run dev
# or
bun run server
```

The server will start on `http://localhost:3000` (or the port specified in `PORT` environment variable).

### API Endpoints

#### Health Check
```
GET /api
```

Returns service status and available endpoints.

#### Fetch Tweet Data
```
GET /api/tweet?url=<tweet-url>
```

**Query Parameters:**
- `url` (required): The tweet URL to fetch

**Example:**
```bash
curl "http://localhost:3000/api/tweet?url=https://x.com/username/status/1234567890"
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "1234567890",
    "url": "https://twitter.com/username/status/1234567890",
    "text": "Tweet content...",
    "created_at": "2024-01-01T00:00:00Z",
    "author": {
      "id": "123",
      "name": "User Name",
      "username": "username",
      "avatar": "https://...",
      "verified": false
    },
    "metrics": {
      "likes": 100,
      "retweets": 50,
      "replies": 25,
      "quotes": 10
    },
    "media": []
  }
}
```

**Error Responses:**

- `400` - Invalid URL:
```json
{
  "success": false,
  "error": "INVALID_URL",
  "message": "Invalid tweet URL: ..."
}
```

- `404` - Tweet Not Found:
```json
{
  "success": false,
  "error": "TWEET_NOT_FOUND",
  "message": "Tweet not found or unavailable"
}
```

- `504` - Timeout:
```json
{
  "success": false,
  "error": "TIMEOUT",
  "message": "Request exceeded timeout of 10000ms"
}
```

- `500` - API Error:
```json
{
  "success": false,
  "error": "API_ERROR",
  "message": "API request failed",
  "statusCode": 500
}
```

## Deployment

### Deploy to Vercel

This project is configured for Vercel deployment with Bun runtime.

1. **Install Vercel CLI** (if not already installed):
```bash
npm install -g vercel
```

2. **Deploy**:
```bash
vercel
```

Or deploy to production:
```bash
vercel --prod
```

3. **Environment Variables** (optional):
You can set environment variables in the Vercel dashboard:
- `PORT` - Server port (default: 3000)

### Vercel Configuration

The project includes a `vercel.json` configuration file that:
- Uses Bun runtime (`vercel-bun@latest`) for serverless functions
- Routes all `/api/*` requests to the API handler
- Configures build and install commands

### Running Locally with Bun

```bash
# Development mode with hot reload
bun run dev

# Production mode
bun run start
```

## Development

```bash
# Type checking
bun run typecheck

# Start development server
bun run dev
```

## License

MIT
