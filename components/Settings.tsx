import React, { useState, useEffect } from 'react';
import { Database, Youtube, RefreshCw, Key, Shield, CheckCircle, AlertCircle, Save } from 'lucide-react';
import { fetchChannelId, fetchChannelVideos, fetchChannelStats } from '../services/youtubeService';
import { checkSupabaseConnection } from '../services/supabaseClient';
import { Video } from '../types';

interface SettingsProps {
    onSyncComplete: (videos: Video[], stats: any) => void;
}

const Settings: React.FC<SettingsProps> = ({ onSyncComplete }) => {
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('yt_api_key') || 'AIzaSyDC12v5WFWDFV6pixUeKrv7jTx4AWAfknA');
  const [handle, setHandle] = useState(() => localStorage.getItem('yt_handle') || '@Itssssss_Jack');
  
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  
  const [supabaseConnected, setSupabaseConnected] = useState(false);

  useEffect(() => {
      // Check Supabase on mount
      checkSupabaseConnection().then(setSupabaseConnected);
  }, []);

  const handleSaveKeys = () => {
      localStorage.setItem('yt_api_key', apiKey);
      localStorage.setItem('yt_handle', handle);
      alert('Credentials saved to browser storage');
  };

  const handleSync = async () => {
    if (!apiKey) {
        setErrorMsg('Please enter a valid API Key');
        setStatus('error');
        return;
    }

    setLoading(true);
    setStatus('idle');
    setErrorMsg('');

    // Auto-save when syncing
    localStorage.setItem('yt_api_key', apiKey);
    localStorage.setItem('yt_handle', handle);

    try {
        // 1. Resolve Handle
        const resolvedId = await fetchChannelId(apiKey, handle);
        
        if (!resolvedId) {
            throw new Error(`Could not find channel for "${handle}". Check spelling or API Key permissions.`);
        }

        // 2. Fetch Data
        const videos = await fetchChannelVideos(apiKey, resolvedId);
        const stats = await fetchChannelStats(apiKey, resolvedId);

        if (videos.length > 0) {
            onSyncComplete(videos, stats);
            setStatus('success');
        } else {
            throw new Error('Channel found but no videos returned. Is the channel empty?');
        }
    } catch (err: any) {
        console.error(err);
        setStatus('error');
        setErrorMsg(err.message || 'Failed to sync. Check console for details.');
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in max-w-4xl mx-auto pb-10">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Settings & Integrations</h2>
        <p className="text-gray-500">Connect your data sources to power the intelligence engine.</p>
      </div>

      <div className="space-y-6">
        {/* YouTube Connection */}
        <div className="bg-white rounded-[1.5rem] p-8 shadow-sm border border-gray-100 relative overflow-hidden">
            {status === 'success' && (
                <div className="absolute top-0 right-0 p-4">
                    <span className="animate-pulse inline-flex h-3 w-3 rounded-full bg-green-400 opacity-75"></span>
                </div>
            )}
            
            <div className="flex items-start gap-4 mb-6">
                <div className="p-3 bg-red-50 text-red-600 rounded-xl">
                    <Youtube size={24} />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-gray-900">YouTube Data Source</h3>
                    <p className="text-sm text-gray-500">Connect your channel to pull own-video performance and outlier analysis.</p>
                </div>
                {status === 'success' ? (
                     <div className="ml-auto flex items-center gap-2 text-xs font-bold text-green-600 bg-green-50 px-3 py-1 rounded-full border border-green-100">
                        <CheckCircle size={12} /> Live Synced
                    </div>
                ) : (
                    <div className="ml-auto flex items-center gap-2 text-xs font-bold text-gray-500 bg-gray-100 px-3 py-1 rounded-full border border-gray-200">
                        <Shield size={12} /> Not Connected
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Channel Handle</label>
                    <input 
                        type="text" 
                        value={handle}
                        onChange={(e) => setHandle(e.target.value)}
                        placeholder="@Itssssss_Jack"
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#14452F] font-medium"
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">YouTube Data API Key</label>
                    <div className="relative">
                        <input 
                            type="password" 
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            placeholder="AIzaSy..." 
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#14452F]"
                        />
                        <Key size={16} className="absolute right-4 top-3.5 text-gray-400" />
                    </div>
                </div>
            </div>

             {status === 'error' && (
                <div className="mt-4 flex items-center gap-2 text-red-600 text-sm font-medium bg-red-50 p-4 rounded-xl border border-red-100">
                    <AlertCircle size={16} /> {errorMsg}
                </div>
            )}
        </div>

        {/* Supabase Connection */}
        <div className={`rounded-[1.5rem] p-8 shadow-sm border transition-colors ${supabaseConnected ? 'bg-white border-green-200' : 'bg-white border-gray-100'}`}>
             <div className="flex items-start gap-4 mb-2">
                <div className={`p-3 rounded-xl ${supabaseConnected ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-400'}`}>
                    <Database size={24} />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-gray-900">Supabase Backend</h3>
                    <p className="text-sm text-gray-500">
                        {supabaseConnected ? 'Connected to Project: gsgqulxxdxyhykyiyiap' : 'Connecting to backend...'}
                    </p>
                </div>
                 {supabaseConnected && (
                    <div className="ml-auto flex items-center gap-2 text-xs font-bold text-green-600 bg-green-50 px-3 py-1 rounded-full border border-green-100">
                        <CheckCircle size={12} /> Connected
                    </div>
                )}
            </div>
            {!supabaseConnected && <p className="text-xs text-red-400 ml-16">Could not connect. Check credentials in code.</p>}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4">
            <button 
                onClick={handleSaveKeys}
                className="flex items-center gap-2 px-6 py-3 rounded-full bg-white border border-gray-200 text-gray-700 font-medium text-sm hover:bg-gray-50 transition-all"
            >
                <Save size={18} /> Save Only
            </button>
            <button 
                onClick={handleSync}
                disabled={loading}
                className="flex items-center gap-2 px-8 py-3 rounded-full bg-[#14452F] text-white font-medium text-sm shadow-lg shadow-[#14452F]/20 hover:bg-[#0f3624] transition-all transform hover:scale-105 active:scale-95 disabled:opacity-70 disabled:scale-100"
            >
                {loading ? (
                    <><RefreshCw size={18} className="animate-spin" /> Syncing...</>
                ) : (
                    <><RefreshCw size={18} /> Sync Channel Data</>
                )}
            </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;