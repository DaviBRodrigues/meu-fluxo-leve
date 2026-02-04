-- Create table for access codes
CREATE TABLE public.access_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  max_uses INTEGER,
  current_uses INTEGER NOT NULL DEFAULT 0,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.access_codes ENABLE ROW LEVEL SECURITY;

-- Only admins can manage access codes
CREATE POLICY "Admins can view all access codes"
ON public.access_codes FOR SELECT
USING (is_admin(auth.uid()));

CREATE POLICY "Admins can insert access codes"
ON public.access_codes FOR INSERT
WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can update access codes"
ON public.access_codes FOR UPDATE
USING (is_admin(auth.uid()));

CREATE POLICY "Admins can delete access codes"
ON public.access_codes FOR DELETE
USING (is_admin(auth.uid()));

-- Function to validate access code (public, no auth required)
CREATE OR REPLACE FUNCTION public.validate_access_code(code_input TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  code_record RECORD;
BEGIN
  SELECT * INTO code_record
  FROM public.access_codes
  WHERE code = code_input
    AND is_active = true
    AND (expires_at IS NULL OR expires_at > now())
    AND (max_uses IS NULL OR current_uses < max_uses);
  
  IF code_record.id IS NOT NULL THEN
    -- Increment usage count
    UPDATE public.access_codes
    SET current_uses = current_uses + 1
    WHERE id = code_record.id;
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$;

-- Grant execute permission to anon users for signup validation
GRANT EXECUTE ON FUNCTION public.validate_access_code(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.validate_access_code(TEXT) TO authenticated;