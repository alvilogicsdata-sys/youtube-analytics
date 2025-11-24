-- Migration: Create channels table
-- Description: Create the channels table to store YouTube channel information

-- Create channels table
CREATE TABLE channels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) NOT NULL,
    youtube_channel_id VARCHAR(255) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    thumbnail_url TEXT,
    custom_url VARCHAR(255),
    country VARCHAR(10),
    view_count BIGINT DEFAULT 0,
    subscriber_count BIGINT DEFAULT 0,
    video_count BIGINT DEFAULT 0,
    topic_categories JSONB,
    is_connected BOOLEAN DEFAULT TRUE,
    last_synced_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX idx_channels_user_id ON channels(user_id);
CREATE INDEX idx_channels_youtube_channel_id ON channels(youtube_channel_id);
CREATE INDEX idx_channels_subscriber_count ON channels(subscriber_count);
