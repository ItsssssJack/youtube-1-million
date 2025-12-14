/**
 * Recommendation Engine
 *
 * Generates content recommendations based on:
 * - Title pattern analysis
 * - Topic gap detection
 * - Success pattern matching
 * - Trend detection
 */

import { Outlier } from '../../types';
import { TitleInsights, scoreTitleIdea } from './titleAnalyzer';
import { ThumbnailInsights } from './thumbnailAnalyzer';

export interface ContentRecommendation {
  id: string;
  title: string;
  description: string;
  score: number;
  reasons: string[];
  category: 'gap' | 'trending' | 'pattern';
  suggestedElements: {
    titleFormat?: string;
    colorScheme?: string;
    keywords: string[];
  };
}

export interface RecommendationInsights {
  recommendations: ContentRecommendation[];
  gaps: string[];
  trends: string[];
  opportunities: number;
}

/**
 * Generate content recommendations from outlier data
 */
export const generateRecommendations = (
  outliers: Outlier[],
  titleInsights: TitleInsights,
  thumbnailInsights: ThumbnailInsights
): RecommendationInsights => {
  if (outliers.length === 0) {
    return {
      recommendations: [],
      gaps: [],
      trends: [],
      opportunities: 0,
    };
  }

  const recommendations: ContentRecommendation[] = [];

  // 1. Gap-based recommendations (topics not well covered)
  const gapRecs = generateGapRecommendations(outliers, titleInsights);
  recommendations.push(...gapRecs);

  // 2. Pattern-based recommendations (replicate successful patterns)
  const patternRecs = generatePatternRecommendations(titleInsights, thumbnailInsights);
  recommendations.push(...patternRecs);

  // 3. Trend-based recommendations (rising topics)
  const trendRecs = generateTrendRecommendations(outliers, titleInsights);
  recommendations.push(...trendRecs);

  // Sort by score
  recommendations.sort((a, b) => b.score - a.score);

  // Extract gaps and trends
  const gaps = extractGaps(outliers);
  const trends = extractTrends(outliers);

  return {
    recommendations: recommendations.slice(0, 10), // Top 10
    gaps,
    trends,
    opportunities: recommendations.length,
  };
};

/**
 * Generate gap-based recommendations
 */
const generateGapRecommendations = (
  outliers: Outlier[],
  titleInsights: TitleInsights
): ContentRecommendation[] => {
  const recommendations: ContentRecommendation[] = [];

  // Extract topics from titles
  const topics = extractTopics(outliers.map(o => o.title));

  // Find underrepresented topics
  const allWords = titleInsights.commonWords.map(w => w.word);
  const gaps = findTopicGaps(topics, allWords);

  gaps.forEach((gap, index) => {
    const title = generateGapTitle(gap, titleInsights);
    const score = calculateGapScore(gap, topics, titleInsights);

    recommendations.push({
      id: `gap-${index}`,
      title,
      description: `This topic is underrepresented in current outliers but shows potential based on market trends.`,
      score,
      reasons: [
        `Topic "${gap}" appears infrequently in outliers`,
        'Market gap opportunity detected',
        'Low competition potential',
      ],
      category: 'gap',
      suggestedElements: {
        titleFormat: generateTitleFormat(titleInsights),
        keywords: [gap, ...allWords.slice(0, 3)],
      },
    });
  });

  return recommendations;
};

/**
 * Generate pattern-based recommendations
 */
const generatePatternRecommendations = (
  titleInsights: TitleInsights,
  thumbnailInsights: ThumbnailInsights
): ContentRecommendation[] => {
  const recommendations: ContentRecommendation[] = [];

  // Generate ideas based on successful patterns
  titleInsights.patterns.forEach((pattern, index) => {
    const title = generatePatternTitle(pattern, titleInsights);
    const score = pattern.avgScore * 10; // Convert 1-10 to 0-100

    const colorScheme = determineColorScheme(thumbnailInsights);

    recommendations.push({
      id: `pattern-${index}`,
      title,
      description: `This idea follows the "${pattern.pattern}" pattern which has an average outlier score of ${pattern.avgScore.toFixed(1)}.`,
      score,
      reasons: [
        `${pattern.pattern} pattern detected in ${pattern.frequency} outliers`,
        `Average score: ${pattern.avgScore.toFixed(1)}/10`,
        'Proven format success',
      ],
      category: 'pattern',
      suggestedElements: {
        titleFormat: pattern.pattern,
        colorScheme,
        keywords: titleInsights.commonWords.slice(0, 5).map(w => w.word),
      },
    });
  });

  return recommendations;
};

/**
 * Generate trend-based recommendations
 */
const generateTrendRecommendations = (
  outliers: Outlier[],
  titleInsights: TitleInsights
): ContentRecommendation[] => {
  const recommendations: ContentRecommendation[] = [];

  // Find trending keywords (words with high recent frequency)
  const recentOutliers = outliers.filter(o => {
    if (!o.published_at) return false;
    const daysSince = (Date.now() - new Date(o.published_at).getTime()) / (1000 * 60 * 60 * 24);
    return daysSince <= 7; // Last 7 days
  });

  if (recentOutliers.length < 3) return recommendations;

  const recentTopics = extractTopics(recentOutliers.map(o => o.title));
  const trendingTopics = findTrendingTopics(recentTopics);

  trendingTopics.slice(0, 3).forEach((topic, index) => {
    const title = generateTrendTitle(topic, titleInsights);
    const score = 75 + (10 - index * 2); // High score for trending topics

    recommendations.push({
      id: `trend-${index}`,
      title,
      description: `"${topic}" is trending in recent high-performing videos.`,
      score,
      reasons: [
        `Trending topic in recent outliers`,
        'High momentum detected',
        'Timely opportunity',
      ],
      category: 'trending',
      suggestedElements: {
        keywords: [topic, ...titleInsights.commonWords.slice(0, 3).map(w => w.word)],
      },
    });
  });

  return recommendations;
};

/**
 * Extract topics from titles
 */
const extractTopics = (titles: string[]): string[] => {
  const topics = new Set<string>();

  titles.forEach(title => {
    // Extract capitalized phrases (likely topics/names)
    const matches = title.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g);
    if (matches) {
      matches.forEach(match => topics.add(match));
    }

    // Extract quoted phrases
    const quoted = title.match(/"([^"]+)"/g);
    if (quoted) {
      quoted.forEach(q => topics.add(q.replace(/"/g, '')));
    }
  });

  return Array.from(topics);
};

/**
 * Find topic gaps
 */
const findTopicGaps = (topics: string[], commonWords: string[]): string[] => {
  // Potential topics not yet well covered
  const potentialTopics = ['AI Automation', 'Productivity', 'ChatGPT', 'Claude', 'No-Code', 'API Integration'];

  return potentialTopics.filter(topic => {
    const topicWords = topic.toLowerCase().split(' ');
    return !topicWords.some(word => commonWords.includes(word));
  });
};

/**
 * Find trending topics
 */
const findTrendingTopics = (topics: string[]): string[] => {
  const frequency = new Map<string, number>();

  topics.forEach(topic => {
    frequency.set(topic, (frequency.get(topic) || 0) + 1);
  });

  return Array.from(frequency.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([topic]) => topic);
};

/**
 * Generate title for gap recommendation
 */
const generateGapTitle = (gap: string, insights: TitleInsights): string => {
  const patterns = insights.patterns;

  if (patterns.find(p => p.pattern === 'How-To')) {
    return `How to Use ${gap} for Maximum Productivity`;
  } else if (patterns.find(p => p.pattern === 'Numbers')) {
    return `5 Ways ${gap} Will Transform Your Workflow`;
  } else if (patterns.find(p => p.pattern === 'Question')) {
    return `Why ${gap} is the Future of Automation`;
  } else {
    return `The Ultimate ${gap} Guide`;
  }
};

/**
 * Generate title for pattern recommendation
 */
const generatePatternTitle = (pattern: any, insights: TitleInsights): string => {
  const topWord = insights.commonWords[0]?.word || 'automation';

  switch (pattern.pattern) {
    case 'Numbers':
      return `7 ${topWord.charAt(0).toUpperCase() + topWord.slice(1)} Hacks You Need to Know`;
    case 'How-To':
      return `How to Master ${topWord.charAt(0).toUpperCase() + topWord.slice(1)} in 2025`;
    case 'Question':
      return `Why Everyone is Talking About ${topWord.charAt(0).toUpperCase() + topWord.slice(1)}`;
    case 'Listicle':
      return `Top 10 ${topWord.charAt(0).toUpperCase() + topWord.slice(1)} Tools`;
    default:
      return `The ${topWord.charAt(0).toUpperCase() + topWord.slice(1)} Revolution`;
  }
};

/**
 * Generate title for trend recommendation
 */
const generateTrendTitle = (topic: string, insights: TitleInsights): string => {
  if (insights.patterns.find(p => p.pattern === 'Numbers')) {
    return `5 ${topic} Trends Exploding Right Now`;
  } else {
    return `Why ${topic} is Blowing Up in 2025`;
  }
};

/**
 * Generate title format suggestion
 */
const generateTitleFormat = (insights: TitleInsights): string => {
  const topPattern = insights.patterns[0];
  if (!topPattern) return '[Number] [Topic] [Benefit]';

  switch (topPattern.pattern) {
    case 'Numbers':
      return '[Number] [Topic] [Benefit/Action]';
    case 'How-To':
      return 'How to [Action] [Topic] [Timeframe/Benefit]';
    case 'Question':
      return 'Why/What/How [Topic] [Benefit/Outcome]';
    case 'Listicle':
      return 'Top/Best [Number] [Topic] [Category]';
    default:
      return '[Attention] [Topic] [Benefit]';
  }
};

/**
 * Determine color scheme from thumbnail insights
 */
const determineColorScheme = (insights: ThumbnailInsights): string => {
  if (insights.colorPalettes.warm > 50) return 'Warm (Red/Orange/Yellow)';
  if (insights.colorPalettes.cool > 50) return 'Cool (Blue/Green/Cyan)';
  return 'Balanced (Mix of warm and cool)';
};

/**
 * Calculate gap score
 */
const calculateGapScore = (gap: string, topics: string[], insights: TitleInsights): number => {
  // Base score for gaps
  let score = 60;

  // Bonus for completely absent topics
  if (!topics.some(t => t.toLowerCase().includes(gap.toLowerCase()))) {
    score += 20;
  }

  // Bonus if related to common words
  const relatedWords = insights.commonWords.filter(w =>
    gap.toLowerCase().includes(w.word.toLowerCase())
  );
  score += relatedWords.length * 5;

  return Math.min(100, score);
};

/**
 * Extract gaps from outliers
 */
const extractGaps = (outliers: Outlier[]): string[] => {
  const topics = extractTopics(outliers.map(o => o.title));
  const allTopics = ['AI Tools', 'Productivity', 'Automation', 'ChatGPT', 'Claude', 'APIs', 'Workflows', 'No-Code'];

  return allTopics.filter(topic =>
    !topics.some(t => t.toLowerCase().includes(topic.toLowerCase()))
  );
};

/**
 * Extract trends from outliers
 */
const extractTrends = (outliers: Outlier[]): string[] => {
  const recentOutliers = outliers.filter(o => {
    if (!o.published_at) return false;
    const daysSince = (Date.now() - new Date(o.published_at).getTime()) / (1000 * 60 * 60 * 24);
    return daysSince <= 7;
  });

  const topics = extractTopics(recentOutliers.map(o => o.title));
  return findTrendingTopics(topics).slice(0, 5);
};
