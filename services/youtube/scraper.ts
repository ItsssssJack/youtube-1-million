/**
 * YouTube Channel Scraper
 *
 * Automated scraping service that:
 * - Fetches latest videos from tracked channels
 * - Calculates outlier scores
 * - Stores snapshots for velocity analysis
 * - Respects quota limits
 */

import { fetchChannelId, fetchChannelVideos, fetchChannelStats } from './api';
import { trackQuotaUsage, canUseQuota, getRemainingQuota } from './quota';
import { addSnapshotsBulk, getLatestSnapshot } from '../supabase/snapshots';
import { upsertOutlier } from '../supabase/outliers';
import { updateChannelStats, markChannelScraped } from '../supabase/channels';
import { detectOutlier, VideoMetrics } from '../intelligence/outlierDetector';
import { calculateVelocityBetweenSnapshots } from '../intelligence/velocityCalculator';
import { TrackedChannel, VideoSnapshotInsert, OutlierInsert } from '../../types';
import config from '../../config';

export interface ScrapeResult {
  channelId: string;
  channelName: string;
  videosScraped: number;
  outliersDetected: number;
  snapshotsStored: number;
  quotaUsed: number;
  errors: string[];
}

export interface ScrapeOptions {
  maxVideosPerChannel?: number; // Default: 5 (saves quota)
  minOutlierScore?: number; // Default: 6
  storeAllSnapshots?: boolean; // Default: false (only store outliers)
}

/**
 * Scrape a single channel
 */
export const scrapeChannel = async (
  channel: TrackedChannel,
  options: ScrapeOptions = {}
): Promise<ScrapeResult> => {
  const {
    maxVideosPerChannel = 5,
    minOutlierScore = 6,
    storeAllSnapshots = false,
  } = options;

  const result: ScrapeResult = {
    channelId: channel.channel_id,
    channelName: channel.channel_name,
    videosScraped: 0,
    outliersDetected: 0,
    snapshotsStored: 0,
    quotaUsed: 0,
    errors: [],
  };

  const quotaBefore = getRemainingQuota();

  try {
    // Check quota before expensive operations
    if (!canUseQuota('channels.list')) {
      throw new Error('Insufficient quota for channels.list');
    }

    // Fetch channel stats (1 unit)
    const stats = await fetchChannelStats(config.youtube.apiKey, channel.channel_id);
    trackQuotaUsage('channels.list');

    if (!stats) {
      throw new Error('Failed to fetch channel stats');
    }

    // Calculate average views from channel stats (approximate)
    const avgViews = channel.avg_views || stats.statistics.viewCount / stats.statistics.videoCount || 10000;

    // Fetch latest videos (1 unit)
    if (!canUseQuota('playlistItems.list')) {
      throw new Error('Insufficient quota for playlistItems.list');
    }

    const videos = await fetchChannelVideos(config.youtube.apiKey, channel.channel_id, maxVideosPerChannel);
    trackQuotaUsage('playlistItems.list');

    result.videosScraped = videos.length;

    if (videos.length === 0) {
      throw new Error('No videos found for channel');
    }

    // Process each video
    const snapshots: VideoSnapshotInsert[] = [];
    const outliers: OutlierInsert[] = [];

    for (const video of videos) {
      try {
        // Get previous snapshot to calculate velocity
        const previousSnapshot = await getLatestSnapshot(video.id);

        let velocityScore = 0;
        if (previousSnapshot) {
          const currentSnapshot = {
            video_id: video.id,
            channel_id: channel.channel_id,
            views: video.views,
            likes: video.likes || 0,
            comments: video.comments || 0,
            snapshot_at: new Date().toISOString(),
          };
          velocityScore = calculateVelocityBetweenSnapshots(currentSnapshot as any, previousSnapshot);
        }

        // Detect outlier
        const metrics: VideoMetrics = {
          videoId: video.id,
          channelId: channel.channel_id,
          views: video.views,
          likes: video.likes || 0,
          comments: video.comments || 0,
          publishedAt: video.publishDate,
          channelAvgViews: avgViews,
        };

        const outlierResult = detectOutlier(metrics);

        // Create snapshot
        const snapshot: VideoSnapshotInsert = {
          video_id: video.id,
          channel_id: channel.channel_id,
          views: video.views,
          likes: video.likes || 0,
          comments: video.comments || 0,
          title: video.title,
          thumbnail_url: video.thumbnailUrl,
          published_at: video.publishDate,
          duration: 0, // Not available in current API response
          engagement_ratio: outlierResult.engagementRatio,
          velocity_score: velocityScore || outlierResult.velocityScore,
          multiplier: outlierResult.multiplier,
          outlier_score: outlierResult.outlierScore,
          snapshot_at: new Date().toISOString(),
        };

        // Store snapshot if it's an outlier or if storeAllSnapshots is true
        if (outlierResult.isOutlier || storeAllSnapshots) {
          snapshots.push(snapshot);
        }

        // If outlier, add to outliers table
        if (outlierResult.outlierScore >= minOutlierScore) {
          const outlier: OutlierInsert = {
            video_id: video.id,
            channel_id: channel.channel_id,
            channel_name: channel.channel_name,
            title: video.title,
            thumbnail_url: video.thumbnailUrl,
            published_at: video.publishDate,
            duration: 0,
            views: video.views,
            likes: video.likes || 0,
            comments: video.comments || 0,
            multiplier: outlierResult.multiplier,
            outlier_score: outlierResult.outlierScore,
            velocity_score: velocityScore || outlierResult.velocityScore,
            engagement_ratio: outlierResult.engagementRatio,
            detected_at: new Date().toISOString(),
            last_updated_at: new Date().toISOString(),
            first_seen_views: video.views,
            status: 'active',
            is_new: true,
            priority: 5,
          };

          outliers.push(outlier);
          result.outliersDetected++;
        }
      } catch (videoError: any) {
        result.errors.push(`Video ${video.id}: ${videoError.message}`);
      }
    }

    // Bulk insert snapshots
    if (snapshots.length > 0) {
      try {
        await addSnapshotsBulk(snapshots);
        result.snapshotsStored = snapshots.length;
      } catch (snapshotError: any) {
        result.errors.push(`Snapshot insert failed: ${snapshotError.message}`);
      }
    }

    // Upsert outliers
    for (const outlier of outliers) {
      try {
        await upsertOutlier(outlier);
      } catch (outlierError: any) {
        result.errors.push(`Outlier upsert failed for ${outlier.video_id}: ${outlierError.message}`);
      }
    }

    // Update channel stats
    try {
      await updateChannelStats(channel.channel_id, {
        avg_views: avgViews,
        subscriber_count: parseInt(stats.statistics.subscriberCount || '0'),
        total_videos: parseInt(stats.statistics.videoCount || '0'),
      });
    } catch (updateError: any) {
      result.errors.push(`Channel stats update failed: ${updateError.message}`);
    }

    // Mark channel as scraped
    await markChannelScraped(channel.channel_id);

  } catch (error: any) {
    result.errors.push(`Scrape failed: ${error.message}`);
  }

  // Calculate quota used
  const quotaAfter = getRemainingQuota();
  result.quotaUsed = quotaBefore - quotaAfter;

  return result;
};

/**
 * Scrape multiple channels in sequence
 */
export const scrapeChannels = async (
  channels: TrackedChannel[],
  options: ScrapeOptions = {}
): Promise<ScrapeResult[]> => {
  const results: ScrapeResult[] = [];

  for (const channel of channels) {
    // Check if we have enough quota to continue
    const remaining = getRemainingQuota();
    if (remaining < 100) {
      console.warn('Quota too low to continue scraping. Stopping.');
      break;
    }

    console.log(`Scraping channel: ${channel.channel_name} (${channel.channel_id})`);

    try {
      const result = await scrapeChannel(channel, options);
      results.push(result);

      console.log(`✓ ${channel.channel_name}: ${result.videosScraped} videos, ${result.outliersDetected} outliers`);

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error: any) {
      console.error(`✗ ${channel.channel_name}: ${error.message}`);
      results.push({
        channelId: channel.channel_id,
        channelName: channel.channel_name,
        videosScraped: 0,
        outliersDetected: 0,
        snapshotsStored: 0,
        quotaUsed: 0,
        errors: [error.message],
      });
    }
  }

  return results;
};

/**
 * Get summary of scrape results
 */
export const getScrapeResultsSummary = (results: ScrapeResult[]) => {
  return {
    totalChannels: results.length,
    totalVideos: results.reduce((sum, r) => sum + r.videosScraped, 0),
    totalOutliers: results.reduce((sum, r) => sum + r.outliersDetected, 0),
    totalSnapshots: results.reduce((sum, r) => sum + r.snapshotsStored, 0),
    totalQuotaUsed: results.reduce((sum, r) => sum + r.quotaUsed, 0),
    totalErrors: results.reduce((sum, r) => sum + r.errors.length, 0),
    channelsWithErrors: results.filter(r => r.errors.length > 0).length,
  };
};
