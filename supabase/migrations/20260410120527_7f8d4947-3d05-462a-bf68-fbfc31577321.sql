
CREATE OR REPLACE FUNCTION public.update_account_balance(p_account_id uuid, p_amount_change numeric)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.accounts
  SET balance = balance + p_amount_change,
      updated_at = now()
  WHERE id = p_account_id;
END;
$$;
