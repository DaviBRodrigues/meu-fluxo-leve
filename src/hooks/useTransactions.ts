import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { addMonths, format } from 'date-fns';
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
        // Use YYYY-MM-DD strings directly to avoid timezone issues
        const startDate = `${filters.year}-${String(filters.month).padStart(2, '0')}-01`;
        const lastDay = new Date(filters.year, filters.month, 0).getDate();
        const endDate = `${filters.year}-${String(filters.month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
        query = query
          .gte('date', startDate)
          .lte('date', endDate);
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
      is_installment?: boolean;
      installment_count?: number;
    }) => {
      const { is_installment, installment_count, ...baseTransaction } = transaction;

      // If installment, create multiple transactions
      if (is_installment && installment_count && installment_count >= 2) {
        const installmentGroupId = crypto.randomUUID();
        const installmentAmount = Math.round((transaction.amount / installment_count) * 100) / 100;
        const baseDate = new Date(transaction.date + 'T12:00:00');
        
        const installments = [];
        for (let i = 0; i < installment_count; i++) {
          const installmentDate = addMonths(baseDate, i);
          installments.push({
            ...baseTransaction,
            user_id: user!.id,
            amount: installmentAmount,
            description: `${transaction.description} (${i + 1}/${installment_count})`,
            date: format(installmentDate, 'yyyy-MM-dd'),
            is_installment: true,
            installment_count,
            installment_number: i + 1,
            installment_group_id: installmentGroupId,
          });
        }

        const { data, error } = await supabase
          .from('transactions')
          .insert(installments)
          .select();

        if (error) throw error;

        // Only update balance for the first installment (current month)
        const firstInstallmentAmount = transaction.type === 'income' ? installmentAmount : -installmentAmount;
        const { data: account } = await supabase
          .from('accounts')
          .select('balance')
          .eq('id', transaction.account_id)
          .single();
        
        if (account) {
          await supabase
            .from('accounts')
            .update({ balance: Number(account.balance) + firstInstallmentAmount })
            .eq('id', transaction.account_id);
        }

        // Log activity
        await logActivity.mutateAsync({
          action_type: 'create',
          entity_type: 'transaction',
          entity_id: data[0].id,
          entity_description: `${transaction.description} (${installment_count}x de ${formatCurrency(installmentAmount)})`,
          new_data: JSON.parse(JSON.stringify({ ...transaction, installment_count })) as Json,
          amount: transaction.amount,
        });

        return data[0];
      }

      // Normal transaction (no installments)
      const { data, error } = await supabase
        .from('transactions')
        .insert({ ...baseTransaction, user_id: user!.id })
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
      if (variables.is_installment && variables.installment_count) {
        toast.success(`${typeLabel} parcelada em ${variables.installment_count}x criada com sucesso!`);
      } else {
        toast.success(`${typeLabel} de ${formatCurrency(variables.amount)} adicionada com sucesso!`);
      }
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

  const deleteInstallmentGroup = useMutation({
    mutationFn: async (groupId: string) => {
      // Get all installments in the group
      const { data: installments, error: fetchError } = await supabase
        .from('transactions')
        .select('*')
        .eq('installment_group_id', groupId)
        .eq('user_id', user!.id);

      if (fetchError) throw fetchError;
      if (!installments || installments.length === 0) return;

      // Log activity
      const firstInstallment = installments[0];
      const baseDesc = firstInstallment.description.replace(/\s*\(\d+\/\d+\)$/, '');
      await logActivity.mutateAsync({
        action_type: 'delete',
        entity_type: 'transaction',
        entity_id: groupId,
        entity_description: `Parcelamento: ${baseDesc} (${installments.length} parcelas)`,
        original_data: JSON.parse(JSON.stringify(installments)) as Json,
        amount: installments.reduce((sum, t) => sum + Number(t.amount), 0),
      });

      // Delete all installments
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('installment_group_id', groupId)
        .eq('user_id', user!.id);

      if (error) throw error;

      // Revert balance only for past installments (already counted)
      const now = new Date();
      const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      const paidInstallments = installments.filter(t => t.date <= today);
      
      // Group by account_id to batch balance updates
      const accountAdjustments = new Map<string, number>();
      for (const t of paidInstallments) {
        const adjust = t.type === 'income' ? -Number(t.amount) : Number(t.amount);
        accountAdjustments.set(t.account_id, (accountAdjustments.get(t.account_id) || 0) + adjust);
      }

      for (const [accountId, adjustment] of accountAdjustments) {
        const { data: account } = await supabase
          .from('accounts')
          .select('balance')
          .eq('id', accountId)
          .single();
        if (account) {
          await supabase
            .from('accounts')
            .update({ balance: Number(account.balance) + adjustment })
            .eq('id', accountId);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['installment-groups'] });
      toast.success('Parcelamento removido com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao remover parcelamento');
    },
  });

  const isTransfer = (t: Transaction) => t.description?.startsWith('[Transferência]');

  const totalIncome = transactions
    .filter(t => t.type === 'income' && !isTransfer(t))
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const totalExpenses = transactions
    .filter(t => t.type === 'expense' && !isTransfer(t))
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const totalTransfers = transactions
    .filter(t => t.type === 'expense' && isTransfer(t))
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const balance = totalIncome - totalExpenses;

  return {
    transactions,
    isLoading,
    totalIncome,
    totalExpenses,
    totalTransfers,
    balance,
    createTransaction,
    updateTransaction,
    deleteTransaction,
  };
}
