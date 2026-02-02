-- Create investment categories table for custom categories
CREATE TABLE public.investment_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#8B5CF6',
  icon TEXT DEFAULT 'trending-up',
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create investments table (the "boxes")
CREATE TABLE public.investments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  category_id UUID REFERENCES public.investment_categories(id),
  current_amount NUMERIC NOT NULL DEFAULT 0,
  initial_amount NUMERIC NOT NULL DEFAULT 0,
  target_amount NUMERIC,
  color TEXT NOT NULL DEFAULT '#10B981',
  icon TEXT DEFAULT 'piggy-bank',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create investment transactions table (deposits/withdrawals)
CREATE TABLE public.investment_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  investment_id UUID NOT NULL REFERENCES public.investments(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES public.accounts(id),
  type TEXT NOT NULL CHECK (type IN ('deposit', 'withdrawal', 'yield')),
  amount NUMERIC NOT NULL,
  description TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.investment_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investment_transactions ENABLE ROW LEVEL SECURITY;

-- Investment categories policies
CREATE POLICY "Users can view investment categories" ON public.investment_categories
  FOR SELECT USING (is_default = true OR auth.uid() = user_id);

CREATE POLICY "Users can insert their own investment categories" ON public.investment_categories
  FOR INSERT WITH CHECK (auth.uid() = user_id AND is_default = false);

CREATE POLICY "Users can update their own investment categories" ON public.investment_categories
  FOR UPDATE USING (auth.uid() = user_id AND is_default = false);

CREATE POLICY "Users can delete their own investment categories" ON public.investment_categories
  FOR DELETE USING (auth.uid() = user_id AND is_default = false);

-- Investments policies
CREATE POLICY "Users can view their own investments" ON public.investments
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own investments" ON public.investments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own investments" ON public.investments
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own investments" ON public.investments
  FOR DELETE USING (auth.uid() = user_id);

-- Investment transactions policies
CREATE POLICY "Users can view their own investment transactions" ON public.investment_transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own investment transactions" ON public.investment_transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own investment transactions" ON public.investment_transactions
  FOR DELETE USING (auth.uid() = user_id);

-- Insert default investment categories
INSERT INTO public.investment_categories (user_id, name, color, icon, is_default) VALUES
  ('00000000-0000-0000-0000-000000000000', 'Renda Fixa', '#3B82F6', 'landmark', true),
  ('00000000-0000-0000-0000-000000000000', 'Ações', '#10B981', 'trending-up', true),
  ('00000000-0000-0000-0000-000000000000', 'Fundos Imobiliários', '#F59E0B', 'building', true),
  ('00000000-0000-0000-0000-000000000000', 'Criptomoedas', '#8B5CF6', 'bitcoin', true),
  ('00000000-0000-0000-0000-000000000000', 'Tesouro Direto', '#06B6D4', 'shield', true),
  ('00000000-0000-0000-0000-000000000000', 'Poupança', '#EC4899', 'piggy-bank', true);

-- Add trigger for updated_at
CREATE TRIGGER update_investments_updated_at
  BEFORE UPDATE ON public.investments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();