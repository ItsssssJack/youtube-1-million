import { Video, Idea } from './types';

// Mixed list of Own Videos (Jack) and Competitor Outliers
export const MOCK_VIDEOS: Video[] = [
  // Jack's Own Videos (Simulated)
  {
    id: 'jack1',
    title: 'I Built an AI Employee That Does My Work (n8n Tutorial)',
    thumbnailUrl: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg', // Placeholder
    views: 45200,
    publishDate: '2024-05-20',
    outlierScore: 8.9,
    channelName: 'Jack',
    category: 'AI Automation',
    engagementRatio: 0.14,
    isOwnVideo: true,
  },
  {
    id: 'jack2',
    title: 'Stop Paying for Zapier: Use This Instead',
    thumbnailUrl: 'https://picsum.photos/320/180?random=10',
    views: 12500,
    publishDate: '2024-05-15',
    outlierScore: 5.2,
    channelName: 'Jack',
    category: 'No-Code',
    engagementRatio: 0.08,
    isOwnVideo: true,
  },
  
  // External Outliers (Competitors)
  {
    id: 'ext1',
    title: 'OpenAI Just Killed SaaS',
    thumbnailUrl: 'https://picsum.photos/320/180?random=11',
    views: 890000,
    publishDate: '2024-05-22',
    outlierScore: 9.9,
    channelName: 'Matthew Berman',
    category: 'AI News',
    engagementRatio: 0.11,
    isOwnVideo: false,
  },
  {
    id: 'ext2',
    title: 'How to Build a $10k/mo AI Agency',
    thumbnailUrl: 'https://picsum.photos/320/180?random=12',
    views: 145000,
    publishDate: '2024-05-18',
    outlierScore: 9.4,
    channelName: 'Liam Ottley',
    category: 'AI Business',
    engagementRatio: 0.13,
    isOwnVideo: false,
  },
  {
    id: 'ext3',
    title: 'Claude 3.5 Sonnet Artifacts are INSANE',
    thumbnailUrl: 'https://picsum.photos/320/180?random=13',
    views: 320000,
    publishDate: '2024-06-21',
    outlierScore: 9.7,
    channelName: 'Matt Wolfe',
    category: 'AI Tools',
    engagementRatio: 0.10,
    isOwnVideo: false,
  },
];

export const MOCK_IDEAS: Idea[] = [
  {
    id: 'i1',
    title: 'n8n vs Make: The Ultimate 2024 Showdown',
    status: 'Scripting',
    priority: 'High',
    source: 'Comment Request',
    score: 95,
  },
  {
    id: 'i2',
    title: 'How to Scrape Websites into Notion with AI',
    status: 'Backlog',
    priority: 'Medium',
    source: 'Outlier Analysis',
    score: 82,
  },
  {
    id: 'i3',
    title: 'Building a Lead Gen Agent from Scratch',
    status: 'Filming',
    priority: 'High',
    source: 'Competitor Gap',
    score: 89,
  },
];

export const CHANNEL_CONTEXT = `
Channel Name: Itssssss_Jack (Jack)
Topics: AI Automation, n8n, Make.com, AI Agents, Python for Beginners
Tone: Practical, No-Fluff, Builder-focused
Current Goal: Scale to 100k subscribers by focusing on "AI Employees" and complex workflows made simple.
Avoid: Generic "Top 10 AI Tools" videos. Focus on BUILD tutorials.
`;