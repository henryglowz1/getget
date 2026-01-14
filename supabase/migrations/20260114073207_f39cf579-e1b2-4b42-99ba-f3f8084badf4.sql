-- Create platform_fees table to track all collected fees
CREATE TABLE public.platform_fees (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ajo_id UUID REFERENCES public.ajos(id) ON DELETE CASCADE,
  payout_ledger_id UUID REFERENCES public.ledger(id) ON DELETE SET NULL,
  user_id UUID NOT NULL,
  gross_amount INTEGER NOT NULL,
  fee_amount INTEGER NOT NULL,
  net_amount INTEGER NOT NULL,
  fee_percentage NUMERIC(5,2) DEFAULT 6.25,
  cycle INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.platform_fees ENABLE ROW LEVEL SECURITY;

-- Users can view their own fee deductions
CREATE POLICY "Users can view their own fees"
ON public.platform_fees
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Admins can view all fees
CREATE POLICY "Admins can view all fees"
ON public.platform_fees
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Create index for faster queries
CREATE INDEX idx_platform_fees_ajo_id ON public.platform_fees(ajo_id);
CREATE INDEX idx_platform_fees_user_id ON public.platform_fees(user_id);
CREATE INDEX idx_platform_fees_created_at ON public.platform_fees(created_at DESC);