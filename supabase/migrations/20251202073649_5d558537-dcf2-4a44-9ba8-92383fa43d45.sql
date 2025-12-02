-- Add explicit authentication requirement for profiles table
-- This provides defense-in-depth by making it crystal clear that 
-- unauthenticated access is not allowed

-- First, let's make the existing policies more explicit by converting them to restrictive policies
-- Drop existing permissive policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

-- Recreate as restrictive policies that explicitly check authentication
CREATE POLICY "Authenticated users can view own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Explicitly deny public (unauthenticated) access
-- This is redundant with RLS defaults but makes intent clear
CREATE POLICY "Deny public access to profiles"
ON public.profiles
FOR SELECT
TO public
USING (false);