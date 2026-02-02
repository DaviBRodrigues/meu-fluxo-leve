import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Investment, InvestmentCategory, InvestmentTransaction, InvestmentTransactionType } from '@/types/database';
import { toast } from 'sonner';

export function useInvestments() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch investment categories
  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ['investment-categories', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('investment_categories')
        .select('*')
        .order('is_default', { ascending: false })
        .order('name');

      if (error) throw error;
      return data as InvestmentCategory[];
    },
    enabled: !!user,
  });

  // Fetch investments
  const { data: investments = [], isLoading: investmentsLoading } = useQuery({
    queryKey: ['investments', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('investments')
        .select(`
          *,
          category:investment_categories(*)
        `)
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Investment[];
    },
    enabled: !!user,
  });

  // Fetch investment transactions
  const { data: transactions = [], isLoading: transactionsLoading } = useQuery({
    queryKey: ['investment-transactions', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('investment_transactions')
        .select(`
          *,
          investment:investments(*),
          account:accounts(*)
        `)
        .eq('user_id', user!.id)
        .order('date', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as InvestmentTransaction[];
    },
    enabled: !!user,
  });

  // Create investment category
  const createCategory = useMutation({
    mutationFn: async (category: { name: string; color: string; icon?: string }) => {
      const { data, error } = await supabase
        .from('investment_categories')
        .insert({ ...category, user_id: user!.id, is_default: false })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['investment-categories'] });
      toast.success('Categoria criada!');
    },
    onError: () => {
      toast.error('Erro ao criar categoria');
    },
  });

  // Create investment
  const createInvestment = useMutation({
    mutationFn: async (investment: {
      name: string;
      category_id?: string;
      target_amount?: number;
      color: string;
      icon?: string;
      notes?: string;
    }) => {
      const { data, error } = await supabase
        .from('investments')
        .insert({ ...investment, user_id: user!.id })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['investments'] });
      toast.success('Investimento criado!');
    },
    onError: () => {
      toast.error('Erro ao criar investimento');
    },
  });

  // Update investment
  const updateInvestment = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Investment> & { id: string }) => {
      const { data, error } = await supabase
        .from('investments')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['investments'] });
      toast.success('Investimento atualizado!');
    },
    onError: () => {
      toast.error('Erro ao atualizar investimento');
    },
  });

  // Delete investment
  const deleteInvestment = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('investments')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['investments'] });
      queryClient.invalidateQueries({ queryKey: ['investment-transactions'] });
      toast.success('Investimento removido!');
    },
    onError: () => {
      toast.error('Erro ao remover investimento');
    },
  });

  // Add money to investment (deposit)
  const depositToInvestment = useMutation({
    mutationFn: async ({
      investment_id,
      account_id,
      amount,
      description,
      date,
    }: {
      investment_id: string;
      account_id: string;
      amount: number;
      description?: string;
      date?: string;
    }) => {
      // Create investment transaction
      const { error: txError } = await supabase
        .from('investment_transactions')
        .insert({
          user_id: user!.id,
          investment_id,
          account_id,
          type: 'deposit' as InvestmentTransactionType,
          amount,
          description,
          date: date || new Date().toISOString().split('T')[0],
        });

      if (txError) throw txError;

      // Update investment current_amount
      const { data: investment } = await supabase
        .from('investments')
        .select('current_amount, initial_amount')
        .eq('id', investment_id)
        .single();

      if (investment) {
        await supabase
          .from('investments')
          .update({
            current_amount: Number(investment.current_amount) + amount,
            initial_amount: Number(investment.initial_amount) + amount,
          })
          .eq('id', investment_id);
      }

      // Deduct from account balance
      const { data: account } = await supabase
        .from('accounts')
        .select('balance')
        .eq('id', account_id)
        .single();

      if (account) {
        await supabase
          .from('accounts')
          .update({ balance: Number(account.balance) - amount })
          .eq('id', account_id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['investments'] });
      queryClient.invalidateQueries({ queryKey: ['investment-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      toast.success('Aporte realizado!');
    },
    onError: () => {
      toast.error('Erro ao realizar aporte');
    },
  });

  // Withdraw from investment
  const withdrawFromInvestment = useMutation({
    mutationFn: async ({
      investment_id,
      account_id,
      amount,
      description,
      date,
    }: {
      investment_id: string;
      account_id: string;
      amount: number;
      description?: string;
      date?: string;
    }) => {
      // Create investment transaction
      const { error: txError } = await supabase
        .from('investment_transactions')
        .insert({
          user_id: user!.id,
          investment_id,
          account_id,
          type: 'withdrawal' as InvestmentTransactionType,
          amount,
          description,
          date: date || new Date().toISOString().split('T')[0],
        });

      if (txError) throw txError;

      // Update investment current_amount
      const { data: investment } = await supabase
        .from('investments')
        .select('current_amount')
        .eq('id', investment_id)
        .single();

      if (investment) {
        await supabase
          .from('investments')
          .update({
            current_amount: Math.max(0, Number(investment.current_amount) - amount),
          })
          .eq('id', investment_id);
      }

      // Add to account balance
      const { data: account } = await supabase
        .from('accounts')
        .select('balance')
        .eq('id', account_id)
        .single();

      if (account) {
        await supabase
          .from('accounts')
          .update({ balance: Number(account.balance) + amount })
          .eq('id', account_id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['investments'] });
      queryClient.invalidateQueries({ queryKey: ['investment-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      toast.success('Resgate realizado!');
    },
    onError: () => {
      toast.error('Erro ao realizar resgate');
    },
  });

  // Add yield to investment (doesn't affect account)
  const addYield = useMutation({
    mutationFn: async ({
      investment_id,
      account_id,
      amount,
      description,
      date,
    }: {
      investment_id: string;
      account_id: string;
      amount: number;
      description?: string;
      date?: string;
    }) => {
      // Create investment transaction
      const { error: txError } = await supabase
        .from('investment_transactions')
        .insert({
          user_id: user!.id,
          investment_id,
          account_id,
          type: 'yield' as InvestmentTransactionType,
          amount,
          description,
          date: date || new Date().toISOString().split('T')[0],
        });

      if (txError) throw txError;

      // Update investment current_amount
      const { data: investment } = await supabase
        .from('investments')
        .select('current_amount')
        .eq('id', investment_id)
        .single();

      if (investment) {
        await supabase
          .from('investments')
          .update({
            current_amount: Number(investment.current_amount) + amount,
          })
          .eq('id', investment_id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['investments'] });
      queryClient.invalidateQueries({ queryKey: ['investment-transactions'] });
      toast.success('Rendimento registrado!');
    },
    onError: () => {
      toast.error('Erro ao registrar rendimento');
    },
  });

  const totalInvested = investments.reduce((sum, inv) => sum + Number(inv.current_amount), 0);
  const totalInitial = investments.reduce((sum, inv) => sum + Number(inv.initial_amount), 0);
  const totalYield = totalInvested - totalInitial;
  const yieldPercentage = totalInitial > 0 ? (totalYield / totalInitial) * 100 : 0;

  return {
    categories,
    investments,
    transactions,
    isLoading: categoriesLoading || investmentsLoading || transactionsLoading,
    totalInvested,
    totalInitial,
    totalYield,
    yieldPercentage,
    createCategory,
    createInvestment,
    updateInvestment,
    deleteInvestment,
    depositToInvestment,
    withdrawFromInvestment,
    addYield,
  };
}
