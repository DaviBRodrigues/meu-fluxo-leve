import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Account } from '@/types/database';
import { toast } from 'sonner';

export function useAccounts() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: accounts = [], isLoading } = useQuery({
    queryKey: ['accounts', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .eq('user_id', user!.id)
        .eq('is_active', true)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as Account[];
    },
    enabled: !!user,
  });

  const createAccount = useMutation({
    mutationFn: async (account: Omit<Account, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('accounts')
        .insert({ ...account, user_id: user!.id })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      toast.success('Conta criada com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao criar conta');
    },
  });

  const updateAccount = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Account> & { id: string }) => {
      const { data, error } = await supabase
        .from('accounts')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      toast.success('Conta atualizada!');
    },
    onError: () => {
      toast.error('Erro ao atualizar conta');
    },
  });

  const deleteAccount = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('accounts')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      toast.success('Conta removida!');
    },
    onError: () => {
      toast.error('Erro ao remover conta');
    },
  });

  const recalculateBalances = useMutation({
    mutationFn: async () => {
      // For each account, recalculate balance from transactions
      for (const account of accounts) {
        const { data: txns } = await supabase
          .from('transactions')
          .select('type, amount')
          .eq('account_id', account.id);

        if (txns) {
          const computedBalance = txns.reduce((sum, t) => {
            return sum + (t.type === 'income' ? Number(t.amount) : -Number(t.amount));
          }, 0);

          // Keep initial balance difference (user-set balance before any transactions)
          // If no transactions exist, keep current balance as-is
          if (txns.length > 0) {
            await supabase
              .from('accounts')
              .update({ balance: computedBalance })
              .eq('id', account.id);
          }
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      toast.success('Saldos recalculados com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao recalcular saldos');
    },
  });

  const totalBalance = accounts.reduce((sum, acc) => sum + Number(acc.balance), 0);

  return {
    accounts,
    isLoading,
    totalBalance,
    createAccount,
    updateAccount,
    deleteAccount,
    recalculateBalances,
  };
}