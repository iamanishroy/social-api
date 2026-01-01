import { getTweetData, TweetService, InvalidUrlError, TweetNotFoundError } from '../src';

/**
 * Example usage of the tweet service
 */
async function main(): Promise<void> {
  const tweetUrls = [
    'https://x.com/Bee_Bombshell/status/1680997123725340672',
    // Add more tweet URLs here for testing
  ];

  console.log('Fetching tweet data...\n');

  // Example 1: Using the convenience function
  for (const url of tweetUrls) {
    try {
      const data = await getTweetData(url);
      displayTweetData(data);
    } catch (error) {
      handleError(error, url);
    }
  }

  console.log('\n' + '='.repeat(60) + '\n');

  // Example 2: Using the service class with custom configuration
  const service = new TweetService({
    timeout: 15000, // 15 seconds
    language: 'en',
  });

  for (const url of tweetUrls) {
    try {
      const data = await service.getTweetData(url);
      displayTweetData(data);
    } catch (error) {
      handleError(error, url);
    }
  }
}

function displayTweetData(data: Awaited<ReturnType<typeof getTweetData>>): void {
  console.log('='.repeat(60));
  console.log('Tweet ID:', data.id);
  console.log('URL:', data.url);
  console.log('Text:', data.text);
  console.log('Author:', `${data.author.name} (@${data.author.username})`);
  console.log('Verified:', data.author.verified ? '✓' : '✗');
  console.log('Avatar:', data.author.avatar);
  console.log('Metrics:');
  console.log('  - Likes:', data.metrics.likes);
  console.log('  - Retweets:', data.metrics.retweets);
  console.log('  - Replies:', data.metrics.replies);
  console.log('  - Quotes:', data.metrics.quotes);
  console.log('Created:', data.created_at);
  console.log('Media items:', data.media.length);
  if (data.media.length > 0) {
    data.media.forEach((item, index) => {
      console.log(`  ${index + 1}. ${item.type}${item.url ? `: ${item.url}` : ''}`);
    });
  }
  console.log('='.repeat(60));
}

function handleError(error: unknown, url: string): void {
  if (error instanceof InvalidUrlError) {
    console.error(`❌ Invalid URL (${url}):`, error.message);
  } else if (error instanceof TweetNotFoundError) {
    console.error(`❌ Tweet not found (${url}):`, error.message);
  } else {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`❌ Error fetching ${url}:`, errorMessage);
  }
}

// Run the example
if (import.meta.main) {
  main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

