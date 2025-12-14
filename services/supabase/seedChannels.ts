/**
 * Seed Channels Helper
 *
 * Programmatically add seed channels for AI automation niche.
 * Alternative to running SQL migrations.
 */

import { addTrackedChannel } from './channels';
import { TrackedChannelInsert } from '../../types';

export const SEED_CHANNELS: Omit<TrackedChannelInsert, 'last_scraped_at'>[] = [
  // Top Priority (10) - Major AI automation channels
  {
    channel_id: 'UCobVid_c2woyOam7RWDVoFA',
    handle: '@matthew_berman',
    channel_name: 'Matthew Berman',
    subscriber_count: 0,
    avg_views: 50000,
    total_videos: 0,
    scrape_frequency: 21600, // 6 hours
    is_active: true,
    scrape_priority: 10,
    category: 'ai_automation',
    tags: ['ai', 'automation', 'reviews', 'tutorials'],
  },
  {
    channel_id: 'UCn9RZ4_LdSVA6q4dXbVIYig',
    handle: '@mreflow',
    channel_name: 'Matt Wolfe',
    subscriber_count: 0,
    avg_views: 50000,
    total_videos: 0,
    scrape_frequency: 21600,
    is_active: true,
    scrape_priority: 10,
    category: 'ai_automation',
    tags: ['ai', 'tools', 'news', 'automation'],
  },
  {
    channel_id: 'UC2e7lWZqrNpSRaHPL-WJcaw',
    handle: '@liamonyt',
    channel_name: 'Liam Ottley',
    subscriber_count: 0,
    avg_views: 50000,
    total_videos: 0,
    scrape_frequency: 21600,
    is_active: true,
    scrape_priority: 10,
    category: 'ai_automation',
    tags: ['ai', 'agency', 'business', 'automation'],
  },

  // High Priority (8-9)
  {
    channel_id: 'UCGSyPaBoYdU_xwbBvMROqpw',
    handle: '@AIJasonZ',
    channel_name: 'AI Jason',
    subscriber_count: 0,
    avg_views: 50000,
    total_videos: 0,
    scrape_frequency: 21600,
    is_active: true,
    scrape_priority: 9,
    category: 'ai_automation',
    tags: ['ai', 'tutorials', 'chatgpt', 'automation'],
  },
  {
    channel_id: 'UC-CNymS1P5KEZRTjHELGQMQ',
    handle: '@aidrivengrowth',
    channel_name: 'World of AI',
    subscriber_count: 0,
    avg_views: 50000,
    total_videos: 0,
    scrape_frequency: 21600,
    is_active: true,
    scrape_priority: 9,
    category: 'ai_automation',
    tags: ['ai', 'news', 'tools', 'productivity'],
  },
  {
    channel_id: 'UCZ9qFEC82qM6Pk-54Q4TVWA',
    handle: '@aiadvantage',
    channel_name: 'The AI Advantage',
    subscriber_count: 0,
    avg_views: 50000,
    total_videos: 0,
    scrape_frequency: 21600,
    is_active: true,
    scrape_priority: 8,
    category: 'ai_automation',
    tags: ['ai', 'productivity', 'chatgpt', 'tutorials'],
  },
  {
    channel_id: 'UCfYsT0_xJEd3kxE-LKzENlQ',
    handle: '@aiexplained-official',
    channel_name: 'AI Explained',
    subscriber_count: 0,
    avg_views: 50000,
    total_videos: 0,
    scrape_frequency: 21600,
    is_active: true,
    scrape_priority: 8,
    category: 'ai_automation',
    tags: ['ai', 'research', 'news', 'analysis'],
  },
  {
    channel_id: 'UCDq7SjbgRKty5TgGH3sfvUg',
    handle: '@ColeMedin',
    channel_name: 'Cole Medin',
    subscriber_count: 0,
    avg_views: 50000,
    total_videos: 0,
    scrape_frequency: 21600,
    is_active: true,
    scrape_priority: 8,
    category: 'ai_automation',
    tags: ['ai', 'coding', 'tutorials', 'development'],
  },

  // Medium Priority (6-7)
  {
    channel_id: 'UCowOWMmYvmI2Q-bxkmV5N5g',
    handle: '@AdrianTwarog',
    channel_name: 'Adrian Twarog',
    subscriber_count: 0,
    avg_views: 50000,
    total_videos: 0,
    scrape_frequency: 21600,
    is_active: true,
    scrape_priority: 7,
    category: 'ai_automation',
    tags: ['ai', 'design', 'web', 'tutorials'],
  },
  {
    channel_id: 'UCq3SgLo2F8gBMEp2vQnKGig',
    handle: '@promptengineering',
    channel_name: 'Prompt Engineering',
    subscriber_count: 0,
    avg_views: 50000,
    total_videos: 0,
    scrape_frequency: 21600,
    is_active: true,
    scrape_priority: 7,
    category: 'ai_automation',
    tags: ['ai', 'prompts', 'tutorials', 'chatgpt'],
  },
  {
    channel_id: 'UC6-MYH8bCTH8RvnRJm4qmqw',
    handle: '@AllAboutAI',
    channel_name: 'All About AI',
    subscriber_count: 0,
    avg_views: 50000,
    total_videos: 0,
    scrape_frequency: 21600,
    is_active: true,
    scrape_priority: 7,
    category: 'ai_automation',
    tags: ['ai', 'news', 'tools', 'reviews'],
  },
  {
    channel_id: 'UCxjfrYRpnT8KQByIDnhFPdA',
    handle: '@MattVidPro',
    channel_name: 'MattVidPro AI',
    subscriber_count: 0,
    avg_views: 50000,
    total_videos: 0,
    scrape_frequency: 21600,
    is_active: true,
    scrape_priority: 7,
    category: 'ai_automation',
    tags: ['ai', 'news', 'commentary', 'reviews'],
  },

  // Standard Priority (5)
  {
    channel_id: 'UCRPd6lAQo0VeGn3PQGB1xBQ',
    handle: '@OlivioSarikas',
    channel_name: 'Olivio Sarikas',
    subscriber_count: 0,
    avg_views: 50000,
    total_videos: 0,
    scrape_frequency: 21600,
    is_active: true,
    scrape_priority: 5,
    category: 'ai_automation',
    tags: ['ai', 'art', 'midjourney', 'tutorials'],
  },
  {
    channel_id: 'UCbc8FEVr_S7f0KQVPFgpNSQ',
    handle: '@WesRoth',
    channel_name: 'Wes Roth',
    subscriber_count: 0,
    avg_views: 50000,
    total_videos: 0,
    scrape_frequency: 21600,
    is_active: true,
    scrape_priority: 5,
    category: 'ai_automation',
    tags: ['ai', 'news', 'philosophy', 'future'],
  },
  {
    channel_id: 'UCfYxKtdVWGCVYXU6q_YQsmw',
    handle: '@David-Ondrej',
    channel_name: 'David Ondrej',
    subscriber_count: 0,
    avg_views: 50000,
    total_videos: 0,
    scrape_frequency: 21600,
    is_active: true,
    scrape_priority: 5,
    category: 'ai_automation',
    tags: ['ai', 'automation', 'make', 'tutorials'],
  },
  {
    channel_id: 'UCeKhK19R8bSx6pPuV4FxTbw',
    handle: '@airevolution',
    channel_name: 'AI Revolution',
    subscriber_count: 0,
    avg_views: 50000,
    total_videos: 0,
    scrape_frequency: 21600,
    is_active: true,
    scrape_priority: 5,
    category: 'ai_automation',
    tags: ['ai', 'news', 'future', 'technology'],
  },
  {
    channel_id: 'UCd8pZxIZ3i2qX4YxXDhQzMA',
    handle: '@aigrid',
    channel_name: 'AI Grid',
    subscriber_count: 0,
    avg_views: 50000,
    total_videos: 0,
    scrape_frequency: 21600,
    is_active: true,
    scrape_priority: 5,
    category: 'ai_automation',
    tags: ['ai', 'news', 'tools', 'updates'],
  },
  {
    channel_id: 'UCfKXPDZMIaZdAXvDdJVwKXg',
    handle: '@aitools',
    channel_name: 'AI Tools',
    subscriber_count: 0,
    avg_views: 50000,
    total_videos: 0,
    scrape_frequency: 21600,
    is_active: true,
    scrape_priority: 5,
    category: 'ai_automation',
    tags: ['ai', 'tools', 'reviews', 'tutorials'],
  },
  {
    channel_id: 'UCqF9fkXJd3QqQzGMfN4gVag',
    handle: '@aifoundations',
    channel_name: 'AI Foundations',
    subscriber_count: 0,
    avg_views: 50000,
    total_videos: 0,
    scrape_frequency: 21600,
    is_active: true,
    scrape_priority: 5,
    category: 'ai_automation',
    tags: ['ai', 'education', 'tutorials', 'basics'],
  },
  {
    channel_id: 'UCiA7fBQ0ZBD4FZN9lXqGRBA',
    handle: '@aiandyandy',
    channel_name: 'AI Andy',
    subscriber_count: 0,
    avg_views: 50000,
    total_videos: 0,
    scrape_frequency: 21600,
    is_active: true,
    scrape_priority: 5,
    category: 'ai_automation',
    tags: ['ai', 'news', 'commentary', 'updates'],
  },
];

/**
 * Seed all channels into the database
 */
export const seedAllChannels = async (): Promise<{
  added: number;
  failed: number;
  errors: string[];
  skipped: number;
}> => {
  const result = {
    added: 0,
    failed: 0,
    skipped: 0,
    errors: [] as string[],
  };

  console.log(`🌱 Seeding ${SEED_CHANNELS.length} channels...`);

  for (const channel of SEED_CHANNELS) {
    try {
      await addTrackedChannel({
        ...channel,
        last_scraped_at: undefined,
      });
      result.added++;
      console.log(`✓ Added: ${channel.channel_name}`);
    } catch (error: any) {
      // Check if it's a duplicate error
      if (error.message.includes('duplicate') || error.message.includes('unique') || error.message.includes('already exists')) {
        result.skipped++;
        console.log(`⊘ Skipped (already exists): ${channel.channel_name}`);
      } else {
        result.failed++;
        result.errors.push(`${channel.channel_name}: ${error.message}`);
        console.error(`✗ Failed: ${channel.channel_name}`, error.message);
      }
    }
  }

  console.log(`\n✅ Seeding complete: ${result.added} added, ${result.skipped} skipped, ${result.failed} failed`);

  return result;
};
