import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useUserRoles, AppRole } from './useUserRoles';

export interface UserProfile {
  id: string;
  user_id: string;
  full_name: string | null;
  is_test_user: boolean;
  is_active: boolean;
  test_expiration_days: number | null;
  test_expires_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  last_seen_at: string | null;
  email?: string;
  last_sign_in_at?: string | null;
  roles?: AppRole[];
}

export function useAdminUsers() {
  const { user } = useAuth();
  const { isAdmin } = useUserRoles();
  const queryClient = useQueryClient();

  // Fetch auth user data (emails, last sign in)
  const { data: authUsersMap = {} } = useQuery({
    queryKey: ['admin_auth_users'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('admin-list-users');
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data.users as Record<string, { email: string; last_sign_in_at: string | null }>;
    },
    enabled: !!user && isAdmin,
  });

  // Get all user profiles (admin only)
  const { data: users = [], isLoading } = useQuery({
    queryKey: ['admin_users', authUsersMap],
    queryFn: async () => {
      // Get profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Get all roles
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('*');

      if (rolesError) throw rolesError;

      // Combine profiles with their roles and auth data
      return (profiles || []).map(profile => ({
        ...profile,
        is_active: (profile as any).is_active ?? true,
        last_seen_at: (profile as any).last_seen_at ?? null,
        email: authUsersMap[profile.user_id]?.email || undefined,
        last_sign_in_at: authUsersMap[profile.user_id]?.last_sign_in_at || null,
        roles: (roles || [])
          .filter(r => r.user_id === profile.user_id)
          .map(r => r.role as AppRole),
      })) as UserProfile[];
    },
    enabled: !!user && isAdmin,
  });

  // Update user profile (test user settings)
  const updateProfile = useMutation({
    mutationFn: async ({
      userId,
      isTestUser,
      expirationDays,
    }: {
      userId: string;
      isTestUser: boolean;
      expirationDays?: number | null;
    }) => {
      const updates: Record<string, unknown> = {
        is_test_user: isTestUser,
        test_expiration_days: expirationDays || null,
      };

      if (isTestUser && expirationDays) {
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + expirationDays);
        updates.test_expires_at = expiresAt.toISOString();
      } else {
        updates.test_expires_at = null;
      }

      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin_users'] });
      toast.success('Usuário atualizado!');
    },
    onError: () => {
      toast.error('Erro ao atualizar usuário');
    },
  });

  // Toggle admin role
  const toggleAdminRole = useMutation({
    mutationFn: async ({ userId, makeAdmin }: { userId: string; makeAdmin: boolean }) => {
      if (makeAdmin) {
        const { error } = await supabase
          .from('user_roles')
          .insert([{ user_id: userId, role: 'admin' }]);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', userId)
          .eq('role', 'admin');
        if (error) throw error;
      }
    },
    onSuccess: (_, { makeAdmin }) => {
      queryClient.invalidateQueries({ queryKey: ['admin_users'] });
      queryClient.invalidateQueries({ queryKey: ['all_user_roles'] });
      toast.success(makeAdmin ? 'Administrador adicionado!' : 'Administrador removido!');
    },
    onError: () => {
      toast.error('Erro ao alterar permissões');
    },
  });

  // Toggle user active status
  const toggleUserActive = useMutation({
    mutationFn: async ({ userId, isActive }: { userId: string; isActive: boolean }) => {
      const { data, error } = await supabase.functions.invoke('admin-toggle-user-active', {
        body: { userId, isActive },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: (_, { isActive }) => {
      queryClient.invalidateQueries({ queryKey: ['admin_users'] });
      toast.success(isActive ? 'Usuário ativado!' : 'Usuário desativado!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao alterar status do usuário');
    },
  });

  // Delete test user
  const deleteTestUser = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('user_id', userId)
        .eq('is_test_user', true);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin_users'] });
      toast.success('Usuário de teste excluído!');
    },
    onError: () => {
      toast.error('Erro ao excluir usuário de teste');
    },
  });

  return {
    users,
    isLoading,
    updateProfile,
    toggleAdminRole,
    toggleUserActive,
    deleteTestUser,
  };
}
