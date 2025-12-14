import React, { useState, useEffect } from 'react';
import { TrendingUp, Palette, Lightbulb, BarChart3, Target, Sparkles, RefreshCw } from 'lucide-react';
import { getOutliers } from '../services/supabase/outliers';
import { analyzeTitles, TitleInsights } from '../services/intelligence/titleAnalyzer';
import { analyzeThumbnails, ThumbnailInsights, getColorName } from '../services/intelligence/thumbnailAnalyzer';
import { generateRecommendations, RecommendationInsights } from '../services/intelligence/recommendationEngine';
import { Outlier } from '../types';

const Insights: React.FC = () => {
  const [outliers, setOutliers] = useState<Outlier[]>([]);
  const [titleInsights, setTitleInsights] = useState<TitleInsights | null>(null);
  const [thumbnailInsights, setThumbnailInsights] = useState<ThumbnailInsights | null>(null);
  const [recommendations, setRecommendations] = useState<RecommendationInsights | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInsights();
  }, []);

  const loadInsights = async () => {
    setLoading(true);
    try {
      // Fetch outliers
      const data = await getOutliers({ minScore: 6, limit: 50 });
      setOutliers(data);

      // Analyze titles
      const titleAnalysis = analyzeTitles(data);
      setTitleInsights(titleAnalysis);

      // Analyze thumbnails
      const thumbnailAnalysis = await analyzeThumbnails(data);
      setThumbnailInsights(thumbnailAnalysis);

      // Generate recommendations
      const recs = generateRecommendations(data, titleAnalysis, thumbnailAnalysis);
      setRecommendations(recs);
    } catch (error) {
      console.error('Failed to load insights:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen animate-fade-in">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-[#EA580C] animate-spin mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Analyzing patterns...</p>
          <p className="text-gray-400 text-sm mt-2">Extracting intelligence from {outliers.length} outliers</p>
        </div>
      </div>
    );
  }

  if (!titleInsights || !thumbnailInsights || !recommendations) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">No insights available. Scrape some channels to see patterns!</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Intelligence Insights</h2>
          <p className="text-gray-500">Discover what's working and why • {outliers.length} outliers analyzed</p>
        </div>
        <button
          onClick={loadInsights}
          className="flex items-center gap-2 px-6 py-3 rounded-full bg-[#14452F] text-white font-medium text-sm shadow-lg hover:bg-[#0f3624] transition-colors"
        >
          <RefreshCw size={16} />
          Refresh Analysis
        </button>
      </div>

      {/* Content Recommendations */}
      <div className="bg-gradient-to-br from-[#EA580C] to-[#c2410c] p-8 rounded-[2rem] shadow-lg">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
            <Sparkles size={24} className="text-white" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-white">Content Recommendations</h3>
            <p className="text-orange-100 text-sm">Data-driven ideas based on successful patterns</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {recommendations.recommendations.slice(0, 6).map((rec) => (
            <div key={rec.id} className="bg-white rounded-xl p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <span className={`text-xs font-bold uppercase px-2 py-1 rounded-md ${
                  rec.category === 'gap' ? 'bg-purple-100 text-purple-700' :
                  rec.category === 'trending' ? 'bg-green-100 text-green-700' :
                  'bg-blue-100 text-blue-700'
                }`}>
                  {rec.category}
                </span>
                <div className="flex items-center gap-1">
                  <Target size={14} className="text-orange-600" />
                  <span className="text-sm font-bold text-orange-600">{rec.score}/100</span>
                </div>
              </div>

              <h4 className="font-bold text-gray-900 mb-2 line-clamp-2">{rec.title}</h4>
              <p className="text-xs text-gray-600 mb-3 line-clamp-2">{rec.description}</p>

              <div className="space-y-1">
                {rec.reasons.slice(0, 2).map((reason, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs text-gray-500">
                    <div className="w-1 h-1 rounded-full bg-orange-500"></div>
                    <span>{reason}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Title Patterns */}
        <div className="bg-white p-8 rounded-[2rem] shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-green-50 rounded-xl">
              <BarChart3 size={24} className="text-green-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Title Patterns</h3>
              <p className="text-xs text-gray-500">What makes titles successful</p>
            </div>
          </div>

          {/* Patterns */}
          <div className="space-y-4 mb-6">
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase mb-2">Winning Formats</p>
              <div className="space-y-2">
                {titleInsights.patterns.map((pattern, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <span className="font-semibold text-gray-900">{pattern.pattern}</span>
                      <p className="text-xs text-gray-500">{pattern.frequency} videos</p>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-bold text-green-600">{pattern.avgScore.toFixed(1)}/10</span>
                      <p className="text-xs text-gray-500">avg score</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Length Sweet Spot */}
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase mb-2">Length Sweet Spot</p>
              <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg">
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-3xl font-bold text-green-700">{titleInsights.lengthRange.optimal}</span>
                  <span className="text-sm text-gray-600">characters</span>
                </div>
                <p className="text-xs text-gray-600">Optimal title length for best performance</p>
                <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                  <span>Min: {titleInsights.lengthRange.min}</span>
                  <span>Avg: {titleInsights.avgLength}</span>
                  <span>Max: {titleInsights.lengthRange.max}</span>
                </div>
              </div>
            </div>

            {/* Common Words */}
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase mb-2">Power Words</p>
              <div className="flex flex-wrap gap-2">
                {titleInsights.commonWords.slice(0, 10).map((word, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full"
                  >
                    {word.word} ({word.count})
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Thumbnail Patterns */}
        <div className="bg-white p-8 rounded-[2rem] shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-purple-50 rounded-xl">
              <Palette size={24} className="text-purple-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Visual Patterns</h3>
              <p className="text-xs text-gray-500">Thumbnail color insights</p>
            </div>
          </div>

          {/* Color Palettes */}
          <div className="space-y-4">
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase mb-3">Color Temperature</p>
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700">Warm</span>
                      <span className="text-xs font-bold text-orange-600">{thumbnailInsights.colorPalettes.warm.toFixed(0)}%</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-red-400 to-orange-400"
                        style={{ width: `${thumbnailInsights.colorPalettes.warm}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700">Cool</span>
                      <span className="text-xs font-bold text-blue-600">{thumbnailInsights.colorPalettes.cool.toFixed(0)}%</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-400 to-cyan-400"
                        style={{ width: `${thumbnailInsights.colorPalettes.cool}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700">Neutral</span>
                      <span className="text-xs font-bold text-gray-600">{thumbnailInsights.colorPalettes.neutral.toFixed(0)}%</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-gray-300 to-gray-400"
                        style={{ width: `${thumbnailInsights.colorPalettes.neutral}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Brightness & Saturation */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 bg-gradient-to-br from-yellow-50 to-amber-50 rounded-lg">
                <p className="text-xs font-bold text-gray-600 uppercase mb-1">Brightness</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-yellow-700">{thumbnailInsights.brightnessAvg.toFixed(0)}</span>
                  <span className="text-xs text-gray-600">/100</span>
                </div>
              </div>

              <div className="p-4 bg-gradient-to-br from-pink-50 to-purple-50 rounded-lg">
                <p className="text-xs font-bold text-gray-600 uppercase mb-1">Saturation</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-purple-700">{thumbnailInsights.saturationAvg.toFixed(0)}</span>
                  <span className="text-xs text-gray-600">/100</span>
                </div>
              </div>
            </div>

            {/* Dominant Colors */}
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase mb-3">Dominant Colors</p>
              <div className="flex flex-wrap gap-2">
                {thumbnailInsights.dominantColors.slice(0, 8).map((color, idx) => (
                  <div key={idx} className="group relative">
                    <div
                      className="w-12 h-12 rounded-lg shadow-sm ring-2 ring-white cursor-pointer hover:scale-110 transition-transform"
                      style={{ backgroundColor: color.hex }}
                      title={getColorName(color.hsl)}
                    ></div>
                    <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                      {getColorName(color.hsl)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Gaps & Trends */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-[1.5rem] shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Target size={20} className="text-purple-600" />
            <h3 className="font-bold text-gray-900">Content Gaps</h3>
          </div>
          <div className="space-y-2">
            {recommendations.gaps.length > 0 ? (
              recommendations.gaps.map((gap, idx) => (
                <div key={idx} className="p-3 bg-purple-50 rounded-lg">
                  <span className="text-sm font-semibold text-purple-700">{gap}</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500">No significant gaps detected</p>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-[1.5rem] shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={20} className="text-green-600" />
            <h3 className="font-bold text-gray-900">Trending Topics</h3>
          </div>
          <div className="space-y-2">
            {recommendations.trends.length > 0 ? (
              recommendations.trends.map((trend, idx) => (
                <div key={idx} className="p-3 bg-green-50 rounded-lg flex items-center justify-between">
                  <span className="text-sm font-semibold text-green-700">{trend}</span>
                  <span className="text-xs text-green-600">🔥 Hot</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500">No trending topics detected yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Insights;
