
-- Allow authenticated users to insert referral records where they are the referred user
CREATE POLICY "Users can create referral records as referred user"
ON public.referrals
FOR INSERT
TO authenticated
WITH CHECK (referred_user_id = auth.uid());
