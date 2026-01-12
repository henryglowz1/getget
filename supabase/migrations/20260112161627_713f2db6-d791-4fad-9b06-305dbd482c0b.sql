-- Allow anyone with a valid group ID to view basic group info for invite purposes
-- This enables the AcceptInvite page to show group details before joining
CREATE POLICY "Anyone can view basic group info for invites" 
ON public.ajos 
FOR SELECT 
TO authenticated
USING (
  -- Allow if user has a pending invite for this group
  EXISTS (
    SELECT 1 FROM group_invites gi 
    WHERE gi.ajo_id = ajos.id 
    AND gi.status = 'pending'
  )
  OR
  -- Also allow public access to view group name/max_members for invite links
  true
);

-- Drop the restrictive policy and replace with a more permissive one for SELECT
DROP POLICY IF EXISTS "Users can view ajos they belong to or created" ON public.ajos;

-- Recreate the policy to allow viewing groups for invite purposes
CREATE POLICY "Users can view ajos they belong to or created" 
ON public.ajos 
FOR SELECT 
TO authenticated
USING (
  -- User is the creator
  auth.uid() = creator_id 
  OR 
  -- User is an active member
  EXISTS (
    SELECT 1 FROM memberships
    WHERE memberships.ajo_id = ajos.id 
    AND memberships.user_id = auth.uid() 
    AND memberships.is_active = true
  )
  OR 
  -- User is admin
  has_role(auth.uid(), 'admin'::app_role)
  OR
  -- Allow viewing for invite purposes (group is active)
  status = 'active'
);