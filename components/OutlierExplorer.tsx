import React from 'react';
import { Video } from '../types';
import { Eye, Clock, Calendar, AlertCircle } from 'lucide-react';

interface OutlierExplorerProps {
  videos: Video[];
}

const OutlierExplorer: React.FC<OutlierExplorerProps> = ({ videos }) => {
  // Filter for only external videos (competitors/market)
  const externalVideos = videos.filter(v => !v.isOwnVideo);

  return (
    <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
             <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-1">Outlier Explorer</h2>
                <p className="text-gray-500 text-sm">Breakout videos in your niche (AI & Automation) to model.</p>
            </div>
            
            <div className="flex gap-2">
                 {['All', 'AI', 'No-Code', 'Business'].map((filter, idx) => (
                     <button key={filter} className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                         idx === 0 
                         ? 'bg-[#14452F] text-white shadow-lg shadow-[#14452F]/20' 
                         : 'bg-white text-gray-600 hover:bg-gray-100 border border-transparent'
                     }`}>
                         {filter}
                     </button>
                 ))}
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {externalVideos.map((video) => (
                <div key={video.id} className="bg-white rounded-[1.5rem] overflow-hidden shadow-sm hover:shadow-md transition-shadow group border border-gray-100/50">
                    <div className="relative aspect-video">
                        <img src={video.thumbnailUrl} alt={video.title} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                            <button className="bg-white text-gray-900 text-xs font-bold px-3 py-1.5 rounded-full hover:bg-emerald-50">
                                Analyze Breakdown
                            </button>
                        </div>
                        <div className="absolute top-3 right-3 bg-[#14452F] text-white text-xs font-bold px-2 py-1 rounded-md shadow-sm">
                            Score: {video.outlierScore}
                        </div>
                    </div>
                    
                    <div className="p-5">
                        <div className="flex items-center gap-2 mb-2">
                             <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">
                                {video.category}
                             </span>
                             <span className="text-[10px] font-medium text-gray-400 flex items-center gap-1">
                                <Calendar size={10} /> {video.publishDate}
                             </span>
                        </div>
                        
                        <h3 className="font-bold text-gray-900 leading-tight mb-3 line-clamp-2 min-h-[2.5rem]">
                            {video.title}
                        </h3>
                        
                        <div className="flex items-center gap-2 mb-4">
                            <img src={`https://ui-avatars.com/api/?name=${video.channelName}&background=random`} alt={video.channelName} className="w-6 h-6 rounded-full" />
                            <span className="text-xs font-semibold text-gray-600">{video.channelName}</span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 pt-4 border-t border-gray-100">
                             <div className="flex items-center gap-2 text-gray-500">
                                <Eye size={14} />
                                <span className="text-xs font-medium">{(video.views / 1000).toFixed(1)}K views</span>
                             </div>
                             <div className="flex items-center gap-2 text-gray-500">
                                <AlertCircle size={14} className="text-orange-500" />
                                <span className="text-xs font-medium text-orange-600">Velocity High</span>
                             </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    </div>
  );
};

export default OutlierExplorer;