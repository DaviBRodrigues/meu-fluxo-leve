import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { RecurringReminder, TransactionType } from '@/types/database';
import { toast } from 'sonner';

export function useRecurringReminders() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: reminders = [], isLoading } = useQuery({
    queryKey: ['recurring_reminders', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('recurring_reminders')
        .select(`
          *,
          category:categories(*),
          account:accounts(*)
        `)
        .eq('user_id', user!.id)
        .eq('is_active', true)
        .order('day_of_month', { ascending: true });

      if (error) throw error;
      return data as RecurringReminder[];
    },
    enabled: !!user,
  });

  const createReminder = useMutation({
    mutationFn: async (reminder: {
      description: string;
      amount: number;
      type: TransactionType;
      category_id: string;
      account_id: string;
      day_of_month: number;
    }) => {
      const { data, error } = await supabase
        .from('recurring_reminders')
        .insert({ ...reminder, user_id: user!.id })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring_reminders'] });
      toast.success('Lembrete criado!');
    },
    onError: () => {
      toast.error('Erro ao criar lembrete');
    },
  });

  const updateReminder = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<RecurringReminder> & { id: string }) => {
      const { data, error } = await supabase
        .from('recurring_reminders')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring_reminders'] });
      toast.success('Lembrete atualizado!');
    },
    onError: () => {
      toast.error('Erro ao atualizar lembrete');
    },
  });

  const deleteReminder = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('recurring_reminders')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring_reminders'] });
      toast.success('Lembrete removido!');
    },
    onError: () => {
      toast.error('Erro ao remover lembrete');
    },
  });

  // Get reminders that are due today or overdue
  const today = new Date().getDate();
  const dueReminders = reminders.filter(r => {
    if (!r.last_reminded_at) return r.day_of_month <= today;
    const lastReminded = new Date(r.last_reminded_at);
    const currentMonth = new Date().getMonth();
    return lastReminded.getMonth() !== currentMonth && r.day_of_month <= today;
  });

  return {
    reminders,
    dueReminders,
    isLoading,
    createReminder,
    updateReminder,
    deleteReminder,
  };
}