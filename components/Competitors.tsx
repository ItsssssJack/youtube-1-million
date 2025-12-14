import React, { useState, useEffect } from 'react';
import { Plus, RefreshCw, Trash2, Edit, Check, X, AlertCircle, Users, TrendingUp, Clock, Zap } from 'lucide-react';
import { TrackedChannel } from '../types';
import { getTrackedChannels, deleteTrackedChannel, addTrackedChannel, updateTrackedChannel } from '../services/supabase/channels';
import { seedAllChannels } from '../services/supabase/seedChannels';
import { scrapeChannel } from '../services/youtube/scraper';
import { getRemainingQuota, getQuotaPercentage } from '../services/youtube/quota';

const Competitors: React.FC = () => {
  const [channels, setChannels] = useState<TrackedChannel[]>([]);
  const [loading, setLoading] = useState(true);
  const [scrapingId, setScrapingId] = useState<string | null>(null);
  const [quotaRemaining, setQuotaRemaining] = useState(0);
  const [quotaPercentage, setQuotaPercentage] = useState(0);
  const [showAddForm, setShowAddForm] = useState(false);
  const [filterActive, setFilterActive] = useState<boolean | null>(true);

  // Add channel form state
  const [newChannel, setNewChannel] = useState({
    handle: '',
    channel_name: '',
    category: 'ai_automation',
    scrape_priority: 5,
  });

  // Load channels on mount
  useEffect(() => {
    loadChannels();
    updateQuotaStatus();
  }, []);

  const loadChannels = async () => {
    setLoading(true);
    try {
      const data = await getTrackedChannels(false); // Get all channels (active and inactive)
      setChannels(data);
    } catch (error) {
      console.error('Failed to load channels:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateQuotaStatus = () => {
    setQuotaRemaining(getRemainingQuota());
    setQuotaPercentage(getQuotaPercentage());
  };

  const handleSeedChannels = async () => {
    if (!confirm('This will add 20 AI automation channels to track. Continue?')) return;

    setLoading(true);
    try {
      console.log('Starting channel seeding...');
      const result = await seedAllChannels();
      console.log('Seeding result:', result);

      let message = `✓ Seeding complete!\n\n`;
      message += `Added: ${result.added}\n`;
      message += `Skipped (already exist): ${result.skipped}\n`;
      message += `Failed: ${result.failed}`;

      if (result.errors.length > 0) {
        console.error('Seeding errors:', result.errors);
        message += `\n\nErrors:\n${result.errors.slice(0, 3).join('\n')}`;
        if (result.errors.length > 3) {
          message += `\n...and ${result.errors.length - 3} more (check console)`;
        }
      }

      alert(message);
      await loadChannels();
    } catch (error: any) {
      console.error('Seeding error:', error);
      alert(`Seeding failed: ${error.message}\n\nCheck browser console for details.`);
    } finally {
      setLoading(false);
    }
  };

  const handleScrapeChannel = async (channel: TrackedChannel) => {
    setScrapingId(channel.id);
    try {
      const result = await scrapeChannel(channel);
      if (result.errors.length > 0) {
        alert(`Scrape completed with errors:\n${result.errors.join('\n')}`);
      } else {
        alert(`✓ Scraped ${result.videosScraped} videos, found ${result.outliersDetected} outliers`);
      }
      await loadChannels();
      updateQuotaStatus();
    } catch (error: any) {
      alert(`Scrape failed: ${error.message}`);
    } finally {
      setScrapingId(null);
    }
  };

  const handleDeleteChannel = async (id: string, name: string) => {
    if (!confirm(`Delete ${name}? This cannot be undone.`)) return;

    try {
      await deleteTrackedChannel(id);
      await loadChannels();
    } catch (error: any) {
      alert(`Delete failed: ${error.message}`);
    }
  };

  const handleToggleActive = async (channel: TrackedChannel) => {
    try {
      await updateTrackedChannel(channel.id, { is_active: !channel.is_active });
      await loadChannels();
    } catch (error: any) {
      alert(`Update failed: ${error.message}`);
    }
  };

  const handleAddChannel = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newChannel.handle || !newChannel.channel_name) {
      alert('Handle and channel name are required');
      return;
    }

    setLoading(true);
    try {
      // For now, we'll use the handle as the channel_id placeholder
      // In a real implementation, you'd fetch the actual channel_id from YouTube API
      await addTrackedChannel({
        channel_id: newChannel.handle, // This should be fetched from YouTube API
        handle: newChannel.handle,
        channel_name: newChannel.channel_name,
        subscriber_count: 0,
        avg_views: 50000,
        total_videos: 0,
        scrape_frequency: 21600,
        is_active: true,
        scrape_priority: newChannel.scrape_priority,
        category: newChannel.category,
        tags: [],
      });

      setNewChannel({ handle: '', channel_name: '', category: 'ai_automation', scrape_priority: 5 });
      setShowAddForm(false);
      await loadChannels();
    } catch (error: any) {
      alert(`Add channel failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const filteredChannels = filterActive === null ? channels : channels.filter(c => c.is_active === filterActive);

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(0) + 'K';
    return num.toString();
  };

  const formatDate = (date?: string) => {
    if (!date) return 'Never';
    return new Date(date).toLocaleDateString();
  };

  const getPriorityColor = (priority: number) => {
    if (priority >= 9) return 'bg-red-100 text-red-700';
    if (priority >= 7) return 'bg-orange-100 text-orange-700';
    if (priority >= 5) return 'bg-blue-100 text-blue-700';
    return 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Competitor Channels</h1>
          <p className="text-sm text-gray-500 mt-1">
            Tracking {channels.filter(c => c.is_active).length} active channels
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Quota Status */}
          <div className="text-right">
            <div className="text-xs text-gray-500">API Quota</div>
            <div className={`text-sm font-bold ${quotaPercentage > 75 ? 'text-red-600' : quotaPercentage > 50 ? 'text-orange-600' : 'text-green-600'}`}>
              {quotaRemaining} / 10,000
            </div>
          </div>

          <button
            onClick={handleSeedChannels}
            disabled={loading}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 text-sm font-medium flex items-center gap-2"
          >
            <Zap size={16} />
            Seed 20 Channels
          </button>

          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-4 py-2 bg-[#EA580C] text-white rounded-lg hover:bg-[#C2410C] text-sm font-medium flex items-center gap-2"
          >
            <Plus size={16} />
            Add Channel
          </button>
        </div>
      </div>

      {/* Add Channel Form */}
      {showAddForm && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Add New Channel</h2>
          <form onSubmit={handleAddChannel} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Channel Handle</label>
                <input
                  type="text"
                  value={newChannel.handle}
                  onChange={(e) => setNewChannel({ ...newChannel, handle: e.target.value })}
                  placeholder="@channelhandle"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EA580C]"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Channel Name</label>
                <input
                  type="text"
                  value={newChannel.channel_name}
                  onChange={(e) => setNewChannel({ ...newChannel, channel_name: e.target.value })}
                  placeholder="Channel Display Name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EA580C]"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={newChannel.category}
                  onChange={(e) => setNewChannel({ ...newChannel, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EA580C]"
                >
                  <option value="ai_automation">AI Automation</option>
                  <option value="productivity">Productivity</option>
                  <option value="tech_review">Tech Review</option>
                  <option value="coding">Coding</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority (1-10)</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={newChannel.scrape_priority}
                  onChange={(e) => setNewChannel({ ...newChannel, scrape_priority: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EA580C]"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg text-sm font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-[#EA580C] text-white rounded-lg hover:bg-[#C2410C] disabled:opacity-50 text-sm font-medium"
              >
                Add Channel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setFilterActive(null)}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            filterActive === null
              ? 'border-[#EA580C] text-[#EA580C]'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          All ({channels.length})
        </button>
        <button
          onClick={() => setFilterActive(true)}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            filterActive === true
              ? 'border-[#EA580C] text-[#EA580C]'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Active ({channels.filter(c => c.is_active).length})
        </button>
        <button
          onClick={() => setFilterActive(false)}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            filterActive === false
              ? 'border-[#EA580C] text-[#EA580C]'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Inactive ({channels.filter(c => !c.is_active).length})
        </button>
      </div>

      {/* Channels Grid */}
      {loading ? (
        <div className="text-center py-20">
          <RefreshCw className="w-8 h-8 text-gray-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Loading channels...</p>
        </div>
      ) : filteredChannels.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-200">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">No channels found</p>
          <p className="text-gray-500 text-sm mt-2">Click "Seed 20 Channels" to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredChannels.map((channel) => (
            <div
              key={channel.id}
              className={`bg-white p-5 rounded-xl shadow-sm border ${
                channel.is_active ? 'border-gray-200' : 'border-gray-300 opacity-60'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 text-base">{channel.channel_name}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">{channel.handle || channel.channel_id}</p>
                </div>
                <span className={`px-2 py-1 text-xs font-bold rounded ${getPriorityColor(channel.scrape_priority)}`}>
                  P{channel.scrape_priority}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <div className="text-xs text-gray-500 flex items-center gap-1">
                    <Users size={12} />
                    Subscribers
                  </div>
                  <div className="text-sm font-bold text-gray-900">{formatNumber(channel.subscriber_count)}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 flex items-center gap-1">
                    <TrendingUp size={12} />
                    Avg Views
                  </div>
                  <div className="text-sm font-bold text-gray-900">{formatNumber(channel.avg_views)}</div>
                </div>
              </div>

              <div className="text-xs text-gray-500 mb-4 flex items-center gap-1">
                <Clock size={12} />
                Last scraped: {formatDate(channel.last_scraped_at)}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleScrapeChannel(channel)}
                  disabled={scrapingId === channel.id}
                  className="flex-1 px-3 py-2 bg-[#EA580C] text-white rounded-lg hover:bg-[#C2410C] disabled:opacity-50 text-xs font-medium flex items-center justify-center gap-1"
                >
                  {scrapingId === channel.id ? (
                    <>
                      <RefreshCw size={12} className="animate-spin" />
                      Scraping...
                    </>
                  ) : (
                    <>
                      <RefreshCw size={12} />
                      Scrape Now
                    </>
                  )}
                </button>
                <button
                  onClick={() => handleToggleActive(channel)}
                  className={`px-3 py-2 rounded-lg text-xs font-medium ${
                    channel.is_active
                      ? 'bg-green-100 text-green-700 hover:bg-green-200'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  title={channel.is_active ? 'Deactivate' : 'Activate'}
                >
                  {channel.is_active ? <Check size={14} /> : <X size={14} />}
                </button>
                <button
                  onClick={() => handleDeleteChannel(channel.id, channel.channel_name)}
                  className="px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 text-xs"
                  title="Delete channel"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Competitors;
