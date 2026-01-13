-- 1. Add non-negative balance constraint to wallets table
ALTER TABLE public.wallets 
ADD CONSTRAINT wallet_balance_non_negative 
CHECK (balance >= 0);

-- 2. Create atomic wallet balance decrement function
CREATE OR REPLACE FUNCTION public.decrement_wallet_balance(
  p_user_id UUID,
  p_amount INTEGER
)
RETURNS TABLE(new_balance INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_balance INTEGER;
BEGIN
  -- Lock the wallet row and get current balance
  SELECT balance INTO v_current_balance
  FROM wallets
  WHERE user_id = p_user_id
  FOR UPDATE;
  
  -- Check if wallet exists
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Wallet not found for user';
  END IF;
  
  -- Check if sufficient balance
  IF v_current_balance < p_amount THEN
    RAISE EXCEPTION 'Insufficient balance';
  END IF;
  
  -- Atomically decrement
  UPDATE wallets
  SET balance = balance - p_amount, updated_at = now()
  WHERE user_id = p_user_id
  RETURNING balance INTO v_current_balance;
  
  RETURN QUERY SELECT v_current_balance;
END;
$$;

-- 3. Add verification columns to linked_banks
ALTER TABLE public.linked_banks
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS verification_method TEXT,
ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;

-- 4. Add constraint to prevent same bank account across different users
CREATE UNIQUE INDEX IF NOT EXISTS unique_bank_account_per_user 
ON public.linked_banks(account_number, bank_code);

-- Note: The linked_banks and user_roles RLS policies already look correct 
-- (they require auth.uid() = user_id). The scanner may have detected stale
-- policies that need to be explicitly scoped to 'authenticated' role.

-- 5. Drop and recreate linked_banks policies with explicit 'authenticated' role
DROP POLICY IF EXISTS "Users can view own linked banks" ON public.linked_banks;
DROP POLICY IF EXISTS "Users can create own linked banks" ON public.linked_banks;
DROP POLICY IF EXISTS "Users can update own linked banks" ON public.linked_banks;
DROP POLICY IF EXISTS "Users can delete own linked banks" ON public.linked_banks;

CREATE POLICY "Users can view own linked banks" 
ON public.linked_banks 
FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own linked banks" 
ON public.linked_banks 
FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own linked banks" 
ON public.linked_banks 
FOR UPDATE 
TO authenticated 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own linked banks" 
ON public.linked_banks 
FOR DELETE 
TO authenticated 
USING (auth.uid() = user_id);

-- 6. Drop and recreate user_roles policies with explicit 'authenticated' role
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;

CREATE POLICY "Users can view own roles" 
ON public.user_roles 
FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles" 
ON public.user_roles 
FOR SELECT 
TO authenticated 
USING (public.has_role(auth.uid(), 'admin'));