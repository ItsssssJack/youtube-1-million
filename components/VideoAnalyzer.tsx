import React, { useState } from 'react';
import { Search, ArrowRight, Save, TrendingUp, AlertTriangle, Loader } from 'lucide-react';
import { analyzeVideoUrl } from '../services/youtubeService';
import { saveIdeaToSupabase } from '../services/supabaseClient';
import { Idea } from '../types';

interface VideoAnalyzerProps {
    onIdeaAdded: (idea: Idea) => void;
}

const VideoAnalyzer: React.FC<VideoAnalyzerProps> = ({ onIdeaAdded }) => {
    const [url, setUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);

    const handleAnalyze = async () => {
        if (!url) return;
        
        setLoading(true);
        setError('');
        setResult(null);
        
        const apiKey = localStorage.getItem('yt_api_key') || '';

        try {
            const data = await analyzeVideoUrl(apiKey, url);
            setResult(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!result) return;
        setSaving(true);

        const newIdea: Idea = {
            title: `Analyze: ${result.title}`,
            status: 'Backlog',
            priority: result.multiplier > 2 ? 'High' : 'Medium',
            source: 'URL Analyzer',
            score: Math.min(100, Math.round(result.multiplier * 20)), // Rough conversion
            thumbnailUrl: result.thumbnailUrl,
            multiplier: `${result.multiplier}x`
        };

        try {
            await saveIdeaToSupabase(newIdea);
            onIdeaAdded(newIdea);
            setUrl('');
            setResult(null);
            alert('Idea saved to Supabase!');
        } catch (err: any) {
            alert('Failed to save: ' + err.message);
        } finally {
            setSaving(false);
        }
    };

    const getMultiplierBadge = (m: number) => {
        if (m >= 5) return { color: 'bg-purple-100 text-purple-700', icon: '🔥', label: 'Viral Anomaly' };
        if (m >= 2) return { color: 'bg-green-100 text-green-700', icon: '🚀', label: 'Outlier' };
        if (m >= 1) return { color: 'bg-blue-100 text-blue-700', icon: 'wb_sunny', label: 'Above Average' };
        return { color: 'bg-gray-100 text-gray-600', icon: 'zzz', label: 'Average' };
    };

    return (
        <div className="bg-white rounded-[1.5rem] p-6 shadow-sm border border-gray-100 mb-8">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Search size={20} className="text-[#14452F]" />
                Video Outlier Calculator
            </h3>
            
            <div className="flex gap-2 mb-4">
                <input 
                    type="text" 
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="Paste YouTube Video URL (e.g. https://youtu.be/...)" 
                    className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#14452F]"
                />
                <button 
                    onClick={handleAnalyze}
                    disabled={loading || !url}
                    className="bg-[#14452F] text-white px-6 rounded-xl font-medium text-sm hover:bg-[#0f3624] disabled:opacity-70 transition-colors flex items-center gap-2"
                >
                    {loading ? <Loader size={18} className="animate-spin" /> : 'Analyze'}
                </button>
            </div>

            {error && (
                <div className="p-3 bg-red-50 text-red-600 text-xs rounded-lg flex items-center gap-2">
                    <AlertTriangle size={14} /> {error}
                </div>
            )}

            {result && (
                <div className="mt-6 bg-gray-50 rounded-xl p-4 border border-gray-200 animate-fade-in">
                    <div className="flex flex-col md:flex-row gap-6">
                        {/* Thumbnail */}
                        <div className="w-full md:w-48 aspect-video rounded-lg overflow-hidden bg-gray-200 shadow-sm flex-shrink-0 relative">
                            <img src={result.thumbnailUrl} alt="Thumb" className="w-full h-full object-cover" />
                             {/* Multiplier Badge on Thumbnail */}
                             <div className="absolute top-2 right-2 shadow-lg">
                                <span className={`px-2 py-1 rounded-md text-xs font-bold ${getMultiplierBadge(result.multiplier).color} border border-white/20`}>
                                    {result.multiplier}x
                                </span>
                             </div>
                        </div>

                        {/* Stats */}
                        <div className="flex-1 space-y-3">
                            <div>
                                <h4 className="font-bold text-gray-900 leading-tight">{result.title}</h4>
                                <p className="text-xs text-gray-500 mt-1">{result.channelTitle} • Published {result.publishDate}</p>
                            </div>

                            <div className="flex items-center gap-4">
                                <div>
                                    <p className="text-[10px] text-gray-500 uppercase font-bold">Video Views</p>
                                    <p className="text-lg font-bold text-gray-900">{result.views.toLocaleString()}</p>
                                </div>
                                <div className="h-8 w-px bg-gray-200"></div>
                                <div>
                                    <p className="text-[10px] text-gray-500 uppercase font-bold">Channel Avg.</p>
                                    <p className="text-lg font-bold text-gray-500">{result.averageViews.toLocaleString()}</p>
                                </div>
                                <div className="h-8 w-px bg-gray-200"></div>
                                <div>
                                    <p className="text-[10px] text-gray-500 uppercase font-bold">Performance</p>
                                    <div className={`flex items-center gap-1 font-bold ${getMultiplierBadge(result.multiplier).color.split(' ')[1]}`}>
                                        <span className="text-lg">{result.multiplier}x</span>
                                        <TrendingUp size={16} />
                                    </div>
                                </div>
                            </div>

                            {/* Save Button */}
                            <div className="pt-2">
                                <button 
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="w-full md:w-auto flex items-center justify-center gap-2 bg-white border border-gray-300 hover:border-[#14452F] hover:text-[#14452F] text-gray-700 px-4 py-2 rounded-lg text-sm font-semibold transition-all"
                                >
                                    {saving ? <Loader size={16} className="animate-spin" /> : <Save size={16} />}
                                    Save Idea to Supabase
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default VideoAnalyzer;