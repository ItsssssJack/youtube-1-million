import { Video } from '../../types';

const BASE_URL = 'https://www.googleapis.com/youtube/v3';

// Helper to extract ID from URL
const getVideoIdFromUrl = (url: string): string | null => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
};

export const analyzeVideoUrl = async (apiKey: string, url: string) => {
    try {
        const videoId = getVideoIdFromUrl(url);
        if (!videoId) throw new Error('Invalid YouTube URL');

        // 1. Fetch Video Stats
        const vidRes = await fetch(`${BASE_URL}/videos?part=snippet,statistics&id=${videoId}&key=${apiKey}`);
        const vidData = await vidRes.json();
        const videoItem = vidData.items?.[0];

        if (!videoItem) throw new Error('Video not found');

        const videoViews = parseInt(videoItem.statistics.viewCount, 10);
        const channelId = videoItem.snippet.channelId;

        // 2. Fetch Channel Recent Uploads (to calculate baseline)
        const chanRes = await fetch(`${BASE_URL}/channels?part=contentDetails&id=${channelId}&key=${apiKey}`);
        const chanData = await chanRes.json();
        const uploadsId = chanData.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;

        let averageViews = 0;
        let sampleSize = 0;

        if (uploadsId) {
            const playRes = await fetch(`${BASE_URL}/playlistItems?part=snippet&playlistId=${uploadsId}&maxResults=15&key=${apiKey}`);
            const playData = await playRes.json();
            
            // Get IDs to fetch view counts
            const ids = playData.items.map((i: any) => i.snippet.resourceId.videoId).join(',');
            const statsRes = await fetch(`${BASE_URL}/videos?part=statistics&id=${ids}&key=${apiKey}`);
            const statsData = await statsRes.json();

            // Calculate Average
            const viewsArr = statsData.items.map((i: any) => parseInt(i.statistics.viewCount, 10));
            // Filter out the video being analyzed so it doesn't skew the average too much
            const filteredViews = viewsArr.filter((v: number) => v !== videoViews);
            
            const sum = filteredViews.reduce((a: number, b: number) => a + b, 0);
            sampleSize = filteredViews.length || 1;
            averageViews = sum / sampleSize;
        }

        // 3. Calculate Multiplier
        const multiplier = averageViews > 0 ? (videoViews / averageViews) : 1.0;

        return {
            id: videoItem.id,
            title: videoItem.snippet.title,
            channelTitle: videoItem.snippet.channelTitle,
            thumbnailUrl: videoItem.snippet.thumbnails.maxres?.url || videoItem.snippet.thumbnails.medium?.url,
            views: videoViews,
            averageViews: Math.round(averageViews),
            multiplier: parseFloat(multiplier.toFixed(1)),
            publishDate: new Date(videoItem.snippet.publishedAt).toLocaleDateString()
        };

    } catch (error: any) {
        console.error('Analysis failed', error);
        throw new Error(error.message || 'Failed to analyze video');
    }
};

export const fetchChannelId = async (apiKey: string, handle: string): Promise<string | null> => {
  try {
    const handleWithAt = handle.startsWith('@') ? handle : `@${handle}`;
    
    // 1. Try Handle Lookup
    const response = await fetch(
      `${BASE_URL}/channels?part=id&forHandle=${encodeURIComponent(handleWithAt)}&key=${apiKey}`
    );
    
    if (!response.ok) {
        const err = await response.json();
        console.error('YouTube API Error (Handle Lookup):', err);
        throw new Error(err.error?.message || 'Failed to resolve handle');
    }

    const data = await response.json();
    if (data.items && data.items.length > 0) {
      return data.items[0].id;
    }

    // 2. Fallback Search
    console.warn(`Handle lookup failed for ${handle}, trying search fallback...`);
    const searchResponse = await fetch(
        `${BASE_URL}/search?part=snippet&type=channel&q=${encodeURIComponent(handle)}&key=${apiKey}`
    );
    
    if (!searchResponse.ok) {
         throw new Error('Search fallback failed');
    }

    const searchData = await searchResponse.json();
    if (searchData.items && searchData.items.length > 0) {
        return searchData.items[0].snippet.channelId;
    }

    return null;
  } catch (error: any) {
    console.error('Error fetching channel ID:', error);
    throw new Error(error.message || 'Could not find channel');
  }
};

export const fetchChannelStats = async (apiKey: string, channelId: string) => {
    try {
        const response = await fetch(
          `${BASE_URL}/channels?part=statistics,snippet&id=${channelId}&key=${apiKey}`
        );
        const data = await response.json();
        return data.items?.[0] || null;
    } catch (error) {
        console.error('Error fetching channel stats:', error);
        return null;
    }
}

export const fetchChannelVideos = async (apiKey: string, channelId: string): Promise<Video[]> => {
  try {
    // 1. Get Uploads Playlist ID
    const channelResponse = await fetch(
      `${BASE_URL}/channels?part=contentDetails&id=${channelId}&key=${apiKey}`
    );
    const channelData = await channelResponse.json();
    const uploadsPlaylistId = channelData.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;

    if (!uploadsPlaylistId) throw new Error('Could not find uploads playlist');

    // 2. Get Videos from Playlist
    const playlistResponse = await fetch(
      `${BASE_URL}/playlistItems?part=snippet&playlistId=${uploadsPlaylistId}&maxResults=20&key=${apiKey}`
    );
    const playlistData = await playlistResponse.json();
    
    if (!playlistData.items || playlistData.items.length === 0) return [];

    // 3. Get Video Stats (Views)
    const videoIds = playlistData.items.map((item: any) => item.snippet.resourceId.videoId).join(',');
    const videosResponse = await fetch(
      `${BASE_URL}/videos?part=statistics,snippet,contentDetails&id=${videoIds}&key=${apiKey}`
    );
    const videosData = await videosResponse.json();

    if (!videosData.items) return [];

    // 4. Calculate Stats
    const views = videosData.items.map((v: any) => parseInt(v.statistics.viewCount || '0', 10));
    const avgViews = views.reduce((a: number, b: number) => a + b, 0) / views.length || 1;

    // 5. Transform
    return videosData.items.map((item: any) => {
      const viewCount = parseInt(item.statistics.viewCount || '0', 10);
      const outlierScore = Math.min(10, (viewCount / avgViews) * 5); // 0-10 score
      const multiplier = avgViews > 0 ? (viewCount / avgViews) : 0; // Actual multiple (e.g. 2.5x)
      
      const publishedAt = new Date(item.snippet.publishedAt);
      
      const likes = parseInt(item.statistics.likeCount || '0', 10);
      const comments = parseInt(item.statistics.commentCount || '0', 10);
      const engagementRatio = viewCount > 0 ? (likes + comments) / viewCount : 0;

      return {
        id: item.id,
        title: item.snippet.title,
        thumbnailUrl: item.snippet.thumbnails.maxres?.url || item.snippet.thumbnails.medium?.url || item.snippet.thumbnails.default?.url,
        views: viewCount,
        publishDate: publishedAt.toLocaleDateString(),
        outlierScore: parseFloat(outlierScore.toFixed(1)),
        multiplier: parseFloat(multiplier.toFixed(1)),
        channelName: item.snippet.channelTitle,
        category: 'Tech',
        engagementRatio: engagementRatio,
        isOwnVideo: true,
      };
    });
  } catch (error: any) {
    console.error('Error fetching videos:', error);
    throw new Error(error.message || 'Failed to fetch videos');
  }
};