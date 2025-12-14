import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import StatCard from './StatCard';
import { Video, Idea, ViewState } from '../types';
import { PlayCircle, TrendingUp, Users, CheckCircle, ExternalLink, RefreshCw, LayoutGrid, List } from 'lucide-react';
import { getNewOutliersCount } from '../services/supabase/outliers';
import { getVelocityTrendData } from '../services/supabase/snapshots';

interface DashboardHomeProps {
    videos: Video[];
    ideas: Idea[];
    onNavigate: (view: ViewState) => void;
}

const DashboardHome: React.FC<DashboardHomeProps> = ({ videos, ideas, onNavigate }) => {
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');
    const [realOutlierCount, setRealOutlierCount] = useState(0);
    const [velocityChartData, setVelocityChartData] = useState<Array<{ name: string; velocity: number }>>([]);

    // Separate own videos from market outliers
    const ownVideos = videos.filter(v => v.isOwnVideo);
    const outliers = videos.filter(v => !v.isOwnVideo);

    // Fetch real outlier count and velocity data on mount
    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const [count, chartData] = await Promise.all([
                    getNewOutliersCount(),
                    getVelocityTrendData(7)
                ]);
                setRealOutlierCount(count);
                setVelocityChartData(chartData);
            } catch (error) {
                console.error('Failed to fetch dashboard data:', error);
            }
        };
        fetchDashboardData();
    }, []);

    // Check if we are viewing sample data
    const isSampleData = ownVideos.some(v => v.id === 'jack1');

    // Sort own videos by date (newest first)
    const ownVideosSorted = [...ownVideos].sort((a, b) => new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime());

    // Calculate Real Stats
    const totalViews = ownVideos.reduce((sum, v) => sum + v.views, 0);
    const avgEngagement = ownVideos.length > 0
        ? (ownVideos.reduce((sum, v) => sum + v.engagementRatio, 0) / ownVideos.length * 100).toFixed(1)
        : '0';

    const formatViews = (num: number) => {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return num.toString();
    };

    const getMultiplierStyle = (m?: number) => {
        if (!m) return 'bg-gray-100 text-gray-600';
        if (m >= 2) return 'bg-[#EA580C] text-white shadow-sm';
        if (m >= 1.2) return 'bg-orange-100 text-orange-800';
        return 'bg-gray-100 text-gray-600';
    };

    return (
        <div className="space-y-8 animate-fade-in pb-10">
            {isSampleData && (
                <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="bg-blue-100 p-2 rounded-lg text-blue-600"><RefreshCw size={18} /></div>
                        <div>
                            <p className="text-sm font-bold text-blue-800">Viewing Sample Data</p>
                            <p className="text-xs text-blue-600">Connect your actual YouTube channel in Settings to see real insights.</p>
                        </div>
                    </div>
                    <button
                        onClick={() => onNavigate(ViewState.SETTINGS)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-blue-700 transition-colors"
                    >
                        Connect Channel
                    </button>
                </div>
            )}

            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome back, Jack</h2>
                    <p className="text-gray-500">Your latest video <span className="font-bold text-gray-700">"{ownVideosSorted[0]?.title || '...'}"</span> is being tracked.</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => onNavigate(ViewState.SETTINGS)}
                        className="bg-white border border-gray-200 text-gray-700 px-6 py-2.5 rounded-full font-medium text-sm hover:bg-gray-50 transition-colors flex items-center gap-2"
                    >
                        <RefreshCw size={14} />
                        Sync Channel
                    </button>
                    <button
                        onClick={() => onNavigate(ViewState.IDEAS)}
                        className="bg-[#EA580C] text-white px-6 py-2.5 rounded-full font-medium text-sm shadow-lg shadow-[#EA580C]/20 hover:bg-[#c2410c] transition-colors flex items-center gap-2"
                    >
                        <PlayCircle size={16} />
                        Add Idea
                    </button>
                </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    label="Total Views"
                    value={formatViews(totalViews)}
                    change="Live"
                    trend="up"
                    colorClass="bg-[#EA580C]"
                    icon={<TrendingUp size={20} className="text-white" />}
                />
                <StatCard
                    label="Avg. Engagement"
                    value={`${avgEngagement}%`}
                    change="Calculated"
                    trend="neutral"
                    colorClass="bg-white"
                    icon={<Users size={20} />}
                />
                <StatCard
                    label="Market Outliers"
                    value={realOutlierCount}
                    change={realOutlierCount > 0 ? `${realOutlierCount} new` : "No new"}
                    trend={realOutlierCount > 0 ? "up" : "neutral"}
                    colorClass="bg-white"
                    icon={<TrendingUp size={20} />}
                />
                <StatCard
                    label="Ideas Queue"
                    value={ideas.length}
                    change="1 ready"
                    trend="neutral"
                    colorClass="bg-white"
                    icon={<CheckCircle size={20} />}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content Area */}
                <div className="lg:col-span-2 space-y-8">

                    {/* My Recent Videos */}
                    <div className="bg-white p-8 rounded-[2rem] shadow-sm">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-gray-900">Your Recent Uploads</h3>
                            <div className="flex bg-gray-100 rounded-lg p-1">
                                <button onClick={() => setViewMode('list')} className={`p-2 rounded-md transition-all ${viewMode === 'list' ? 'bg-white shadow text-gray-900' : 'text-gray-400'}`}>
                                    <List size={16} />
                                </button>
                                <button onClick={() => setViewMode('grid')} className={`p-2 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white shadow text-gray-900' : 'text-gray-400'}`}>
                                    <LayoutGrid size={16} />
                                </button>
                            </div>
                        </div>

                        {viewMode === 'list' ? (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                                            <th className="pb-4 pl-2">Video</th>
                                            <th className="pb-4">Published</th>
                                            <th className="pb-4">Views</th>
                                            <th className="pb-4">Performance</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-sm">
                                        {ownVideosSorted.map(video => (
                                            <tr key={video.id} className="group hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0">
                                                <td className="py-4 pl-2">
                                                    <div className="flex items-center gap-3">
                                                        <img src={video.thumbnailUrl} alt="" className="w-16 h-9 rounded-md object-cover bg-gray-100" />
                                                        <span className="font-semibold text-gray-900 line-clamp-1 max-w-[200px]">{video.title}</span>
                                                    </div>
                                                </td>
                                                <td className="py-4 text-gray-500">{video.publishDate}</td>
                                                <td className="py-4 font-medium text-gray-900">{formatViews(video.views)}</td>
                                                <td className="py-4">
                                                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${getMultiplierStyle(video.multiplier)}`}>
                                                        {video.multiplier ? `${video.multiplier}x Avg` : `Score: ${video.outlierScore}`}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                {ownVideosSorted.map(video => (
                                    <div key={video.id} className="group cursor-pointer">
                                        <div className="relative aspect-video rounded-xl overflow-hidden mb-3 border border-gray-100">
                                            <img src={video.thumbnailUrl} alt={video.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                            <div className="absolute bottom-2 right-2 bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded font-medium">
                                                {formatViews(video.views)}
                                            </div>
                                            {video.multiplier && (
                                                <div className={`absolute top-2 left-2 px-2 py-0.5 rounded text-[10px] font-bold border border-white/20 ${getMultiplierStyle(video.multiplier)}`}>
                                                    {video.multiplier}x Outlier
                                                </div>
                                            )}
                                        </div>
                                        <h4 className="font-bold text-gray-900 leading-snug line-clamp-2 group-hover:text-[#EA580C] transition-colors">{video.title}</h4>
                                        <p className="text-xs text-gray-500 mt-1">{video.publishDate} • {(video.engagementRatio * 100).toFixed(1)}% Eng.</p>
                                    </div>
                                ))}
                            </div>
                        )}

                        {ownVideosSorted.length === 0 && (
                            <div className="py-12 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                                <p className="text-gray-500 font-medium">No videos found.</p>
                                <button onClick={() => onNavigate(ViewState.SETTINGS)} className="text-[#EA580C] font-bold text-sm mt-2 hover:underline">
                                    Sync Channel Data
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Chart */}
                    <div className="bg-white p-8 rounded-[2rem] shadow-sm">
                        <div className="flex justify-between items-center mb-8">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900">Velocity Analysis</h3>
                                <p className="text-xs text-gray-400">Average velocity scores from tracked videos over the last 7 days</p>
                            </div>
                        </div>
                        <div className="h-64 w-full">
                            {velocityChartData.length === 0 ? (
                                <div className="flex items-center justify-center h-full text-gray-400">
                                    <div className="text-center">
                                        <RefreshCw size={32} className="mx-auto mb-2 opacity-50" />
                                        <p className="text-sm">No velocity data yet. Scrape some channels to see trends.</p>
                                    </div>
                                </div>
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={velocityChartData}>
                                        <XAxis
                                            dataKey="name"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: '#94a3b8', fontSize: 12 }}
                                            dy={10}
                                        />
                                        <Tooltip
                                            cursor={{ fill: '#f1f5f9', radius: 8 }}
                                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                        />
                                        <Bar dataKey="velocity" radius={[8, 8, 8, 8]}>
                                            {velocityChartData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.velocity > 5 ? '#EA580C' : '#f97316'} fillOpacity={entry.velocity > 5 ? 1 : 0.6} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </div>

                </div>

                {/* Side Panel: Market Outliers */}
                <div className="bg-white p-8 rounded-[2rem] shadow-sm flex flex-col h-fit">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold text-gray-900">Outlier Signals</h3>
                        <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-bold">Hot</span>
                    </div>

                    <div className="flex-1 space-y-6">
                        {outliers.slice(0, 3).map((video) => (
                            <div key={video.id} className="flex gap-4 group cursor-pointer relative">
                                <div className="relative w-24 h-16 rounded-xl overflow-hidden flex-shrink-0">
                                    <img src={video.thumbnailUrl} alt={video.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                    <div className="absolute top-1 right-1 bg-black/60 text-white text-[10px] px-1 rounded font-medium">{video.outlierScore}</div>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-sm font-bold text-gray-900 leading-snug line-clamp-2 group-hover:text-orange-700 transition-colors">{video.title}</h4>
                                    <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                                        {video.channelName} <ExternalLink size={10} />
                                    </p>
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                                        <button className="bg-white text-gray-900 text-xs font-bold px-3 py-1.5 rounded-full hover:bg-orange-50">
                                            Analyze Breakdown
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <button
                        onClick={() => onNavigate(ViewState.OUTLIERS)}
                        className="w-full mt-6 py-3 rounded-xl border border-gray-100 text-gray-600 text-sm font-semibold hover:bg-gray-50 transition-colors"
                    >
                        View All Signals
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DashboardHome;