import type { SyndicationData, MediaItem } from '../types';

/**
 * Parses media from syndication data
 */
export function parseMedia(data: SyndicationData): MediaItem[] {
  const media: MediaItem[] = [];

  // Parse photos
  if (data.photos && Array.isArray(data.photos) && data.photos.length > 0) {
    data.photos.forEach((photo) => {
      if (photo.url) {
        media.push({
          type: 'photo',
          url: photo.url,
          width: photo.width,
          height: photo.height,
        });
      }
    });
  }

  // Parse video
  if (data.video) {
    media.push({
      type: 'video',
      thumbnail: data.video.poster,
      variants: data.video.variants || [],
    });
  }

  return media;
}

