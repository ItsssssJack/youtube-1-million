import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import DashboardHome from './components/DashboardHome';
import OutlierExplorer from './components/OutlierExplorer';
import Insights from './components/Insights';
import IdeaQueue from './components/IdeaQueue';
import SparringPartner from './components/SparringPartner';
import Settings from './components/Settings';
import Competitors from './components/Competitors';
import { ViewState, Video } from './types';
import { MOCK_VIDEOS, MOCK_IDEAS } from './constants';
import { fetchChannelId, fetchChannelVideos, fetchChannelStats } from './services/youtube/api';
import config, { validateConfig } from './config';
import { useScheduler } from './hooks/useScheduler';
import { getNewOutliersCount } from './services/supabase/outliers';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>(ViewState.DASHBOARD);

  // State to hold Real Videos + Mock Outliers (Competitors)
  const [allVideos, setAllVideos] = useState<Video[]>(MOCK_VIDEOS);
  const [channelStats, setChannelStats] = useState<any>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [newOutliersCount, setNewOutliersCount] = useState(0);

  // Initialize automated scheduler (checks every 5 min, runs every 6 hours)
  const { state: schedulerState, timeUntilNext } = useScheduler({
    batchSize: 25,
    intervalHours: 6,
    maxVideosPerChannel: 5,
    minOutlierScore: 6,
  });

  // Auto-load logic
  useEffect(() => {
    const autoLoadChannel = async () => {
      // Validate configuration before attempting to load
      const validation = validateConfig();
      if (!validation.valid) {
        console.error('Missing required configuration:', validation.missing.join(', '));
        setIsInitialLoading(false);
        return;
      }

      try {
        console.log('Auto-loading channel data...');
        const resolvedId = await fetchChannelId(config.youtube.apiKey, config.youtube.defaultChannelHandle);
        if (resolvedId) {
          const videos = await fetchChannelVideos(config.youtube.apiKey, resolvedId);
          const stats = await fetchChannelStats(config.youtube.apiKey, resolvedId);

          if (videos.length > 0) {
            // Keep external outliers (competitors) from the mock data, but replace Jack's videos with real ones
            const competitors = MOCK_VIDEOS.filter(v => !v.isOwnVideo);
            setAllVideos([...videos, ...competitors]);
            setChannelStats(stats);
          }
        }
      } catch (e) {
        console.error('Auto-load failed', e);
      } finally {
        setIsInitialLoading(false);
      }
    };

    autoLoadChannel();
  }, []);

  // Fetch new outliers count on mount and every 30 seconds
  useEffect(() => {
    const fetchOutliersCount = async () => {
      try {
        const count = await getNewOutliersCount();
        setNewOutliersCount(count);
      } catch (error) {
        console.error('Failed to fetch new outliers count:', error);
      }
    };

    fetchOutliersCount();
    const interval = setInterval(fetchOutliersCount, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const handleSyncComplete = (syncedVideos: Video[], stats: any) => {
    // Keep external outliers (competitors) from the mock data, but replace Jack's videos with real ones
    const competitors = MOCK_VIDEOS.filter(v => !v.isOwnVideo);
    setAllVideos([...syncedVideos, ...competitors]);
    setChannelStats(stats);
    setCurrentView(ViewState.DASHBOARD); // Go back to dashboard to see results
  };

  const renderContent = () => {
    switch (currentView) {
      case ViewState.DASHBOARD:
        return <DashboardHome videos={allVideos} ideas={MOCK_IDEAS} onNavigate={setCurrentView} />;
      case ViewState.OUTLIERS:
        return <OutlierExplorer />;
      case ViewState.INSIGHTS:
        return <Insights />;
      case ViewState.COMPETITORS:
        return <Competitors />;
      case ViewState.IDEAS:
        return <IdeaQueue ideas={MOCK_IDEAS} />;
      case ViewState.SPARRING:
        return <SparringPartner />;
      case ViewState.SETTINGS:
        return <Settings onSyncComplete={handleSyncComplete} />;
      default:
        return <DashboardHome videos={allVideos} ideas={MOCK_IDEAS} onNavigate={setCurrentView} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-[#F4F7F6]">
      <Sidebar currentView={currentView} onChangeView={setCurrentView} newOutliersCount={newOutliersCount} />

      <main className="ml-64 flex-1 p-8 overflow-y-auto max-h-screen">
        <header className="flex justify-between items-center mb-8">
          <div className="relative w-96">
            <input
              type="text"
              placeholder="Search task, outliers, or ideas..."
              className="w-full bg-white border-none rounded-2xl py-3 pl-12 pr-4 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-[#EA580C]/20 text-gray-600"
            />
            <svg className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 transform -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
              <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-xs font-semibold text-gray-400 bg-gray-100 border border-gray-200 rounded">⌘K</kbd>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Scheduler Status */}
            {!isInitialLoading && (
              <div className="text-right">
                <div className="text-xs text-gray-500">Next Scrape</div>
                <div className="text-xs font-bold text-gray-700">{timeUntilNext || 'Ready'}</div>
              </div>
            )}

            {isInitialLoading ? (
              <div className="px-4 py-2 bg-orange-50 text-orange-700 text-xs font-bold rounded-full animate-pulse">
                Syncing Jack...
              </div>
            ) : (
              <>
                <button className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-gray-500 shadow-sm hover:text-[#EA580C] transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                </button>
                <button className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-gray-500 shadow-sm hover:text-[#EA580C] transition-colors relative">
                  <img src={channelStats?.snippet?.thumbnails?.default?.url || "https://ui-avatars.com/api/?name=Jack&background=0D8ABC&color=fff"} alt="Profile" className="w-full h-full rounded-full object-cover" />
                  <span className={`absolute top-2 right-2.5 w-2 h-2 rounded-full border border-white ${channelStats ? 'bg-orange-500' : 'bg-gray-300'}`}></span>
                </button>
              </>
            )}
          </div>
        </header>

        {renderContent()}
      </main>
    </div>
  );
};

export default App;