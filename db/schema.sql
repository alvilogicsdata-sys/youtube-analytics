-- PostgreSQL Database Schema for YouTube Analytics SaaS Platform

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    profile_picture_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    email_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Invite codes table
CREATE TABLE invite_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL,
    created_by UUID REFERENCES users(id),
    used_by UUID REFERENCES users(id),
    is_used BOOLEAN DEFAULT FALSE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Channels table
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

-- Channel stats history table
CREATE TABLE channel_stats_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    channel_id UUID REFERENCES channels(id) NOT NULL,
    view_count BIGINT NOT NULL,
    subscriber_count BIGINT NOT NULL,
    video_count BIGINT NOT NULL,
    comments_count BIGINT,
    likes_count BIGINT,
    dislikes_count BIGINT,
    shares_count BIGINT,
    estimated_minutes_watched BIGINT,
    average_view_duration BIGINT,
    average_view_percentage DECIMAL(5,2),
    annotation_click_through_rate DECIMAL(5,2),
    annotation_close_rate DECIMAL(5,2),
    card_click_rate DECIMAL(5,2),
    card_teaser_click_rate DECIMAL(5,2),
    earned_subscribers BIGINT,
    audience_retention JSONB,
    traffic_sources JSONB,
    device_stats JSONB,
    operating_system_stats JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Niches table
CREATE TABLE niches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Niche scores table
CREATE TABLE niche_scores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    channel_id UUID REFERENCES channels(id) NOT NULL,
    niche_id UUID REFERENCES niches(id) NOT NULL,
    score DECIMAL(5,2) NOT NULL,
    engagement_rate DECIMAL(5,2),
    audience_overlap_percentage DECIMAL(5,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(channel_id, niche_id)
);

-- Collections table
CREATE TABLE collections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Collection items table
CREATE TABLE collection_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    collection_id UUID REFERENCES collections(id) NOT NULL,
    channel_id UUID REFERENCES channels(id) NOT NULL,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    UNIQUE(collection_id, channel_id)
);

-- Indexes for better query performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_invite_codes_code ON invite_codes(code);
CREATE INDEX idx_invite_codes_used_by ON invite_codes(used_by);
CREATE INDEX idx_channels_user_id ON channels(user_id);
CREATE INDEX idx_channels_youtube_channel_id ON channels(youtube_channel_id);
CREATE INDEX idx_channels_subscriber_count ON channels(subscriber_count);
CREATE INDEX idx_channel_stats_history_channel_id ON channel_stats_history(channel_id);
CREATE INDEX idx_channel_stats_history_created_at ON channel_stats_history(created_at);
CREATE INDEX idx_niches_name ON niches(name);
CREATE INDEX idx_niche_scores_channel_id ON niche_scores(channel_id);
CREATE INDEX idx_niche_scores_niche_id ON niche_scores(niche_id);
CREATE INDEX idx_collections_user_id ON collections(user_id);
CREATE INDEX idx_collection_items_collection_id ON collection_items(collection_id);
CREATE INDEX idx_collection_items_channel_id ON collection_items(channel_id);
