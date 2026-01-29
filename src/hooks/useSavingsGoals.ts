import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { SavingsGoal } from '@/types/database';
import { toast } from 'sonner';

export function useSavingsGoals() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: goals = [], isLoading } = useQuery({
    queryKey: ['savings_goals', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('savings_goals')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as SavingsGoal[];
    },
    enabled: !!user,
  });

  const createGoal = useMutation({
    mutationFn: async (goal: {
      name: string;
      target_amount: number;
      current_amount?: number;
      target_date?: string | null;
      color?: string;
      icon?: string;
    }) => {
      const { data, error } = await supabase
        .from('savings_goals')
        .insert({ ...goal, user_id: user!.id })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savings_goals'] });
      toast.success('Meta criada!');
    },
    onError: () => {
      toast.error('Erro ao criar meta');
    },
  });

  const updateGoal = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<SavingsGoal> & { id: string }) => {
      const { data, error } = await supabase
        .from('savings_goals')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savings_goals'] });
      toast.success('Meta atualizada!');
    },
    onError: () => {
      toast.error('Erro ao atualizar meta');
    },
  });

  const deleteGoal = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('savings_goals')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savings_goals'] });
      toast.success('Meta removida!');
    },
    onError: () => {
      toast.error('Erro ao remover meta');
    },
  });

  const addToGoal = useMutation({
    mutationFn: async ({ id, amount }: { id: string; amount: number }) => {
      const goal = goals.find(g => g.id === id);
      if (!goal) throw new Error('Meta não encontrada');

      const newAmount = Number(goal.current_amount) + amount;
      const isCompleted = newAmount >= Number(goal.target_amount);

      const { data, error } = await supabase
        .from('savings_goals')
        .update({ 
          current_amount: newAmount,
          is_completed: isCompleted,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['savings_goals'] });
      if (data.is_completed) {
        toast.success('🎉 Parabéns! Meta atingida!');
      } else {
        toast.success('Valor adicionado à meta!');
      }
    },
    onError: () => {
      toast.error('Erro ao adicionar valor');
    },
  });

  const activeGoals = goals.filter(g => !g.is_completed);
  const completedGoals = goals.filter(g => g.is_completed);

  return {
    goals,
    activeGoals,
    completedGoals,
    isLoading,
    createGoal,
    updateGoal,
    deleteGoal,
    addToGoal,
  };
}