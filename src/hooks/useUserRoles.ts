import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export type AppRole = 'admin' | 'user';

export interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
  created_at: string;
}

export function useUserRoles() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Get current user's roles
  const { data: roles = [], isLoading: isLoadingRoles } = useQuery({
    queryKey: ['user_roles', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', user!.id);

      if (error) throw error;
      return data as UserRole[];
    },
    enabled: !!user,
  });

  // Check if current user is admin
  const isAdmin = roles.some(r => r.role === 'admin');

  // Get all users' roles (admin only)
  const { data: allRoles = [], isLoading: isLoadingAllRoles } = useQuery({
    queryKey: ['all_user_roles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_roles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as UserRole[];
    },
    enabled: !!user && isAdmin,
  });

  const addRole = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: AppRole }) => {
      const { data, error } = await supabase
        .from('user_roles')
        .insert([{ user_id: userId, role }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user_roles'] });
      queryClient.invalidateQueries({ queryKey: ['all_user_roles'] });
      toast.success('Permissão adicionada!');
    },
    onError: () => {
      toast.error('Erro ao adicionar permissão');
    },
  });

  const removeRole = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: AppRole }) => {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .eq('role', role);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user_roles'] });
      queryClient.invalidateQueries({ queryKey: ['all_user_roles'] });
      toast.success('Permissão removida!');
    },
    onError: () => {
      toast.error('Erro ao remover permissão');
    },
  });

  return {
    roles,
    allRoles,
    isAdmin,
    isLoading: isLoadingRoles,
    isLoadingAllRoles,
    addRole,
    removeRole,
  };
}
