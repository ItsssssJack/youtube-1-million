/**
 * Outlier Detection Algorithm
 *
 * Multi-factor scoring system to identify videos that significantly outperform
 * channel averages and merit investigation.
 *
 * Scoring factors:
 * - View multiplier (vs channel avg): 40%
 * - Velocity (views/hour acceleration): 30%
 * - Engagement ratio: 20%
 * - Recency bonus (< 48h old): 10%
 */

export interface VideoMetrics {
  videoId: string;
  channelId: string;
  views: number;
  likes: number;
  comments: number;
  publishedAt: string;
  channelAvgViews: number;
}

export interface OutlierResult {
  videoId: string;
  outlierScore: number; // 1-10
  multiplier: number;
  velocityScore: number;
  engagementRatio: number;
  isOutlier: boolean;
  reasons: string[];
}

/**
 * Calculate engagement ratio
 */
export const calculateEngagementRatio = (likes: number, comments: number, views: number): number => {
  if (views === 0) return 0;
  return (likes + comments) / views;
};

/**
 * Calculate view multiplier vs channel average
 */
export const calculateMultiplier = (videoViews: number, channelAvgViews: number): number => {
  if (channelAvgViews === 0) return 1;
  return videoViews / channelAvgViews;
};

/**
 * Calculate velocity score (views/hour since publish, normalized to 0-10 scale)
 */
export const calculateVelocityScore = (
  views: number,
  publishedAt: string,
  channelAvgViews: number
): number => {
  const publishDate = new Date(publishedAt);
  const now = new Date();
  const hoursSincePublish = (now.getTime() - publishDate.getTime()) / (1000 * 60 * 60);

  if (hoursSincePublish === 0) return 0;

  const viewsPerHour = views / hoursSincePublish;
  const avgViewsPerHour = channelAvgViews / (24 * 7); // Assume avg video gets views over 1 week

  if (avgViewsPerHour === 0) return 0;

  const velocityMultiplier = viewsPerHour / avgViewsPerHour;

  // Normalize to 0-10 scale (cap at 10)
  return Math.min(10, velocityMultiplier);
};

/**
 * Calculate recency bonus (videos < 48h old get a boost)
 */
export const calculateRecencyBonus = (publishedAt: string): number => {
  const publishDate = new Date(publishedAt);
  const now = new Date();
  const hoursSincePublish = (now.getTime() - publishDate.getTime()) / (1000 * 60 * 60);

  if (hoursSincePublish <= 24) return 1.0; // 100% bonus
  if (hoursSincePublish <= 48) return 0.5; // 50% bonus
  return 0;
};

/**
 * Detect if a video is an outlier and calculate comprehensive score
 */
export const detectOutlier = (metrics: VideoMetrics): OutlierResult => {
  const multiplier = calculateMultiplier(metrics.views, metrics.channelAvgViews);
  const engagementRatio = calculateEngagementRatio(metrics.likes, metrics.comments, metrics.views);
  const velocityScore = calculateVelocityScore(
    metrics.views,
    metrics.publishedAt,
    metrics.channelAvgViews
  );
  const recencyBonus = calculateRecencyBonus(metrics.publishedAt);

  // Weighted scoring
  let score = 0;
  const reasons: string[] = [];

  // Factor 1: View multiplier (40% weight)
  const multiplierScore = Math.min(10, (multiplier - 1) * 2); // 2x = 2 points, 6x = 10 points
  score += multiplierScore * 0.4;

  if (multiplier >= 3) {
    reasons.push(`${multiplier.toFixed(1)}x channel average`);
  }

  // Factor 2: Velocity (30% weight)
  score += velocityScore * 0.3;

  if (velocityScore >= 5) {
    reasons.push('High velocity (rapid view growth)');
  }

  // Factor 3: Engagement ratio (20% weight)
  const avgEngagementRatio = 0.05; // Typical engagement ratio ~5%
  const engagementMultiplier = engagementRatio / avgEngagementRatio;
  const engagementScore = Math.min(10, engagementMultiplier);
  score += engagementScore * 0.2;

  if (engagementRatio >= avgEngagementRatio * 1.5) {
    reasons.push('Strong engagement');
  }

  // Factor 4: Recency bonus (10% weight)
  score += recencyBonus * 10 * 0.1;

  if (recencyBonus > 0) {
    reasons.push('Recently published');
  }

  // Clamp score to 1-10
  const finalScore = Math.max(1, Math.min(10, Math.round(score)));

  // Define outlier threshold
  const isOutlier = finalScore >= 6 || multiplier >= 3;

  return {
    videoId: metrics.videoId,
    outlierScore: finalScore,
    multiplier,
    velocityScore,
    engagementRatio,
    isOutlier,
    reasons,
  };
};

/**
 * Batch detect outliers for multiple videos
 */
export const detectOutliers = (videosMetrics: VideoMetrics[]): OutlierResult[] => {
  return videosMetrics.map(detectOutlier).filter(result => result.isOutlier);
};

/**
 * Simple threshold-based outlier detection (legacy fallback)
 */
export const isSimpleOutlier = (videoViews: number, channelAvgViews: number): boolean => {
  const multiplier = calculateMultiplier(videoViews, channelAvgViews);
  return multiplier >= 2.5; // 2.5x or more is an outlier
};
