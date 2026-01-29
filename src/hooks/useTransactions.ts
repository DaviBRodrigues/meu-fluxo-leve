import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Transaction, TransactionType } from '@/types/database';
import { toast } from 'sonner';

interface TransactionFilters {
  month?: number;
  year?: number;
  type?: TransactionType;
  accountId?: string;
  categoryId?: string;
}

export function useTransactions(filters?: TransactionFilters) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ['transactions', user?.id, filters],
    queryFn: async () => {
      let query = supabase
        .from('transactions')
        .select(`
          *,
          category:categories(*),
          account:accounts(*)
        `)
        .eq('user_id', user!.id)
        .order('date', { ascending: false })
        .order('created_at', { ascending: false });

      if (filters?.month && filters?.year) {
        const startDate = new Date(filters.year, filters.month - 1, 1);
        const endDate = new Date(filters.year, filters.month, 0);
        query = query
          .gte('date', startDate.toISOString().split('T')[0])
          .lte('date', endDate.toISOString().split('T')[0]);
      }

      if (filters?.type) {
        query = query.eq('type', filters.type);
      }

      if (filters?.accountId) {
        query = query.eq('account_id', filters.accountId);
      }

      if (filters?.categoryId) {
        query = query.eq('category_id', filters.categoryId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as Transaction[];
    },
    enabled: !!user,
  });

  const createTransaction = useMutation({
    mutationFn: async (transaction: {
      account_id: string;
      category_id: string;
      type: TransactionType;
      amount: number;
      description: string;
      date: string;
      recurrence?: 'fixed' | 'variable';
      is_recurring?: boolean;
      recurring_day?: number | null;
      notes?: string | null;
    }) => {
      const { data, error } = await supabase
        .from('transactions')
        .insert({ ...transaction, user_id: user!.id })
        .select()
        .single();

      if (error) throw error;

      // Update account balance
      const amountChange = transaction.type === 'income' ? transaction.amount : -transaction.amount;
      const { data: account } = await supabase
        .from('accounts')
        .select('balance')
        .eq('id', transaction.account_id)
        .single();
      
      if (account) {
        await supabase
          .from('accounts')
          .update({ balance: Number(account.balance) + amountChange })
          .eq('id', transaction.account_id);
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      toast.success('Transação adicionada!');
    },
    onError: () => {
      toast.error('Erro ao adicionar transação');
    },
  });

  const updateTransaction = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Transaction> & { id: string }) => {
      const { data, error } = await supabase
        .from('transactions')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      toast.success('Transação atualizada!');
    },
    onError: () => {
      toast.error('Erro ao atualizar transação');
    },
  });

  const deleteTransaction = useMutation({
    mutationFn: async (transaction: Transaction) => {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', transaction.id);

      if (error) throw error;

      // Revert account balance
      const amountChange = transaction.type === 'income' ? -transaction.amount : transaction.amount;
      const { data: account } = await supabase
        .from('accounts')
        .select('balance')
        .eq('id', transaction.account_id)
        .single();
      
      if (account) {
        await supabase
          .from('accounts')
          .update({ balance: Number(account.balance) + amountChange })
          .eq('id', transaction.account_id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      toast.success('Transação removida!');
    },
    onError: () => {
      toast.error('Erro ao remover transação');
    },
  });

  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const totalExpenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const balance = totalIncome - totalExpenses;

  return {
    transactions,
    isLoading,
    totalIncome,
    totalExpenses,
    balance,
    createTransaction,
    updateTransaction,
    deleteTransaction,
  };
}