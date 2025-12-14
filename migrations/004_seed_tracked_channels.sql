-- Migration: Seed Tracked Channels
-- Purpose: Pre-populate with 20 AI automation YouTube channels
-- Date: 2025-12-10
-- Run this AFTER running 001_create_tracked_channels.sql

-- Note: channel_id values need to be updated with actual YouTube channel IDs
-- You can find channel IDs by visiting youtube.com/@handle and checking the page source
-- or using the YouTube Data API

INSERT INTO tracked_channels (channel_id, handle, channel_name, category, scrape_priority, tags) VALUES

-- Top Priority (Priority 10) - Major AI automation channels
('UCobVid_c2woyOam7RWDVoFA', '@matthew_berman', 'Matthew Berman', 'ai_automation', 10, ARRAY['ai', 'automation', 'reviews', 'tutorials']),
('UCn9RZ4_LdSVA6q4dXbVIYig', '@mreflow', 'Matt Wolfe', 'ai_automation', 10, ARRAY['ai', 'tools', 'news', 'automation']),
('UC2e7lWZqrNpSRaHPL-WJcaw', '@liamonyt', 'Liam Ottley', 'ai_automation', 10, ARRAY['ai', 'agency', 'business', 'automation']),

-- High Priority (Priority 8-9) - Consistent AI content creators
('UCGSyPaBoYdU_xwbBvMROqpw', '@AIJasonZ', 'AI Jason', 'ai_automation', 9, ARRAY['ai', 'tutorials', 'chatgpt', 'automation']),
('UC-CNymS1P5KEZRTjHELGQMQ', '@aidrivengrowth', 'World of AI', 'ai_automation', 9, ARRAY['ai', 'news', 'tools', 'productivity']),
('UCZ9qFEC82qM6Pk-54Q4TVWA', '@aiadvantage', 'The AI Advantage', 'ai_automation', 8, ARRAY['ai', 'productivity', 'chatgpt', 'tutorials']),
('UCfYsT0_xJEd3kxE-LKzENlQ', '@aiexplained-official', 'AI Explained', 'ai_automation', 8, ARRAY['ai', 'research', 'news', 'analysis']),
('UCDq7SjbgRKty5TgGH3sfvUg', '@ColeMedin', 'Cole Medin', 'ai_automation', 8, ARRAY['ai', 'coding', 'tutorials', 'development']),

-- Medium Priority (Priority 6-7) - Regular AI content
('UCowOWMmYvmI2Q-bxkmV5N5g', '@AdrianTwarog', 'Adrian Twarog', 'ai_automation', 7, ARRAY['ai', 'design', 'web', 'tutorials']),
('UCq3SgLo2F8gBMEp2vQnKGig', '@promptengineering', 'Prompt Engineering', 'ai_automation', 7, ARRAY['ai', 'prompts', 'tutorials', 'chatgpt']),
('UC6-MYH8bCTH8RvnRJm4qmqw', '@AllAboutAI', 'All About AI', 'ai_automation', 7, ARRAY['ai', 'news', 'tools', 'reviews']),
('UCxjfrYRpnT8KQByIDnhFPdA', '@MattVidPro', 'MattVidPro AI', 'ai_automation', 7, ARRAY['ai', 'news', 'commentary', 'reviews']),

-- Standard Priority (Priority 5) - Emerging and niche AI creators
('UCRPd6lAQo0VeGn3PQGB1xBQ', '@OlivioSarikas', 'Olivio Sarikas', 'ai_automation', 5, ARRAY['ai', 'art', 'midjourney', 'tutorials']),
('UCbc8FEVr_S7f0KQVPFgpNSQ', '@WesRoth', 'Wes Roth', 'ai_automation', 5, ARRAY['ai', 'news', 'philosophy', 'future']),
('UCfYxKtdVWGCVYXU6q_YQsmw', '@David-Ondrej', 'David Ondrej', 'ai_automation', 5, ARRAY['ai', 'automation', 'make', 'tutorials']),
('UCeKhK19R8bSx6pPuV4FxTbw', '@airevolution', 'AI Revolution', 'ai_automation', 5, ARRAY['ai', 'news', 'future', 'technology']),
('UCd8pZxIZ3i2qX4YxXDhQzMA', '@aigrid', 'AI Grid', 'ai_automation', 5, ARRAY['ai', 'news', 'tools', 'updates']),
('UCfKXPDZMIaZdAXvDdJVwKXg', '@aitools', 'AI Tools', 'ai_automation', 5, ARRAY['ai', 'tools', 'reviews', 'tutorials']),
('UCqF9fkXJd3QqQzGMfN4gVag', '@aifoundations', 'AI Foundations', 'ai_automation', 5, ARRAY['ai', 'education', 'tutorials', 'basics']),
('UCiA7fBQ0ZBD4FZN9lXqGRBA', '@aiandyandy', 'AI Andy', 'ai_automation', 5, ARRAY['ai', 'news', 'commentary', 'updates'])

ON CONFLICT (channel_id) DO UPDATE SET
  handle = EXCLUDED.handle,
  channel_name = EXCLUDED.channel_name,
  category = EXCLUDED.category,
  scrape_priority = EXCLUDED.scrape_priority,
  tags = EXCLUDED.tags;

-- Update: Set default avg_views and scrape_frequency
UPDATE tracked_channels SET
  avg_views = 50000, -- Default estimate, will be updated after first scrape
  scrape_frequency = 21600, -- 6 hours
  is_active = true
WHERE avg_views = 0;

COMMENT ON TABLE tracked_channels IS 'Seeded with 20 AI automation YouTube channels for monitoring';
