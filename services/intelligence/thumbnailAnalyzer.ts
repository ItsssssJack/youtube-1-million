/**
 * Thumbnail Analyzer
 *
 * Analyzes video thumbnails to identify successful visual patterns:
 * - Dominant color extraction
 * - Color palette (warm vs cool)
 * - Color frequency analysis
 * - Visual pattern insights
 */

import { Outlier } from '../../types';

export interface ColorInfo {
  hex: string;
  rgb: { r: number; g: number; b: number };
  hsl: { h: number; s: number; l: number };
  frequency: number;
}

export interface ThumbnailInsights {
  dominantColors: ColorInfo[];
  colorPalettes: {
    warm: number; // Percentage of thumbnails using warm colors
    cool: number; // Percentage using cool colors
    neutral: number; // Percentage using neutral colors
  };
  brightnessAvg: number; // Average brightness (0-100)
  saturationAvg: number; // Average saturation (0-100)
  topColors: Array<{ color: string; count: number; avgScore: number }>;
}

/**
 * Extract dominant color from thumbnail URL using Canvas API
 */
export const extractDominantColor = async (imageUrl: string): Promise<ColorInfo | null> => {
  try {
    // Create image element
    const img = new Image();
    img.crossOrigin = 'Anonymous';

    return new Promise((resolve) => {
      img.onload = () => {
        try {
          // Create canvas
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(null);
            return;
          }

          // Scale down for performance
          const scale = 0.1;
          canvas.width = img.width * scale;
          canvas.height = img.height * scale;

          // Draw image
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

          // Get image data
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const pixels = imageData.data;

          // Count colors (sample every 4th pixel for performance)
          const colorCounts = new Map<string, number>();
          for (let i = 0; i < pixels.length; i += 16) {
            // Skip transparent pixels
            if (pixels[i + 3] < 128) continue;

            const r = pixels[i];
            const g = pixels[i + 1];
            const b = pixels[i + 2];

            // Quantize to reduce color space (group similar colors)
            const qR = Math.round(r / 20) * 20;
            const qG = Math.round(g / 20) * 20;
            const qB = Math.round(b / 20) * 20;

            const key = `${qR},${qG},${qB}`;
            colorCounts.set(key, (colorCounts.get(key) || 0) + 1);
          }

          // Find most common color
          let maxCount = 0;
          let dominantRgb = { r: 0, g: 0, b: 0 };

          colorCounts.forEach((count, key) => {
            if (count > maxCount) {
              maxCount = count;
              const [r, g, b] = key.split(',').map(Number);
              dominantRgb = { r, g, b };
            }
          });

          const hsl = rgbToHsl(dominantRgb.r, dominantRgb.g, dominantRgb.b);
          const hex = rgbToHex(dominantRgb.r, dominantRgb.g, dominantRgb.b);

          resolve({
            hex,
            rgb: dominantRgb,
            hsl,
            frequency: maxCount,
          });
        } catch (error) {
          console.error('Error processing image:', error);
          resolve(null);
        }
      };

      img.onerror = () => {
        resolve(null);
      };

      img.src = imageUrl;
    });
  } catch (error) {
    console.error('Error loading image:', error);
    return null;
  }
};

/**
 * Analyze thumbnails to extract color insights
 */
export const analyzeThumbnails = async (outliers: Outlier[]): Promise<ThumbnailInsights> => {
  if (outliers.length === 0) {
    return {
      dominantColors: [],
      colorPalettes: { warm: 0, cool: 0, neutral: 0 },
      brightnessAvg: 0,
      saturationAvg: 0,
      topColors: [],
    };
  }

  // Extract dominant colors from all thumbnails
  const colorPromises = outliers.map(async (outlier) => {
    if (!outlier.thumbnail_url) return null;
    const color = await extractDominantColor(outlier.thumbnail_url);
    return { color, score: outlier.outlier_score };
  });

  const colorResults = await Promise.all(colorPromises);
  const validColors = colorResults.filter(
    (result): result is { color: ColorInfo; score: number } => result !== null && result.color !== null
  );

  if (validColors.length === 0) {
    return {
      dominantColors: [],
      colorPalettes: { warm: 0, cool: 0, neutral: 0 },
      brightnessAvg: 0,
      saturationAvg: 0,
      topColors: [],
    };
  }

  // Calculate palette distribution
  let warmCount = 0;
  let coolCount = 0;
  let neutralCount = 0;

  validColors.forEach(({ color }) => {
    const temp = getColorTemperature(color.hsl.h);
    if (temp === 'warm') warmCount++;
    else if (temp === 'cool') coolCount++;
    else neutralCount++;
  });

  const total = validColors.length;

  // Calculate averages
  const brightnessSum = validColors.reduce((sum, { color }) => sum + color.hsl.l, 0);
  const saturationSum = validColors.reduce((sum, { color }) => sum + color.hsl.s, 0);

  // Group colors by similarity
  const colorGroups = new Map<string, { count: number; totalScore: number }>();

  validColors.forEach(({ color, score }) => {
    // Group by hue bucket (30-degree buckets)
    const hueBucket = Math.floor(color.hsl.h / 30) * 30;
    const key = `hue-${hueBucket}`;

    const stats = colorGroups.get(key) || { count: 0, totalScore: 0 };
    stats.count++;
    stats.totalScore += score;
    colorGroups.set(key, stats);
  });

  const topColors = Array.from(colorGroups.entries())
    .map(([key, stats]) => ({
      color: key,
      count: stats.count,
      avgScore: stats.totalScore / stats.count,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return {
    dominantColors: validColors.slice(0, 10).map(({ color }) => color),
    colorPalettes: {
      warm: (warmCount / total) * 100,
      cool: (coolCount / total) * 100,
      neutral: (neutralCount / total) * 100,
    },
    brightnessAvg: (brightnessSum / total),
    saturationAvg: (saturationSum / total),
    topColors,
  };
};

/**
 * Get color temperature (warm/cool/neutral)
 */
const getColorTemperature = (hue: number): 'warm' | 'cool' | 'neutral' => {
  // Warm: red-yellow (0-60, 300-360)
  // Cool: green-blue (120-240)
  // Neutral: yellow-green, blue-purple (60-120, 240-300)

  if ((hue >= 0 && hue <= 60) || (hue >= 300 && hue <= 360)) {
    return 'warm';
  } else if (hue >= 120 && hue <= 240) {
    return 'cool';
  } else {
    return 'neutral';
  }
};

/**
 * Convert RGB to HSL
 */
const rgbToHsl = (r: number, g: number, b: number): { h: number; s: number; l: number } => {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
};

/**
 * Convert RGB to Hex
 */
const rgbToHex = (r: number, g: number, b: number): string => {
  return '#' + [r, g, b].map(x => {
    const hex = x.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
};

/**
 * Get simple color name from HSL
 */
export const getColorName = (hsl: { h: number; s: number; l: number }): string => {
  if (hsl.s < 10) {
    if (hsl.l < 20) return 'Black';
    if (hsl.l > 80) return 'White';
    return 'Gray';
  }

  const hue = hsl.h;

  if (hue < 15) return 'Red';
  if (hue < 45) return 'Orange';
  if (hue < 75) return 'Yellow';
  if (hue < 150) return 'Green';
  if (hue < 210) return 'Cyan';
  if (hue < 270) return 'Blue';
  if (hue < 330) return 'Purple';
  return 'Red';
};
