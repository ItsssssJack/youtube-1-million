import React, { useState, useEffect } from 'react';
import { Database, Youtube, RefreshCw, Key, Shield, CheckCircle, AlertCircle, Save, Activity, Clock, Trash2 } from 'lucide-react';
import { fetchChannelId, fetchChannelVideos, fetchChannelStats } from '../services/youtube/api';
import { checkSupabaseConnection } from '../services/supabase/client';
import { Video } from '../types';
import { getQuotaUsage, getQuotaPercentage, getRemainingQuota } from '../services/youtube/quota';

interface SettingsProps {
    onSyncComplete: (videos: Video[], stats: any) => void;
}

const Settings: React.FC<SettingsProps> = ({ onSyncComplete }) => {
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('yt_api_key') || '');
  const [handle, setHandle] = useState(() => localStorage.getItem('yt_handle') || '');
  
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const [supabaseConnected, setSupabaseConnected] = useState(false);
  const [quotaData, setQuotaData] = useState(() => getQuotaUsage());

  useEffect(() => {
      // Check Supabase on mount
      checkSupabaseConnection().then(setSupabaseConnected);

      // Update quota every 10 seconds
      const interval = setInterval(() => {
        setQuotaData(getQuotaUsage());
      }, 10000);

      return () => clearInterval(interval);
  }, []);

  const handleSaveKeys = () => {
      localStorage.setItem('yt_api_key', apiKey);
      localStorage.setItem('yt_handle', handle);
      alert('Credentials saved to browser storage');
  };

  const handleClearData = () => {
    if (confirm('Clear all saved credentials from browser? This will reset the form.')) {
      localStorage.removeItem('yt_api_key');
      localStorage.removeItem('yt_handle');
      setApiKey('');
      setHandle('');
      alert('Credentials cleared! This is what new users will see.');
    }
  };

  // Calculate quota percentage and color
  const percentage = getQuotaPercentage();
  const getQuotaColor = () => {
    if (percentage >= 90) return { bg: 'bg-red-500', text: 'text-red-600', lightBg: 'bg-red-50' };
    if (percentage >= 75) return { bg: 'bg-orange-500', text: 'text-orange-600', lightBg: 'bg-orange-50' };
    if (percentage >= 50) return { bg: 'bg-yellow-500', text: 'text-yellow-600', lightBg: 'bg-yellow-50' };
    return { bg: 'bg-green-500', text: 'text-green-600', lightBg: 'bg-green-50' };
  };
  const quotaColor = getQuotaColor();

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

      {/* Quick Start Guide */}
      <div className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-[1.5rem] p-6 border border-blue-100">
        <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
          <span className="text-2xl">🚀</span> Quick Start Guide
        </h3>
        <div className="space-y-3 text-sm">
          <div className="flex items-start gap-3">
            <span className="font-bold text-blue-600 min-w-[24px]">1.</span>
            <div>
              <p className="font-semibold text-gray-900">Try it out with an example channel first!</p>
              <p className="text-gray-600 mt-1">Enter <code className="bg-white px-2 py-0.5 rounded text-blue-600 font-mono">@MrBeast</code> as the channel handle to see how the dashboard works (no API key needed for testing)</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="font-bold text-blue-600 min-w-[24px]">2.</span>
            <div>
              <p className="font-semibold text-gray-900">Set up your own Supabase database</p>
              <p className="text-gray-600 mt-1">Create a free account at <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">supabase.com</a>, run the migration files from <code className="bg-white px-2 py-0.5 rounded font-mono">/migrations</code>, and add your credentials to the <code className="bg-white px-2 py-0.5 rounded font-mono">.env</code> file</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="font-bold text-blue-600 min-w-[24px]">3.</span>
            <div>
              <p className="font-semibold text-gray-900">Get your YouTube API key</p>
              <p className="text-gray-600 mt-1">Visit <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Google Cloud Console</a> to create a free API key (10,000 requests/day included)</p>
            </div>
          </div>
        </div>
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
                        placeholder="@YourChannelHandle"
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
                <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900">Supabase Backend</h3>
                    <p className="text-sm text-gray-500">
                        {supabaseConnected ? 'Successfully connected to database' : 'Not connected - database features disabled'}
                    </p>
                </div>
                 {supabaseConnected && (
                    <div className="ml-auto flex items-center gap-2 text-xs font-bold text-green-600 bg-green-50 px-3 py-1 rounded-full border border-green-100">
                        <CheckCircle size={12} /> Connected
                    </div>
                )}
            </div>
            {!supabaseConnected && (
              <div className="ml-16 mt-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                <p className="text-xs font-semibold text-amber-900 mb-1">⚠️ Database Not Configured</p>
                <p className="text-xs text-amber-700">
                  You'll need to set up your own Supabase account to enable:
                  <span className="block mt-1 ml-4">• Competitor channel tracking</span>
                  <span className="block ml-4">• Outlier detection & storage</span>
                  <span className="block ml-4">• Historical velocity analysis</span>
                  <span className="block ml-4">• Automated scraping scheduler</span>
                </p>
                <p className="text-xs text-amber-700 mt-2">
                  See <code className="bg-white px-1.5 py-0.5 rounded font-mono text-amber-900">migrations/README.md</code> for setup instructions.
                </p>
              </div>
            )}
        </div>

        {/* Quota Monitoring */}
        <div className="bg-white rounded-[1.5rem] p-8 shadow-sm border border-gray-100">
            <div className="flex items-start gap-4 mb-6">
                <div className={`p-3 rounded-xl ${quotaColor.lightBg} ${quotaColor.text}`}>
                    <Activity size={24} />
                </div>
                <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900">YouTube API Quota</h3>
                    <p className="text-sm text-gray-500">Daily usage tracker • Free tier: 10,000 units/day</p>
                </div>
                <div className={`flex items-center gap-2 text-xs font-bold ${quotaColor.text} ${quotaColor.lightBg} px-3 py-1 rounded-full border ${quotaColor.text.replace('text-', 'border-').replace('600', '200')}`}>
                    {percentage.toFixed(0)}% Used
                </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-semibold text-gray-700">
                        {quotaData.used.toLocaleString()} / {quotaData.limit.toLocaleString()} units
                    </span>
                    <span className="text-sm font-medium text-gray-500">
                        {getRemainingQuota().toLocaleString()} remaining
                    </span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                    <div
                        className={`h-full ${quotaColor.bg} transition-all duration-500 rounded-full`}
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                    />
                </div>
            </div>

            {/* Info Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
                    <Clock size={18} className="text-gray-400 mt-0.5" />
                    <div>
                        <p className="text-xs font-bold text-gray-600 uppercase mb-1">Reset Time</p>
                        <p className="text-sm text-gray-900">Midnight Pacific Time</p>
                        <p className="text-xs text-gray-500 mt-1">Quota resets daily at 12:00 AM PT</p>
                    </div>
                </div>
                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
                    <Activity size={18} className="text-gray-400 mt-0.5" />
                    <div>
                        <p className="text-xs font-bold text-gray-600 uppercase mb-1">Recent Operations</p>
                        <p className="text-sm text-gray-900">{quotaData.operations.length} tracked today</p>
                        <p className="text-xs text-gray-500 mt-1">Last operation: {quotaData.operations.length > 0 ? new Date(quotaData.operations[quotaData.operations.length - 1].timestamp).toLocaleTimeString() : 'None'}</p>
                    </div>
                </div>
            </div>
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center pt-4">
            <button
                onClick={handleClearData}
                className="flex items-center gap-2 px-4 py-3 rounded-full bg-white border border-red-200 text-red-600 font-medium text-sm hover:bg-red-50 transition-all"
            >
                <Trash2 size={18} /> Clear Saved Data
            </button>
            <div className="flex gap-3">
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
    </div>
  );
};

export default Settings;