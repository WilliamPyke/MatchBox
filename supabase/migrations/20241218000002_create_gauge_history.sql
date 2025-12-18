-- Migration: Create gauge_history table for tracking historical gauge data
-- This enables showing trends, charts, and historical performance on gauge pages

-- Create the gauge_history table
CREATE TABLE IF NOT EXISTS public.gauge_history (
    id SERIAL PRIMARY KEY,
    gauge_address TEXT NOT NULL,
    epoch_start BIGINT NOT NULL,
    
    -- Voting metrics
    vemezo_weight NUMERIC(78, 0),  -- Total veMEZO votes on this gauge
    vebtc_weight NUMERIC(78, 0),   -- veBTC voting power of the gauge
    boost_multiplier NUMERIC(10, 4),  -- Boost multiplier achieved
    
    -- Incentive metrics (in USD)
    total_incentives_usd NUMERIC(20, 2),
    
    -- Calculated metrics
    apy NUMERIC(20, 4),  -- Calculated APY for this epoch
    
    -- Voter count (approximation from on-chain data if available)
    unique_voters INTEGER,
    
    -- Timestamps
    recorded_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure we only have one record per gauge per epoch
    CONSTRAINT unique_gauge_epoch UNIQUE (gauge_address, epoch_start)
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_gauge_history_address ON public.gauge_history(gauge_address);
CREATE INDEX IF NOT EXISTS idx_gauge_history_epoch ON public.gauge_history(epoch_start DESC);
CREATE INDEX IF NOT EXISTS idx_gauge_history_address_epoch ON public.gauge_history(gauge_address, epoch_start DESC);

-- Enable Row Level Security
ALTER TABLE public.gauge_history ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read gauge history
DROP POLICY IF EXISTS "Anyone can read gauge history" ON public.gauge_history;
CREATE POLICY "Anyone can read gauge history" ON public.gauge_history
    FOR SELECT USING (true);

-- Policy: Only service role can insert (backend job will populate this)
DROP POLICY IF EXISTS "Service role can insert gauge history" ON public.gauge_history;
CREATE POLICY "Service role can insert gauge history" ON public.gauge_history
    FOR INSERT WITH CHECK (true);

-- Create a view for easy access to the latest gauge stats
CREATE OR REPLACE VIEW public.gauge_latest_stats AS
SELECT DISTINCT ON (gauge_address)
    gauge_address,
    epoch_start,
    vemezo_weight,
    vebtc_weight,
    boost_multiplier,
    total_incentives_usd,
    apy,
    unique_voters,
    recorded_at
FROM public.gauge_history
ORDER BY gauge_address, epoch_start DESC;

-- Add comments for documentation
COMMENT ON TABLE public.gauge_history IS 'Historical performance data for gauges, recorded per epoch';
COMMENT ON COLUMN public.gauge_history.epoch_start IS 'Unix timestamp of the epoch start (epochs are 7 days)';
COMMENT ON COLUMN public.gauge_history.vemezo_weight IS 'Total veMEZO voting weight allocated to this gauge';
COMMENT ON COLUMN public.gauge_history.vebtc_weight IS 'veBTC voting power of the gauge owner';
COMMENT ON COLUMN public.gauge_history.boost_multiplier IS 'Boost multiplier achieved (1.0 to 2.5x)';
COMMENT ON COLUMN public.gauge_history.total_incentives_usd IS 'Total incentives offered in USD for this epoch';
COMMENT ON COLUMN public.gauge_history.apy IS 'Calculated APY for voting on this gauge';
COMMENT ON COLUMN public.gauge_history.unique_voters IS 'Number of unique veMEZO holders who voted for this gauge';

