
-- Create increment_wallet_balance function (mirror of decrement)
CREATE OR REPLACE FUNCTION public.increment_wallet_balance(p_user_id uuid, p_amount integer)
RETURNS TABLE(new_balance integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_balance INTEGER;
BEGIN
  UPDATE wallets
  SET balance = balance + p_amount, updated_at = now()
  WHERE user_id = p_user_id
  RETURNING balance INTO v_current_balance;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Wallet not found for user';
  END IF;
  
  RETURN QUERY SELECT v_current_balance;
END;
$$;
