/**
 * Title Pattern Analyzer
 *
 * Analyzes outlier video titles to identify successful patterns:
 * - Common words and phrases
 * - Title length sweet spots
 * - Pattern types (numbers, questions, how-to, listicles)
 * - Emotional trigger words
 * - Title templates
 */

import { Outlier } from '../../types';

export interface TitlePattern {
  pattern: string;
  frequency: number;
  avgScore: number;
  examples: string[];
}

export interface TitleInsights {
  commonWords: Array<{ word: string; count: number; avgScore: number }>;
  patterns: TitlePattern[];
  avgLength: number;
  lengthRange: { min: number; max: number; optimal: number };
  triggerWords: string[];
  templates: string[];
}

// Common stop words to filter out
const STOP_WORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
  'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'be', 'been',
  'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
  'should', 'may', 'might', 'can', 'this', 'that', 'these', 'those',
  'i', 'you', 'he', 'she', 'it', 'we', 'they', 'my', 'your', 'his', 'her'
]);

// Emotional trigger words that often appear in viral titles
const TRIGGER_WORDS = [
  'secret', 'proven', 'amazing', 'insane', 'shocking', 'incredible',
  'ultimate', 'perfect', 'best', 'worst', 'never', 'always',
  'new', 'finally', 'revealed', 'exposed', 'truth', 'hidden',
  'easy', 'simple', 'quick', 'fast', 'instantly', 'now',
  'free', 'powerful', 'essential', 'must', 'need', 'why',
  'how', 'what', 'when', 'where', 'complete', 'full'
];

/**
 * Analyze titles to extract patterns and insights
 */
export const analyzeTitles = (outliers: Outlier[]): TitleInsights => {
  if (outliers.length === 0) {
    return {
      commonWords: [],
      patterns: [],
      avgLength: 0,
      lengthRange: { min: 0, max: 0, optimal: 0 },
      triggerWords: [],
      templates: [],
    };
  }

  const titles = outliers.map(o => o.title);
  const scores = outliers.map(o => o.outlier_score);

  // Word frequency analysis
  const wordFrequency = analyzeWordFrequency(titles, scores);

  // Pattern detection
  const patterns = detectPatterns(outliers);

  // Length analysis
  const lengthAnalysis = analyzeTitleLength(titles, scores);

  // Detect trigger words
  const foundTriggerWords = detectTriggerWords(titles);

  // Extract templates
  const templates = extractTemplates(titles);

  return {
    commonWords: wordFrequency.slice(0, 20), // Top 20 words
    patterns,
    avgLength: lengthAnalysis.average,
    lengthRange: lengthAnalysis.range,
    triggerWords: foundTriggerWords,
    templates: templates.slice(0, 5), // Top 5 templates
  };
};

/**
 * Analyze word frequency in titles
 */
const analyzeWordFrequency = (
  titles: string[],
  scores: number[]
): Array<{ word: string; count: number; avgScore: number }> => {
  const wordStats = new Map<string, { count: number; totalScore: number }>();

  titles.forEach((title, index) => {
    const words = title
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ') // Remove punctuation
      .split(/\s+/)
      .filter(word => word.length > 2 && !STOP_WORDS.has(word));

    words.forEach(word => {
      const stats = wordStats.get(word) || { count: 0, totalScore: 0 };
      stats.count++;
      stats.totalScore += scores[index];
      wordStats.set(word, stats);
    });
  });

  // Convert to array and calculate averages
  return Array.from(wordStats.entries())
    .map(([word, stats]) => ({
      word,
      count: stats.count,
      avgScore: stats.totalScore / stats.count,
    }))
    .filter(item => item.count > 1) // Only words that appear multiple times
    .sort((a, b) => b.count - a.count);
};

/**
 * Detect common title patterns
 */
const detectPatterns = (outliers: Outlier[]): TitlePattern[] => {
  const patterns: TitlePattern[] = [];

  // Numbers pattern (e.g., "5 Ways", "10 Tips")
  const numbersPattern = detectNumbersPattern(outliers);
  if (numbersPattern) patterns.push(numbersPattern);

  // Question pattern (e.g., "How to", "Why", "What")
  const questionPattern = detectQuestionPattern(outliers);
  if (questionPattern) patterns.push(questionPattern);

  // Listicle pattern (e.g., "Top 10", "Best")
  const listiclePattern = detectListiclePattern(outliers);
  if (listiclePattern) patterns.push(listiclePattern);

  // How-to pattern
  const howToPattern = detectHowToPattern(outliers);
  if (howToPattern) patterns.push(howToPattern);

  return patterns;
};

const detectNumbersPattern = (outliers: Outlier[]): TitlePattern | null => {
  const matches = outliers.filter(o => /\d+/.test(o.title));
  if (matches.length < 2) return null;

  const avgScore = matches.reduce((sum, o) => sum + o.outlier_score, 0) / matches.length;

  return {
    pattern: 'Numbers',
    frequency: matches.length,
    avgScore,
    examples: matches.slice(0, 3).map(o => o.title),
  };
};

const detectQuestionPattern = (outliers: Outlier[]): TitlePattern | null => {
  const matches = outliers.filter(o => /^(how|why|what|when|where|which|who)/i.test(o.title));
  if (matches.length < 2) return null;

  const avgScore = matches.reduce((sum, o) => sum + o.outlier_score, 0) / matches.length;

  return {
    pattern: 'Question',
    frequency: matches.length,
    avgScore,
    examples: matches.slice(0, 3).map(o => o.title),
  };
};

const detectListiclePattern = (outliers: Outlier[]): TitlePattern | null => {
  const matches = outliers.filter(o => /(top|best|worst|ways|tips|things|reasons)/i.test(o.title));
  if (matches.length < 2) return null;

  const avgScore = matches.reduce((sum, o) => sum + o.outlier_score, 0) / matches.length;

  return {
    pattern: 'Listicle',
    frequency: matches.length,
    avgScore,
    examples: matches.slice(0, 3).map(o => o.title),
  };
};

const detectHowToPattern = (outliers: Outlier[]): TitlePattern | null => {
  const matches = outliers.filter(o => /how to/i.test(o.title));
  if (matches.length < 2) return null;

  const avgScore = matches.reduce((sum, o) => sum + o.outlier_score, 0) / matches.length;

  return {
    pattern: 'How-To',
    frequency: matches.length,
    avgScore,
    examples: matches.slice(0, 3).map(o => o.title),
  };
};

/**
 * Analyze title length patterns
 */
const analyzeTitleLength = (
  titles: string[],
  scores: number[]
): { average: number; range: { min: number; max: number; optimal: number } } => {
  const lengths = titles.map(t => t.length);
  const average = lengths.reduce((sum, len) => sum + len, 0) / lengths.length;

  // Find optimal length (length that correlates with highest avg score)
  const lengthBuckets = new Map<number, { count: number; totalScore: number }>();

  titles.forEach((title, index) => {
    const bucket = Math.floor(title.length / 10) * 10; // Bucket by 10s
    const stats = lengthBuckets.get(bucket) || { count: 0, totalScore: 0 };
    stats.count++;
    stats.totalScore += scores[index];
    lengthBuckets.set(bucket, stats);
  });

  const optimalBucket = Array.from(lengthBuckets.entries())
    .map(([bucket, stats]) => ({ bucket, avgScore: stats.totalScore / stats.count }))
    .sort((a, b) => b.avgScore - a.avgScore)[0];

  return {
    average: Math.round(average),
    range: {
      min: Math.min(...lengths),
      max: Math.max(...lengths),
      optimal: optimalBucket ? optimalBucket.bucket : Math.round(average),
    },
  };
};

/**
 * Detect trigger words in titles
 */
const detectTriggerWords = (titles: string[]): string[] => {
  const foundWords = new Set<string>();

  titles.forEach(title => {
    const lowerTitle = title.toLowerCase();
    TRIGGER_WORDS.forEach(trigger => {
      if (lowerTitle.includes(trigger)) {
        foundWords.add(trigger);
      }
    });
  });

  return Array.from(foundWords).slice(0, 10); // Top 10 trigger words
};

/**
 * Extract common title templates
 */
const extractTemplates = (titles: string[]): string[] => {
  const templates: string[] = [];

  // Look for common structural patterns
  titles.forEach(title => {
    // Replace numbers with [NUMBER]
    let template = title.replace(/\d+/g, '[NUMBER]');

    // Replace specific words with placeholders
    template = template.replace(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g, '[TOPIC]');

    // Only add if template appears multiple times
    const count = titles.filter(t => {
      const tTemplate = t.replace(/\d+/g, '[NUMBER]').replace(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g, '[TOPIC]');
      return tTemplate === template;
    }).length;

    if (count > 1 && !templates.includes(template)) {
      templates.push(template);
    }
  });

  return templates;
};

/**
 * Get title score based on patterns
 */
export const scoreTitleIdea = (title: string, insights: TitleInsights): number => {
  let score = 50; // Base score

  const lowerTitle = title.toLowerCase();

  // Check for common words (+1 per word, max +10)
  const wordsFound = insights.commonWords.filter(({ word }) => lowerTitle.includes(word));
  score += Math.min(wordsFound.length * 2, 10);

  // Check for trigger words (+3 per word, max +15)
  const triggersFound = insights.triggerWords.filter(trigger => lowerTitle.includes(trigger));
  score += Math.min(triggersFound.length * 3, 15);

  // Check length (optimal +10, good ±10 chars +5)
  const lengthDiff = Math.abs(title.length - insights.lengthRange.optimal);
  if (lengthDiff <= 5) score += 10;
  else if (lengthDiff <= 10) score += 5;

  // Check for numbers (+5)
  if (/\d+/.test(title)) score += 5;

  // Check for question format (+5)
  if (/^(how|why|what|when|where|which)/i.test(title)) score += 5;

  return Math.min(100, Math.max(0, score));
};
