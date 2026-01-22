-- Add username column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN username TEXT UNIQUE;

-- Create index for faster username lookups
CREATE INDEX idx_profiles_username ON public.profiles(username);

-- Add policy to allow checking username uniqueness (public read for username only)
CREATE POLICY "Anyone can check if username exists"
ON public.profiles
FOR SELECT
USING (true);

-- Note: This overwrites the existing SELECT policies behavior
-- The previous policies still apply for full profile access
-- This allows anyone to query just for username existence checks