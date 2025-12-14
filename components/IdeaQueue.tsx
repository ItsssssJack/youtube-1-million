
import React, { useState, useEffect } from 'react';
import { Idea } from '../types';
import { MoreHorizontal, Plus, Link, ArrowRight, Loader, Play, Eye, Target, TrendingUp, ArrowUpDown } from 'lucide-react';
import { analyzeVideoUrl } from '../services/youtube/api';
import { saveIdeaToSupabase } from '../services/supabase/client';
import { getOutliers } from '../services/supabase/outliers';
import { analyzeTitles } from '../services/intelligence/titleAnalyzer';
import { scoreIdea, getPerformanceTier } from '../services/intelligence/ideaScorer';

interface IdeaQueueProps {
  ideas: Idea[];
}

const IdeaQueue: React.FC<IdeaQueueProps> = ({ ideas: initialIdeas }) => {
  const [ideas, setIdeas] = useState<Idea[]>(initialIdeas);
  const [quickUrl, setQuickUrl] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [titleInsights, setTitleInsights] = useState<any>(null);
  const [ideaScores, setIdeaScores] = useState<Map<string, any>>(new Map());
  const [sortBy, setSortBy] = useState<'status' | 'score'>('status');
  const [loadingInsights, setLoadingInsights] = useState(true);

  const statusColumns = ['Backlog', 'Scripting', 'Filming', 'Editing', 'Published'];

  // Load insights on mount
  useEffect(() => {
    const loadInsights = async () => {
      setLoadingInsights(true);
      try {
        const outliers = await getOutliers({ minScore: 6, limit: 50 });
        const insights = analyzeTitles(outliers);
        setTitleInsights(insights);

        // Score all ideas
        const scores = new Map();
        ideas.forEach(idea => {
          const score = scoreIdea(idea, insights);
          scores.set(idea.id || idea.title, score);
        });
        setIdeaScores(scores);
      } catch (error) {
        console.error('Failed to load insights:', error);
      } finally {
        setLoadingInsights(false);
      }
    };
    loadInsights();
  }, [ideas]);

  const formatK = (num?: number) => {
      if (!num) return '0';
      if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
      if (num >= 1000) return (num / 1000).toFixed(0) + 'K';
      return num.toString();
  };

  const getBadgeStyle = (multiplierStr?: string) => {
      const m = parseFloat(multiplierStr?.replace('x', '') || '0');
      if (m >= 5) return 'bg-gradient-to-r from-fuchsia-600 to-purple-600 text-white shadow-lg shadow-fuchsia-500/30'; // Viral
      if (m >= 2) return 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/30'; // High Outlier
      if (m >= 1.2) return 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white'; // Good
      return 'bg-gray-800 text-gray-200'; // Average
  };

  const handleQuickAdd = async () => {
      if (!quickUrl) return;
      
      const apiKey = localStorage.getItem('yt_api_key');
      if (!apiKey) {
          alert("Please set your YouTube API Key in Settings first.");
          return;
      }

      setAnalyzing(true);

      try {
        // 1. Analyze
        const result = await analyzeVideoUrl(apiKey, quickUrl);
        
        // 2. Format Idea
        const newIdea: Idea = {
            title: result.title,
            status: 'Backlog',
            priority: result.multiplier > 2 ? 'High' : 'Medium',
            source: 'URL Analyzer',
            score: Math.min(100, Math.round(result.multiplier * 20)),
            thumbnailUrl: result.thumbnailUrl,
            multiplier: `${result.multiplier}x`,
            viewCount: result.views,
            avgViews: result.averageViews,
            channelName: result.channelTitle
        };

        // 3. Save
        await saveIdeaToSupabase(newIdea);
        setIdeas(prev => [newIdea, ...prev]);
        setQuickUrl('');
      } catch (e: any) {
          console.error(e);
          alert("Could not analyze video: " + e.message);
      } finally {
          setAnalyzing(false);
      }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') handleQuickAdd();
  };

  // Get sorted ideas
  const getSortedIdeas = (status: string) => {
    const filtered = ideas.filter(i => i.status === status);
    if (sortBy === 'score' && titleInsights) {
      return filtered.sort((a, b) => {
        const scoreA = ideaScores.get(a.id || a.title)?.overallScore || 0;
        const scoreB = ideaScores.get(b.id || b.title)?.overallScore || 0;
        return scoreB - scoreA;
      });
    }
    return filtered;
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
       <div className="flex justify-between items-center mb-6">
            <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-1">Idea Library</h2>
                <p className="text-gray-500 text-sm">Save outliers and track production status • {!loadingInsights && 'Scored with AI'}</p>
            </div>
            <button
              onClick={() => setSortBy(sortBy === 'status' ? 'score' : 'status')}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <ArrowUpDown size={14} />
              {sortBy === 'status' ? 'Sort by Score' : 'Sort by Status'}
            </button>
       </div>

       {/* Quick Add Bar */}
       <div className="bg-white p-2 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-2 mb-8 max-w-3xl">
           <div className="p-3 bg-gray-50 text-gray-400 rounded-xl">
               <Link size={20} />
           </div>
           <input 
                type="text" 
                value={quickUrl}
                onChange={(e) => setQuickUrl(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Paste YouTube URL here..."
                className="flex-1 bg-transparent border-none focus:outline-none text-sm text-gray-800 placeholder-gray-400 h-10"
           />
           <button 
                onClick={handleQuickAdd}
                disabled={analyzing || !quickUrl}
                className="bg-[#14452F] text-white px-8 py-2.5 rounded-xl font-bold text-sm hover:bg-[#0f3624] disabled:opacity-70 transition-colors flex items-center gap-2 shadow-lg shadow-[#14452F]/20"
           >
               {analyzing ? <Loader size={16} className="animate-spin" /> : <Plus size={18} />}
               <span>Add</span>
           </button>
       </div>

       <div className="flex-1 overflow-x-auto pb-6">
           <div className="flex gap-6 min-w-max h-full">
               {statusColumns.map(status => (
                   <div key={status} className="w-[340px] flex flex-col">
                       <div className="flex justify-between items-center mb-4 px-1">
                           <h3 className="font-bold text-gray-700 text-sm flex items-center gap-2 uppercase tracking-wide">
                               {status}
                               <span className="bg-gray-200 text-gray-600 text-[10px] px-2 py-0.5 rounded-full font-bold">
                                   {ideas.filter(i => i.status === status).length}
                               </span>
                           </h3>
                           <button className="text-gray-400 hover:text-gray-600"><Plus size={16} /></button>
                       </div>
                       
                       <div className="bg-gray-50/50 rounded-2xl p-2 flex-1 space-y-4">
                           {getSortedIdeas(status).map(idea => {
                             const ideaKey = idea.id || idea.title;
                             const scoreData = ideaScores.get(ideaKey);
                             const performanceTier = scoreData ? getPerformanceTier(scoreData.overallScore) : null;

                             return (
                               <div key={ideaKey} className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all cursor-pointer group overflow-hidden relative">

                                   {/* Thumbnail Section */}
                                   {idea.thumbnailUrl && (
                                       <div className="relative aspect-video w-full bg-gray-900">
                                           <img src={idea.thumbnailUrl} alt="" className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" />

                                           {/* Outlier Badge - Styled like reference */}
                                           {idea.multiplier && (
                                                <div className={`absolute top-2 left-2 px-2.5 py-1 rounded-lg text-xs font-black tracking-wide ${getBadgeStyle(idea.multiplier)}`}>
                                                    {idea.multiplier}
                                                </div>
                                           )}

                                           {/* AI Score Badge */}
                                           {performanceTier && !loadingInsights && (
                                             <div className={`absolute top-2 right-2 px-3 py-1 rounded-lg text-xs font-black ${performanceTier.color} text-white shadow-lg flex items-center gap-1`}>
                                               <Target size={12} />
                                               {scoreData.overallScore}
                                             </div>
                                           )}

                                           {/* Hover Overlay */}
                                           <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <div className="bg-white/20 backdrop-blur-md p-3 rounded-full text-white">
                                                    <Play size={20} fill="white" />
                                                </div>
                                           </div>
                                       </div>
                                   )}

                                   <div className="p-4">
                                       <div className="flex items-start justify-between gap-2 mb-2">
                                         <h4 className="text-sm font-bold text-gray-900 leading-snug line-clamp-2 flex-1">
                                             {idea.title}
                                         </h4>
                                         {/* Score for ideas without thumbnails */}
                                         {!idea.thumbnailUrl && performanceTier && !loadingInsights && (
                                           <div className={`px-2 py-1 rounded-md text-xs font-bold ${performanceTier.color} text-white flex items-center gap-1 whitespace-nowrap`}>
                                             <Target size={10} />
                                             {scoreData.overallScore}
                                           </div>
                                         )}
                                       </div>

                                       {/* Score breakdown on hover */}
                                       {scoreData && performanceTier && !loadingInsights && (
                                         <div className="mb-2 text-xs">
                                           <div className="flex items-center gap-1 text-gray-600">
                                             <span className="font-bold text-gray-900">
                                               {performanceTier.tier} Tier
                                             </span>
                                             <span className="text-gray-400">•</span>
                                             <span>{performanceTier.label}</span>
                                           </div>
                                         </div>
                                       )}

                                       <div className="flex items-center justify-between text-xs text-gray-500 mt-3">
                                            {idea.channelName && (
                                                <span className="font-medium text-gray-700">{idea.channelName}</span>
                                            )}
                                            {idea.viewCount && idea.avgViews ? (
                                                <span className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded border border-gray-100">
                                                    <Eye size={10} className="text-gray-400" />
                                                    <span className="font-bold text-gray-900">{formatK(idea.viewCount)}</span>
                                                    <span className="text-gray-400">vs {formatK(idea.avgViews)}</span>
                                                </span>
                                            ) : (
                                                <span className="text-[10px] bg-gray-100 px-2 py-0.5 rounded text-gray-500">{idea.source}</span>
                                            )}
                                       </div>
                                   </div>
                               </div>
                             );
                           })}
                           
                           {ideas.filter(i => i.status === status).length === 0 && (
                               <div className="h-32 border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center text-gray-400 text-xs gap-2">
                                   <Plus size={24} className="opacity-20" />
                                   <span>No ideas in {status}</span>
                               </div>
                           )}
                       </div>
                   </div>
               ))}
           </div>
       </div>
    </div>
  );
};

export default IdeaQueue;
