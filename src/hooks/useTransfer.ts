import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface TransferData {
  from_account_id: string;
  to_account_id: string;
  amount: number;
  description: string;
  date: string;
  notes: string | null;
}

export function useTransfer() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const createTransfer = useMutation({
    mutationFn: async (transfer: TransferData) => {
      // First, get a "Transfer" category or create placeholder transactions
      // We'll use the description to identify transfers
      
      // 1. Debit from source account (expense)
      const { data: expenseCategory } = await supabase
        .from('categories')
        .select('id')
        .eq('type', 'expense')
        .eq('is_default', true)
        .limit(1)
        .single();

      const { data: incomeCategory } = await supabase
        .from('categories')
        .select('id')
        .eq('type', 'income')
        .eq('is_default', true)
        .limit(1)
        .single();

      if (!expenseCategory || !incomeCategory) {
        throw new Error('Categories not found');
      }

      // Create expense transaction (debit from source)
      const { error: expenseError } = await supabase
        .from('transactions')
        .insert({
          user_id: user!.id,
          account_id: transfer.from_account_id,
          category_id: expenseCategory.id,
          type: 'expense',
          amount: transfer.amount,
          description: `[Transferência] ${transfer.description}`,
          date: transfer.date,
          notes: transfer.notes,
          recurrence: 'variable',
        });

      if (expenseError) throw expenseError;

      // Create income transaction (credit to destination)
      const { error: incomeError } = await supabase
        .from('transactions')
        .insert({
          user_id: user!.id,
          account_id: transfer.to_account_id,
          category_id: incomeCategory.id,
          type: 'income',
          amount: transfer.amount,
          description: `[Transferência] ${transfer.description}`,
          date: transfer.date,
          notes: transfer.notes,
          recurrence: 'variable',
        });

      if (incomeError) throw incomeError;

      // Update account balances atomically
      await supabase.rpc('update_account_balance', {
        p_account_id: transfer.from_account_id,
        p_amount_change: -transfer.amount,
      });
      await supabase.rpc('update_account_balance', {
        p_account_id: transfer.to_account_id,
        p_amount_change: transfer.amount,
      });

      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      toast.success('Transferência realizada!');
    },
    onError: () => {
      toast.error('Erro ao realizar transferência');
    },
  });

  return { createTransfer };
}
