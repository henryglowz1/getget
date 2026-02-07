
-- Allow group creators to delete memberships (remove members)
CREATE POLICY "Group creators can delete memberships"
ON public.memberships
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM ajos
    WHERE ajos.id = memberships.ajo_id
    AND ajos.creator_id = auth.uid()
  )
);

-- Allow group creators to delete their groups
CREATE POLICY "Creators can delete own ajos"
ON public.ajos
FOR DELETE
USING (auth.uid() = creator_id);

-- Allow admins to delete any ajos
CREATE POLICY "Admins can delete ajos"
ON public.ajos
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Also allow cascade cleanup - creators can delete related invites for their groups
CREATE POLICY "Creators can delete invites for their groups"
ON public.group_invites
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM ajos
    WHERE ajos.id = group_invites.ajo_id
    AND ajos.creator_id = auth.uid()
  )
);

-- Allow creators to delete join requests for their groups
CREATE POLICY "Creators can delete join requests for their groups"
ON public.join_requests
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM ajos
    WHERE ajos.id = join_requests.ajo_id
    AND ajos.creator_id = auth.uid()
  )
);
