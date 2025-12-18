-- Migration: Add social links, website, and strategy fields to gauge_profiles
-- These enable gauge managers to build rich profiles that help voters make informed decisions

-- Add website URL
ALTER TABLE public.gauge_profiles
ADD COLUMN IF NOT EXISTS website_url TEXT;

-- Add social links as JSONB for flexibility (twitter, discord, telegram, github, etc.)
ALTER TABLE public.gauge_profiles
ADD COLUMN IF NOT EXISTS social_links JSONB DEFAULT '{}';

-- Add incentive strategy description - explains how the gauge manager plans to incentivize voters
ALTER TABLE public.gauge_profiles
ADD COLUMN IF NOT EXISTS incentive_strategy TEXT;

-- Add voting strategy description - explains the gauge manager's voting goals and approach
ALTER TABLE public.gauge_profiles
ADD COLUMN IF NOT EXISTS voting_strategy TEXT;

-- Add tags for categorization (e.g., "DeFi", "NFT", "Gaming", etc.)
ALTER TABLE public.gauge_profiles
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- Add a "featured" flag for highlighted gauges (admin-managed)
ALTER TABLE public.gauge_profiles
ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;

-- Add comments for documentation
COMMENT ON COLUMN public.gauge_profiles.website_url IS 'Official website URL for the gauge/project';
COMMENT ON COLUMN public.gauge_profiles.social_links IS 'JSONB object containing social media links (twitter, discord, telegram, github, etc.)';
COMMENT ON COLUMN public.gauge_profiles.incentive_strategy IS 'Description of how the gauge manager plans to incentivize voters';
COMMENT ON COLUMN public.gauge_profiles.voting_strategy IS 'Description of the gauge managers voting goals and approach';
COMMENT ON COLUMN public.gauge_profiles.tags IS 'Array of tags for categorization';
COMMENT ON COLUMN public.gauge_profiles.is_featured IS 'Whether this gauge is featured/highlighted';

-- Create index on tags for efficient filtering
CREATE INDEX IF NOT EXISTS idx_gauge_profiles_tags ON public.gauge_profiles USING GIN(tags);

-- Create index on is_featured for quick featured gauge lookups
CREATE INDEX IF NOT EXISTS idx_gauge_profiles_featured ON public.gauge_profiles(is_featured) WHERE is_featured = true;

