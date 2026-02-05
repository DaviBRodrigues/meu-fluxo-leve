-- Create table to store test user credentials
CREATE TABLE public.test_user_credentials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  email TEXT NOT NULL,
  password TEXT NOT NULL,
  full_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.test_user_credentials ENABLE ROW LEVEL SECURITY;

-- Only admins can view credentials
CREATE POLICY "Admins can view test user credentials"
ON public.test_user_credentials
FOR SELECT
USING (public.is_admin(auth.uid()));

-- Only admins can insert credentials
CREATE POLICY "Admins can insert test user credentials"
ON public.test_user_credentials
FOR INSERT
WITH CHECK (public.is_admin(auth.uid()));

-- Only admins can delete credentials
CREATE POLICY "Admins can delete test user credentials"
ON public.test_user_credentials
FOR DELETE
USING (public.is_admin(auth.uid()));

-- Create index for faster lookups
CREATE INDEX idx_test_user_credentials_user_id ON public.test_user_credentials(user_id);