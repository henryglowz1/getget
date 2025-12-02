-- Fix: Restrict ajo visibility to only members and creators
-- This prevents unauthorized profile enumeration through the ajos table

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Anyone authenticated can view ajos" ON public.ajos;

-- Create a new restricted policy: users can only view ajos they're members of or created
CREATE POLICY "Users can view ajos they belong to or created"
ON public.ajos
FOR SELECT
TO authenticated
USING (
  auth.uid() = creator_id 
  OR EXISTS (
    SELECT 1 
    FROM public.memberships 
    WHERE memberships.ajo_id = ajos.id 
      AND memberships.user_id = auth.uid()
      AND memberships.is_active = true
  )
  OR has_role(auth.uid(), 'admin'::app_role)
);