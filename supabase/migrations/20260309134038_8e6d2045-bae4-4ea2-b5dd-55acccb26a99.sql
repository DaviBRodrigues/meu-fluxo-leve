ALTER TABLE public.transactions 
  ADD COLUMN IF NOT EXISTS is_installment boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS installment_count integer,
  ADD COLUMN IF NOT EXISTS installment_number integer,
  ADD COLUMN IF NOT EXISTS installment_group_id uuid;

INSERT INTO public.categories (name, type, color, icon, is_default)
VALUES ('Dívida', 'expense', '#DC2626', 'alert-circle', true);