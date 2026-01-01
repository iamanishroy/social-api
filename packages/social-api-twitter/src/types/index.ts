/**
 * Type definitions for Twitter Syndication API
 */

export interface SyndicationUser {
  id_str: string;
  name: string;
  screen_name: string;
  profile_image_url_https: string;
  verified: boolean;
}

export interface SyndicationPhoto {
  url: string;
  width: number;
  height: number;
}

export interface SyndicationVideo {
  poster: string;
  variants: unknown[];
}

export interface SyndicationData {
  id_str: string;
  text: string;
  created_at: string;
  user: SyndicationUser;
  favorite_count: number;
  retweet_count: number;
  reply_count?: number;
  quote_count?: number;
  photos?: SyndicationPhoto[];
  video?: SyndicationVideo;
  error?: string;
}

export interface TweetAuthor {
  id: string;
  name: string;
  username: string;
  avatar: string;
  verified: boolean;
}

export interface TweetMetrics {
  likes: number;
  retweets: number;
  replies: number;
  quotes: number;
}

export interface MediaItem {
  type: 'photo' | 'video';
  url?: string;
  width?: number;
  height?: number;
  thumbnail?: string;
  variants?: unknown[];
}

export interface TweetData {
  id: string;
  url: string;
  text: string;
  created_at: string;
  author: TweetAuthor;
  metrics: TweetMetrics;
  media: MediaItem[];
  raw: SyndicationData;
}

export interface TweetServiceConfig {
  timeout?: number;
  language?: string;
  baseUrl?: string;
}

