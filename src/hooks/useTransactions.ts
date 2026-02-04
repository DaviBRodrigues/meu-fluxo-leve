import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Transaction, TransactionType } from '@/types/database';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/format';
import { useActivityLogs } from './useActivityLogs';
import { Json } from '@/integrations/supabase/types';

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
  const { logActivity } = useActivityLogs();

  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ['transactions', user?.id, filters],
    queryFn: async () => {
      let query = supabase
        .from('transactions')
        .select(`
          *,
          category:categories(*),
          account:accounts!inner(*)
        `)
        .eq('user_id', user!.id)
        .eq('account.is_active', true)
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

      // Log activity
      await logActivity.mutateAsync({
        action_type: 'create',
        entity_type: 'transaction',
        entity_id: data.id,
        entity_description: transaction.description,
        new_data: JSON.parse(JSON.stringify(transaction)) as Json,
        amount: transaction.amount,
      });

      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      const typeLabel = variables.type === 'income' ? 'Receita' : 'Despesa';
      toast.success(`${typeLabel} de ${formatCurrency(variables.amount)} adicionada com sucesso!`);
    },
    onError: () => {
      toast.error('Erro ao adicionar transação');
    },
  });

  const updateTransaction = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Transaction> & { id: string }) => {
      // Get original data for logging
      const { data: original } = await supabase
        .from('transactions')
        .select('*')
        .eq('id', id)
        .single();

      const { data, error } = await supabase
        .from('transactions')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Log activity
      if (original) {
        await logActivity.mutateAsync({
          action_type: 'update',
          entity_type: 'transaction',
          entity_id: id,
          entity_description: data.description || original.description,
          original_data: JSON.parse(JSON.stringify(original)) as Json,
          new_data: JSON.parse(JSON.stringify(updates)) as Json,
          amount: Number(data.amount),
        });
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      toast.success('Transação atualizada com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao atualizar transação');
    },
  });

  const deleteTransaction = useMutation({
    mutationFn: async (transaction: Transaction) => {
      // Log activity before deletion (with is_deleted flag for tracking)
      await logActivity.mutateAsync({
        action_type: 'delete',
        entity_type: 'transaction',
        entity_id: transaction.id,
        entity_description: transaction.description,
        original_data: JSON.parse(JSON.stringify(transaction)) as Json,
        amount: Number(transaction.amount),
      });

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
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      const typeLabel = variables.type === 'income' ? 'Receita' : 'Despesa';
      toast.success(`${typeLabel} de ${formatCurrency(Number(variables.amount))} removida com sucesso!`);
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
