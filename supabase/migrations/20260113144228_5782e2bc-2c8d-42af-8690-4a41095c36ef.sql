-- Create security definer function to check ajo membership (bypasses RLS)
CREATE OR REPLACE FUNCTION public.is_ajo_member(_user_id uuid, _ajo_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.memberships
    WHERE user_id = _user_id
      AND ajo_id = _ajo_id
      AND is_active = true
  )
$$;

-- Drop the problematic self-referencing policy
DROP POLICY IF EXISTS "Users can view memberships of their ajos" ON public.memberships;

-- Recreate policy using the security definer function
CREATE POLICY "Users can view memberships of their ajos"
ON public.memberships
FOR SELECT
TO authenticated
USING (public.is_ajo_member(auth.uid(), ajo_id));