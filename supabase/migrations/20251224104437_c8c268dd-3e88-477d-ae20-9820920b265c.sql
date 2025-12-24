-- Drop the redundant "Deny public access to profiles" policy
-- The other policies already properly restrict access:
-- - "Authenticated users can view own profile" requires auth.uid() = user_id
-- - "Admins can view all profiles" requires has_role(auth.uid(), 'admin')
-- Both use auth.uid() which returns NULL for unauthenticated users, denying access

DROP POLICY IF EXISTS "Deny public access to profiles" ON public.profiles;