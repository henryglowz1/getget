-- Remove the redundant policy that was created
DROP POLICY IF EXISTS "Anyone can view basic group info for invites" ON public.ajos;