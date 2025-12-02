-- Update RLS policies to explicitly target authenticated role
-- This provides clearer security intent and defense-in-depth

-- ============================================================================
-- linked_banks table policies
-- ============================================================================

DROP POLICY IF EXISTS "Users can create own linked banks" ON public.linked_banks;
DROP POLICY IF EXISTS "Users can delete own linked banks" ON public.linked_banks;
DROP POLICY IF EXISTS "Users can update own linked banks" ON public.linked_banks;
DROP POLICY IF EXISTS "Users can view own linked banks" ON public.linked_banks;

CREATE POLICY "Users can create own linked banks"
ON public.linked_banks
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own linked banks"
ON public.linked_banks
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own linked banks"
ON public.linked_banks
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can view own linked banks"
ON public.linked_banks
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- ============================================================================
-- ledger table policies
-- ============================================================================

DROP POLICY IF EXISTS "Admins can view all ledger entries" ON public.ledger;
DROP POLICY IF EXISTS "Users can view own ledger entries" ON public.ledger;

CREATE POLICY "Admins can view all ledger entries"
ON public.ledger
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view own ledger entries"
ON public.ledger
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- ============================================================================
-- wallets table policies
-- ============================================================================

DROP POLICY IF EXISTS "Admins can view all wallets" ON public.wallets;
DROP POLICY IF EXISTS "Users can view own wallet" ON public.wallets;

CREATE POLICY "Admins can view all wallets"
ON public.wallets
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view own wallet"
ON public.wallets
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- ============================================================================
-- wallet_transactions table policies
-- ============================================================================

DROP POLICY IF EXISTS "Users can view own wallet transactions" ON public.wallet_transactions;

CREATE POLICY "Users can view own wallet transactions"
ON public.wallet_transactions
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- ============================================================================
-- memberships table policies
-- ============================================================================

DROP POLICY IF EXISTS "Admins can view all memberships" ON public.memberships;
DROP POLICY IF EXISTS "Users can create own memberships" ON public.memberships;
DROP POLICY IF EXISTS "Users can update own memberships" ON public.memberships;
DROP POLICY IF EXISTS "Users can view memberships of their ajos" ON public.memberships;
DROP POLICY IF EXISTS "Users can view own memberships" ON public.memberships;

CREATE POLICY "Admins can view all memberships"
ON public.memberships
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can create own memberships"
ON public.memberships
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own memberships"
ON public.memberships
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can view memberships of their ajos"
ON public.memberships
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM memberships m
    WHERE m.ajo_id = memberships.ajo_id
      AND m.user_id = auth.uid()
  )
);

CREATE POLICY "Users can view own memberships"
ON public.memberships
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);