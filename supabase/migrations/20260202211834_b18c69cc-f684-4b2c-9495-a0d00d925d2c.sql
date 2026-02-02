-- Add rejection_reason column to join_requests table
ALTER TABLE public.join_requests
ADD COLUMN rejection_reason TEXT NULL;