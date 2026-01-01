import https from 'https';
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
  return new Promise((resolve, reject) => {
    const apiUrl = `${options.baseUrl}/tweet-result?id=${tweetId}&lang=${options.language}&token=0`;

    const request = https.get(apiUrl, (res) => {
      // Handle HTTP errors
      if (res.statusCode && res.statusCode >= 400) {
        reject(
          new ApiError(
            `HTTP ${res.statusCode}: ${res.statusMessage || 'Request failed'}`,
            res.statusCode
          )
        );
        return;
      }

      let data = '';

      res.on('data', (chunk: Buffer) => {
        data += chunk.toString();
      });

      res.on('end', () => {
        try {
          if (!data) {
            reject(new ApiError('Empty response from API'));
            return;
          }

          const jsonData = JSON.parse(data) as SyndicationData;

          if (jsonData.error || !jsonData.id_str) {
            reject(new TweetNotFoundError(jsonData.error || 'Tweet not found'));
            return;
          }

          resolve(jsonData);
        } catch (error) {
          if (error instanceof SyntaxError) {
            reject(new ApiError('Failed to parse API response'));
          } else {
            reject(
              new ApiError(
                error instanceof Error ? error.message : 'Unknown error'
              )
            );
          }
        }
      });
    });

    // Handle request errors
    request.on('error', (error) => {
      reject(
        new ApiError(
          `Network error: ${error.message}`,
          undefined
        )
      );
    });

    // Set timeout
    const timeoutId = setTimeout(() => {
      request.destroy();
      reject(new TimeoutError(`Request exceeded timeout of ${options.timeout}ms`));
    }, options.timeout);

    // Clear timeout on successful completion
    request.on('close', () => {
      clearTimeout(timeoutId);
    });
  });
}

