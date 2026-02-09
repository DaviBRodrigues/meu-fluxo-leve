
-- Add last_seen_at to profiles for tracking last access
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_seen_at timestamp with time zone;

-- Add is_active to profiles for deactivating users (default true)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

-- Allow admins to view all profiles (already exists)
-- Update RLS to allow users to update their own last_seen_at
