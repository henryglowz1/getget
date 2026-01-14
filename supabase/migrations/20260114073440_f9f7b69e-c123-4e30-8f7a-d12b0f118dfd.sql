-- Add fee_percentage column to ajos table with default 6.25%
ALTER TABLE public.ajos 
ADD COLUMN IF NOT EXISTS fee_percentage NUMERIC(5,2) DEFAULT 6.25;

-- Add comment for clarity
COMMENT ON COLUMN public.ajos.fee_percentage IS 'Platform fee percentage deducted from payouts (default 6.25%)';