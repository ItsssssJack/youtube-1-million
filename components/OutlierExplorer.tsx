import React, { useState, useEffect } from 'react';
import { Outlier } from '../types';
import { Eye, Clock, Calendar, AlertCircle, RefreshCw, TrendingUp } from 'lucide-react';
import { getOutliers } from '../services/supabase/outliers';

const OutlierExplorer: React.FC = () => {
  const [outliers, setOutliers] = useState<Outlier[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'new'>('all');
  const [minScore, setMinScore] = useState(6);

  // Load outliers on mount
  useEffect(() => {
    loadOutliers();
  }, [filter, minScore]);

  const loadOutliers = async () => {
    setLoading(true);
    try {
      const data = await getOutliers({
        status: filter === 'active' ? 'active' : undefined,
        onlyNew: filter === 'new',
        minScore: minScore,
      });
      setOutliers(data);
    } catch (error) {
      console.error('Failed to load outliers:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
             <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-1">Outlier Explorer</h2>
                <p className="text-gray-500 text-sm">
                  {loading ? 'Loading...' : `${outliers.length} breakout videos in AI & Automation`}
                </p>
            </div>

            <div className="flex gap-2">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    filter === 'all'
                    ? 'bg-[#14452F] text-white shadow-lg shadow-[#14452F]/20'
                    : 'bg-white text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setFilter('new')}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    filter === 'new'
                    ? 'bg-[#EA580C] text-white shadow-lg shadow-[#EA580C]/20'
                    : 'bg-white text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  New
                </button>
                <button
                  onClick={() => setFilter('active')}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    filter === 'active'
                    ? 'bg-[#14452F] text-white shadow-lg shadow-[#14452F]/20'
                    : 'bg-white text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  Active
                </button>
                <button
                  onClick={loadOutliers}
                  disabled={loading}
                  className="px-4 py-2 rounded-full text-sm font-medium bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-50"
                  title="Refresh"
                >
                  <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                </button>
            </div>
        </div>

        {loading ? (
          <div className="text-center py-20">
            <RefreshCw className="w-8 h-8 text-gray-400 animate-spin mx-auto mb-4" />
            <p className="text-gray-500">Loading outliers...</p>
          </div>
        ) : outliers.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-gray-200">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 font-medium">No outliers found</p>
            <p className="text-gray-500 text-sm mt-2">
              Go to Competitors tab and scrape some channels to discover outliers
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {outliers.map((outlier) => (
                <div key={outlier.id} className="bg-white rounded-[1.5rem] overflow-hidden shadow-sm hover:shadow-md transition-shadow group border border-gray-100/50">
                    <div className="relative aspect-video">
                        <img src={outlier.thumbnail_url || 'https://placehold.co/1280x720/EEE/999?text=No+Thumbnail'} alt={outlier.title} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                            <a
                              href={`https://youtube.com/watch?v=${outlier.video_id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="bg-white text-gray-900 text-xs font-bold px-3 py-1.5 rounded-full hover:bg-emerald-50"
                            >
                                Watch on YouTube
                            </a>
                        </div>
                        {outlier.is_new && (
                          <div className="absolute top-3 left-3 bg-[#EA580C] text-white text-xs font-bold px-2 py-1 rounded-md shadow-sm">
                            NEW
                          </div>
                        )}
                        <div className="absolute top-3 right-3 bg-[#14452F] text-white text-xs font-bold px-2 py-1 rounded-md shadow-sm">
                            Score: {outlier.outlier_score}
                        </div>
                    </div>

                    <div className="p-5">
                        <div className="flex items-center gap-2 mb-2">
                             {outlier.multiplier && (
                               <span className="text-[10px] uppercase font-bold tracking-wider text-purple-600 bg-purple-50 px-2 py-1 rounded-md">
                                  {outlier.multiplier.toFixed(1)}x
                               </span>
                             )}
                             <span className="text-[10px] font-medium text-gray-400 flex items-center gap-1">
                                <Calendar size={10} /> {outlier.published_at ? new Date(outlier.published_at).toLocaleDateString() : 'Unknown'}
                             </span>
                        </div>

                        <h3 className="font-bold text-gray-900 leading-tight mb-3 line-clamp-2 min-h-[2.5rem]">
                            {outlier.title}
                        </h3>

                        <div className="flex items-center gap-2 mb-4">
                            <img src={`https://ui-avatars.com/api/?name=${outlier.channel_name}&background=random`} alt={outlier.channel_name} className="w-6 h-6 rounded-full" />
                            <span className="text-xs font-semibold text-gray-600">{outlier.channel_name}</span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 pt-4 border-t border-gray-100">
                             <div className="flex items-center gap-2 text-gray-500">
                                <Eye size={14} />
                                <span className="text-xs font-medium">{(outlier.views / 1000).toFixed(1)}K views</span>
                             </div>
                             <div className="flex items-center gap-2 text-gray-500">
                                <TrendingUp size={14} className={outlier.velocity_score && outlier.velocity_score > 5 ? 'text-green-500' : 'text-orange-500'} />
                                <span className="text-xs font-medium text-orange-600">
                                  {outlier.velocity_score ? `Velocity ${outlier.velocity_score.toFixed(1)}` : 'High'}
                                </span>
                             </div>
                        </div>
                    </div>
                </div>
            ))}
          </div>
        )}
    </div>
  );
};

export default OutlierExplorer;