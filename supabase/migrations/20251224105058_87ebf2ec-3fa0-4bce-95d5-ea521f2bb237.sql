-- Create user_cards table to store Paystack card authorizations
CREATE TABLE public.user_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  authorization_code TEXT NOT NULL,
  card_brand TEXT NOT NULL,
  card_last4 TEXT NOT NULL,
  exp_month TEXT,
  exp_year TEXT,
  bank_name TEXT,
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE (user_id, authorization_code)
);

-- Enable RLS
ALTER TABLE public.user_cards ENABLE ROW LEVEL SECURITY;

-- Users can view their own cards
CREATE POLICY "Users can view own cards" ON public.user_cards
FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own cards
CREATE POLICY "Users can insert own cards" ON public.user_cards
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own cards
CREATE POLICY "Users can update own cards" ON public.user_cards
FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own cards
CREATE POLICY "Users can delete own cards" ON public.user_cards
FOR DELETE USING (auth.uid() = user_id);

-- Admins can view all cards
CREATE POLICY "Admins can view all cards" ON public.user_cards
FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

-- Add trigger for updated_at
CREATE TRIGGER update_user_cards_updated_at
  BEFORE UPDATE ON public.user_cards
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();