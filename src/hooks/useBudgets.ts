import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Budget } from '@/types/database';
import { toast } from 'sonner';

export function useBudgets(month?: number, year?: number) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: budgets = [], isLoading } = useQuery({
    queryKey: ['budgets', user?.id, month, year],
    queryFn: async () => {
      let query = supabase
        .from('budgets')
        .select(`
          *,
          category:categories(*)
        `)
        .eq('user_id', user!.id);

      if (month && year) {
        query = query.eq('month', month).eq('year', year);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      return data as Budget[];
    },
    enabled: !!user,
  });

  const createBudget = useMutation({
    mutationFn: async (budget: { category_id: string; amount: number; month: number; year: number }) => {
      const { data, error } = await supabase
        .from('budgets')
        .insert({ ...budget, user_id: user!.id })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      toast.success('Orçamento definido!');
    },
    onError: () => {
      toast.error('Erro ao definir orçamento');
    },
  });

  const updateBudget = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Budget> & { id: string }) => {
      const { data, error } = await supabase
        .from('budgets')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      toast.success('Orçamento atualizado!');
    },
    onError: () => {
      toast.error('Erro ao atualizar orçamento');
    },
  });

  const deleteBudget = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('budgets')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      toast.success('Orçamento removido!');
    },
    onError: () => {
      toast.error('Erro ao remover orçamento');
    },
  });

  return {
    budgets,
    isLoading,
    createBudget,
    updateBudget,
    deleteBudget,
  };
}