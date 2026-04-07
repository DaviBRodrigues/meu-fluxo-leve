import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Category, TransactionType } from '@/types/database';
import { toast } from 'sonner';

export function useCategories(type?: TransactionType) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['categories', user?.id, type],
    queryFn: async () => {
      let query = supabase
        .from('categories')
        .select('*')
        .order('is_default', { ascending: false })
        .order('name');

      if (type) {
        query = query.eq('type', type);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as Category[];
    },
    enabled: !!user,
  });

  const createCategory = useMutation({
    mutationFn: async (category: { name: string; type: TransactionType; color: string; icon?: string }) => {
      const { data, error } = await supabase
        .from('categories')
        .insert({ ...category, user_id: user!.id, is_default: false })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Categoria criada!');
    },
    onError: () => {
      toast.error('Erro ao criar categoria');
    },
  });

  const incomeCategories = categories.filter(c => c.type === 'income');
  const expenseCategories = categories.filter(c => c.type === 'expense');
  const parentCategories = categories.filter(c => !c.parent_id);
  const getSubcategories = (parentId: string) => categories.filter(c => c.parent_id === parentId);

  return {
    categories,
    incomeCategories,
    expenseCategories,
    parentCategories,
    getSubcategories,
    isLoading,
    createCategory,
  };
}