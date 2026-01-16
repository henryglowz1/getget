-- Create function to update timestamps (if it doesn't exist)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create table for storing 2FA secrets
CREATE TABLE public.user_two_factor (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    totp_secret TEXT NOT NULL,
    is_enabled BOOLEAN NOT NULL DEFAULT false,
    backup_codes TEXT[] DEFAULT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.user_two_factor ENABLE ROW LEVEL SECURITY;

-- Create policy for users to view their own 2FA settings
CREATE POLICY "Users can view their own 2FA settings" 
ON public.user_two_factor 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

-- Create policy for users to insert their own 2FA settings
CREATE POLICY "Users can create their own 2FA settings" 
ON public.user_two_factor 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Create policy for users to update their own 2FA settings
CREATE POLICY "Users can update their own 2FA settings" 
ON public.user_two_factor 
FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id);

-- Create policy for users to delete their own 2FA settings
CREATE POLICY "Users can delete their own 2FA settings" 
ON public.user_two_factor 
FOR DELETE 
TO authenticated
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_user_two_factor_updated_at
BEFORE UPDATE ON public.user_two_factor
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create a security definer function to check if 2FA is enabled for a user
-- This will be used by the login flow to check without requiring full auth
CREATE OR REPLACE FUNCTION public.check_2fa_enabled(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT is_enabled FROM public.user_two_factor WHERE user_id = p_user_id),
    false
  )
$$;

-- Create index for faster lookups
CREATE INDEX idx_user_two_factor_user_id ON public.user_two_factor(user_id);