-- Add referral columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS referred_by UUID;

-- Create group_invites table for tracking invitations
CREATE TABLE public.group_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ajo_id UUID REFERENCES public.ajos(id) ON DELETE CASCADE NOT NULL,
  inviter_id UUID NOT NULL,
  invitee_email TEXT NOT NULL,
  invite_code TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ DEFAULT (now() + INTERVAL '7 days')
);

-- Enable RLS on group_invites
ALTER TABLE public.group_invites ENABLE ROW LEVEL SECURITY;

-- RLS policies for group_invites
CREATE POLICY "Users can view invites for their groups"
ON public.group_invites FOR SELECT
USING (
  inviter_id = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM memberships m 
    WHERE m.ajo_id = group_invites.ajo_id AND m.user_id = auth.uid()
  )
);

CREATE POLICY "Group members can create invites"
ON public.group_invites FOR INSERT
WITH CHECK (
  auth.uid() = inviter_id AND
  EXISTS (
    SELECT 1 FROM memberships m 
    WHERE m.ajo_id = group_invites.ajo_id AND m.user_id = auth.uid()
  )
);

CREATE POLICY "Inviters can update their invites"
ON public.group_invites FOR UPDATE
USING (inviter_id = auth.uid());

CREATE POLICY "Inviters can delete their invites"
ON public.group_invites FOR DELETE
USING (inviter_id = auth.uid());

-- Create referrals table
CREATE TABLE public.referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL,
  referred_user_id UUID,
  referral_code TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'rewarded')),
  reward_amount INTEGER DEFAULT 20000,
  reward_paid BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- Enable RLS on referrals
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- RLS policies for referrals
CREATE POLICY "Users can view their own referrals"
ON public.referrals FOR SELECT
USING (referrer_id = auth.uid() OR referred_user_id = auth.uid());

CREATE POLICY "Admins can view all referrals"
ON public.referrals FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Function to generate unique referral code
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN result;
END;
$$;

-- Update handle_new_user to generate referral code
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  new_referral_code TEXT;
BEGIN
  -- Generate unique referral code
  LOOP
    new_referral_code := generate_referral_code();
    EXIT WHEN NOT EXISTS (SELECT 1 FROM profiles WHERE referral_code = new_referral_code);
  END LOOP;

  INSERT INTO public.profiles (user_id, full_name, email, phone, referral_code)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
    NEW.email,
    NEW.raw_user_meta_data ->> 'phone',
    new_referral_code
  );
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  INSERT INTO public.wallets (user_id, balance)
  VALUES (NEW.id, 0);
  
  RETURN NEW;
END;
$$;

-- Function to process referral reward
CREATE OR REPLACE FUNCTION public.process_referral_reward(p_referred_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_referral RECORD;
  v_referrer_wallet_id UUID;
BEGIN
  -- Find pending referral for this user
  SELECT * INTO v_referral FROM referrals 
  WHERE referred_user_id = p_referred_user_id 
  AND status = 'pending' 
  LIMIT 1;
  
  IF v_referral IS NULL THEN
    RETURN;
  END IF;
  
  -- Get referrer's wallet
  SELECT id INTO v_referrer_wallet_id FROM wallets WHERE user_id = v_referral.referrer_id;
  
  IF v_referrer_wallet_id IS NULL THEN
    RETURN;
  END IF;
  
  -- Update wallet balance
  UPDATE wallets SET balance = balance + v_referral.reward_amount WHERE id = v_referrer_wallet_id;
  
  -- Create wallet transaction
  INSERT INTO wallet_transactions (user_id, type, amount, description)
  VALUES (v_referral.referrer_id, 'credit', v_referral.reward_amount, 'Referral bonus');
  
  -- Update referral status
  UPDATE referrals SET 
    status = 'rewarded', 
    reward_paid = true, 
    completed_at = now() 
  WHERE id = v_referral.id;
END;
$$;