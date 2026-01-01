/**
 * Custom error classes for tweet service
 */

export class TweetError extends Error {
  constructor(message: string, public readonly code?: string) {
    super(message);
    this.name = 'TweetError';
    Object.setPrototypeOf(this, TweetError.prototype);
  }
}

export class InvalidUrlError extends TweetError {
  constructor(message: string = 'Invalid tweet URL') {
    super(message, 'INVALID_URL');
    this.name = 'InvalidUrlError';
    Object.setPrototypeOf(this, InvalidUrlError.prototype);
  }
}

export class TweetNotFoundError extends TweetError {
  constructor(message: string = 'Tweet not found or unavailable') {
    super(message, 'TWEET_NOT_FOUND');
    this.name = 'TweetNotFoundError';
    Object.setPrototypeOf(this, TweetNotFoundError.prototype);
  }
}

export class ApiError extends TweetError {
  constructor(
    message: string = 'API request failed',
    public readonly statusCode?: number
  ) {
    super(message, 'API_ERROR');
    this.name = 'ApiError';
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

export class TimeoutError extends TweetError {
  constructor(message: string = 'Request timeout') {
    super(message, 'TIMEOUT');
    this.name = 'TimeoutError';
    Object.setPrototypeOf(this, TimeoutError.prototype);
  }
}

