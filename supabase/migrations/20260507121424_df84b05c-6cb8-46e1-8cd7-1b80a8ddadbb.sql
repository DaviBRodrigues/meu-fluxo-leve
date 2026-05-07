
-- Subscription status enum
CREATE TYPE public.subscription_status AS ENUM ('pending', 'trial', 'active', 'expired', 'cancelled');

-- Add subscription fields to profiles
ALTER TABLE public.profiles
  ADD COLUMN subscription_status public.subscription_status NOT NULL DEFAULT 'pending',
  ADD COLUMN trial_started_at timestamptz,
  ADD COLUMN trial_expires_at timestamptz,
  ADD COLUMN subscription_started_at timestamptz,
  ADD COLUMN subscription_expires_at timestamptz,
  ADD COLUMN hotmart_subscriber_code text,
  ADD COLUMN hotmart_transaction_id text,
  ADD COLUMN access_via_bypass boolean NOT NULL DEFAULT false;

-- Add bypass flag to access_codes
ALTER TABLE public.access_codes
  ADD COLUMN is_bypass boolean NOT NULL DEFAULT false;

-- Subscription events (Hotmart webhook log)
CREATE TABLE public.subscription_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  email text,
  event_type text NOT NULL,
  hotmart_transaction_id text,
  hotmart_subscriber_code text,
  raw_payload jsonb NOT NULL,
  processed boolean NOT NULL DEFAULT false,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.subscription_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view subscription events"
  ON public.subscription_events FOR SELECT
  USING (public.is_admin(auth.uid()));

CREATE INDEX idx_subscription_events_email ON public.subscription_events(email);
CREATE INDEX idx_subscription_events_user_id ON public.subscription_events(user_id);

-- Helper function: has user got active access?
CREATE OR REPLACE FUNCTION public.has_active_access(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = _user_id
      AND (
        public.is_admin(_user_id)
        OR p.access_via_bypass = true
        OR (p.subscription_status = 'active' AND (p.subscription_expires_at IS NULL OR p.subscription_expires_at > now()))
        OR (p.subscription_status = 'trial' AND p.trial_expires_at IS NOT NULL AND p.trial_expires_at > now())
      )
  )
$$;
