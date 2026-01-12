-- Add is_public column to ajos table
ALTER TABLE public.ajos ADD COLUMN is_public boolean NOT NULL DEFAULT false;

-- Create join_requests table for tracking group join requests
CREATE TABLE public.join_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ajo_id uuid NOT NULL REFERENCES public.ajos(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  message text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  reviewed_at timestamp with time zone,
  reviewed_by uuid,
  UNIQUE(ajo_id, user_id)
);

-- Enable RLS
ALTER TABLE public.join_requests ENABLE ROW LEVEL SECURITY;

-- Users can view their own join requests
CREATE POLICY "Users can view own join requests"
ON public.join_requests
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Group creators/admins can view requests for their groups
CREATE POLICY "Creators can view group join requests"
ON public.join_requests
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM ajos 
    WHERE ajos.id = join_requests.ajo_id 
    AND ajos.creator_id = auth.uid()
  )
);

-- Users can create join requests
CREATE POLICY "Users can create join requests"
ON public.join_requests
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Group creators can update (approve/reject) requests
CREATE POLICY "Creators can update join requests"
ON public.join_requests
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM ajos 
    WHERE ajos.id = join_requests.ajo_id 
    AND ajos.creator_id = auth.uid()
  )
);

-- Users can delete their own pending requests
CREATE POLICY "Users can delete own pending requests"
ON public.join_requests
FOR DELETE
TO authenticated
USING (auth.uid() = user_id AND status = 'pending');

-- Update ajos SELECT policy to include public groups
DROP POLICY IF EXISTS "Users can view ajos they belong to or created" ON public.ajos;

CREATE POLICY "Users can view ajos they belong to or created or public"
ON public.ajos
FOR SELECT
TO authenticated
USING (
  auth.uid() = creator_id
  OR EXISTS (
    SELECT 1 FROM memberships
    WHERE memberships.ajo_id = ajos.id
    AND memberships.user_id = auth.uid()
    AND memberships.is_active = true
  )
  OR has_role(auth.uid(), 'admin'::app_role)
  OR is_public = true
);