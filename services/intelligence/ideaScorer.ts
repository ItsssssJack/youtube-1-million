/**
 * Idea Scorer
 *
 * Scores content ideas based on:
 * - Title pattern match (how well it matches successful patterns)
 * - Keyword alignment (use of power words from outliers)
 * - Format scoring (listicle, how-to, question, etc.)
 * - Length optimization (optimal character count)
 * - Overall potential (combined score 0-100)
 */

import { Idea, Outlier } from '../../types';
import { TitleInsights, scoreTitleIdea } from './titleAnalyzer';
import { ThumbnailInsights } from './thumbnailAnalyzer';

export interface IdeaScore {
  ideaId: string;
  overallScore: number; // 0-100
  breakdown: {
    titleScore: number; // 0-100
    patternMatch: number; // 0-100
    keywordAlignment: number; // 0-100
    formatScore: number; // 0-100
    lengthScore: number; // 0-100
  };
  recommendations: string[];
  strengths: string[];
  improvements: string[];
}

/**
 * Score a single idea based on title insights
 */
export const scoreIdea = (idea: Idea, titleInsights: TitleInsights): IdeaScore => {
  const title = idea.title;

  // 1. Title Score (from titleAnalyzer)
  const titleScore = scoreTitleIdea(title, titleInsights);

  // 2. Pattern Match Score
  const patternMatch = calculatePatternMatch(title, titleInsights);

  // 3. Keyword Alignment Score
  const keywordAlignment = calculateKeywordAlignment(title, titleInsights);

  // 4. Format Score
  const formatScore = calculateFormatScore(title, titleInsights);

  // 5. Length Score
  const lengthScore = calculateLengthScore(title, titleInsights);

  // Calculate weighted overall score
  const overallScore = Math.round(
    titleScore * 0.3 +
    patternMatch * 0.25 +
    keywordAlignment * 0.2 +
    formatScore * 0.15 +
    lengthScore * 0.1
  );

  // Generate recommendations
  const recommendations = generateRecommendations(title, titleInsights, {
    titleScore,
    patternMatch,
    keywordAlignment,
    formatScore,
    lengthScore,
  });

  // Identify strengths
  const strengths = identifyStrengths(title, titleInsights, {
    titleScore,
    patternMatch,
    keywordAlignment,
    formatScore,
    lengthScore,
  });

  // Suggest improvements
  const improvements = suggestImprovements(title, titleInsights, {
    titleScore,
    patternMatch,
    keywordAlignment,
    formatScore,
    lengthScore,
  });

  return {
    ideaId: idea.id || idea.title,
    overallScore,
    breakdown: {
      titleScore,
      patternMatch,
      keywordAlignment,
      formatScore,
      lengthScore,
    },
    recommendations,
    strengths,
    improvements,
  };
};

/**
 * Score multiple ideas and sort by potential
 */
export const scoreIdeas = (ideas: Idea[], titleInsights: TitleInsights): IdeaScore[] => {
  return ideas
    .map(idea => scoreIdea(idea, titleInsights))
    .sort((a, b) => b.overallScore - a.overallScore);
};

/**
 * Calculate how well the title matches successful patterns
 */
const calculatePatternMatch = (title: string, insights: TitleInsights): number => {
  let score = 50; // Base score

  const lowerTitle = title.toLowerCase();

  // Check for each pattern type
  insights.patterns.forEach(pattern => {
    switch (pattern.pattern) {
      case 'Numbers':
        if (/\d+/.test(title)) {
          score += 15;
        }
        break;
      case 'Question':
        if (/^(how|why|what|when|where|which|who)/i.test(title)) {
          score += 15;
        }
        break;
      case 'Listicle':
        if (/(top|best|worst|ways|tips|things|reasons)/i.test(lowerTitle)) {
          score += 12;
        }
        break;
      case 'How-To':
        if (/how to/i.test(lowerTitle)) {
          score += 18;
        }
        break;
    }
  });

  return Math.min(100, score);
};

/**
 * Calculate keyword alignment with successful videos
 */
const calculateKeywordAlignment = (title: string, insights: TitleInsights): number => {
  const lowerTitle = title.toLowerCase();
  let matches = 0;

  // Check for power words (common words from successful videos)
  insights.commonWords.slice(0, 20).forEach(({ word }) => {
    if (lowerTitle.includes(word.toLowerCase())) {
      matches++;
    }
  });

  // Check for trigger words
  insights.triggerWords.forEach(trigger => {
    if (lowerTitle.includes(trigger.toLowerCase())) {
      matches += 1.5; // Trigger words are more valuable
    }
  });

  // Convert to 0-100 scale (assume max 10 matches is excellent)
  return Math.min(100, matches * 10);
};

/**
 * Calculate format score based on structure
 */
const calculateFormatScore = (title: string, insights: TitleInsights): number => {
  let score = 60; // Base score

  // Has capitalization (better readability)
  if (/[A-Z]/.test(title)) {
    score += 10;
  }

  // Not all caps (less spammy)
  if (!/^[A-Z\s\d]+$/.test(title)) {
    score += 5;
  }

  // Has punctuation variety (more engaging)
  const punctuation = title.match(/[!?:]/g);
  if (punctuation && punctuation.length > 0 && punctuation.length <= 2) {
    score += 10;
  }

  // Starts with power word
  const firstWord = title.split(' ')[0].toLowerCase();
  if (insights.triggerWords.includes(firstWord)) {
    score += 15;
  }

  return Math.min(100, score);
};

/**
 * Calculate length score based on optimal range
 */
const calculateLengthScore = (title: string, insights: TitleInsights): number => {
  const length = title.length;
  const optimal = insights.lengthRange.optimal;
  const avg = insights.avgLength;

  // Perfect match
  if (Math.abs(length - optimal) <= 5) {
    return 100;
  }

  // Close to optimal (within 10 chars)
  if (Math.abs(length - optimal) <= 10) {
    return 90;
  }

  // Near average (within 15 chars)
  if (Math.abs(length - avg) <= 15) {
    return 75;
  }

  // Too short or too long
  if (length < 30 || length > 100) {
    return 40;
  }

  // Acceptable range
  return 60;
};

/**
 * Generate actionable recommendations
 */
const generateRecommendations = (
  title: string,
  insights: TitleInsights,
  scores: any
): string[] => {
  const recommendations: string[] = [];

  // Pattern recommendations
  if (scores.patternMatch < 70) {
    const topPattern = insights.patterns[0];
    if (topPattern) {
      recommendations.push(`Consider using a ${topPattern.pattern} format (avg score: ${topPattern.avgScore.toFixed(1)}/10)`);
    }
  }

  // Keyword recommendations
  if (scores.keywordAlignment < 60) {
    const topWords = insights.commonWords.slice(0, 3).map(w => w.word).join(', ');
    recommendations.push(`Include power words like: ${topWords}`);
  }

  // Length recommendations
  if (scores.lengthScore < 75) {
    recommendations.push(`Optimal title length is ${insights.lengthRange.optimal} characters (yours: ${title.length})`);
  }

  // Trigger word recommendations
  if (!insights.triggerWords.some(t => title.toLowerCase().includes(t))) {
    const suggestedTriggers = insights.triggerWords.slice(0, 3).join(', ');
    recommendations.push(`Add trigger words like: ${suggestedTriggers}`);
  }

  return recommendations.slice(0, 3); // Top 3 recommendations
};

/**
 * Identify what's strong about the title
 */
const identifyStrengths = (
  title: string,
  insights: TitleInsights,
  scores: any
): string[] => {
  const strengths: string[] = [];

  if (scores.patternMatch >= 80) {
    strengths.push('Follows proven successful pattern');
  }

  if (scores.keywordAlignment >= 70) {
    strengths.push('Uses high-performing keywords');
  }

  if (scores.lengthScore >= 90) {
    strengths.push('Optimal title length');
  }

  if (scores.formatScore >= 80) {
    strengths.push('Well-formatted and engaging');
  }

  if (scores.titleScore >= 80) {
    strengths.push('Strong overall title quality');
  }

  return strengths;
};

/**
 * Suggest specific improvements
 */
const suggestImprovements = (
  title: string,
  insights: TitleInsights,
  scores: any
): string[] => {
  const improvements: string[] = [];

  // Pattern improvements
  if (scores.patternMatch < 70 && !(/\d+/.test(title))) {
    improvements.push('Add a number (e.g., "5 Ways to..."');
  }

  // Keyword improvements
  if (scores.keywordAlignment < 60) {
    const missingWord = insights.commonWords.find(w =>
      !title.toLowerCase().includes(w.word.toLowerCase())
    );
    if (missingWord) {
      improvements.push(`Include "${missingWord.word}"`);
    }
  }

  // Length improvements
  if (title.length < insights.lengthRange.optimal - 10) {
    improvements.push('Title is too short - add more context');
  } else if (title.length > insights.lengthRange.optimal + 20) {
    improvements.push('Title is too long - make it more concise');
  }

  // Format improvements
  if (scores.formatScore < 70) {
    if (!/[!?]/.test(title)) {
      improvements.push('Add punctuation for emphasis (! or ?)');
    }
  }

  return improvements.slice(0, 3); // Top 3 improvements
};

/**
 * Get performance tier based on score
 */
export const getPerformanceTier = (score: number): {
  tier: string;
  color: string;
  label: string;
} => {
  if (score >= 85) {
    return {
      tier: 'S',
      color: 'bg-gradient-to-r from-yellow-400 to-orange-500',
      label: 'Exceptional',
    };
  } else if (score >= 75) {
    return {
      tier: 'A',
      color: 'bg-gradient-to-r from-green-400 to-emerald-500',
      label: 'Excellent',
    };
  } else if (score >= 65) {
    return {
      tier: 'B',
      color: 'bg-gradient-to-r from-blue-400 to-cyan-500',
      label: 'Good',
    };
  } else if (score >= 50) {
    return {
      tier: 'C',
      color: 'bg-gradient-to-r from-purple-400 to-pink-500',
      label: 'Fair',
    };
  } else {
    return {
      tier: 'D',
      color: 'bg-gradient-to-r from-gray-400 to-gray-500',
      label: 'Needs Work',
    };
  }
};
