import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface AccessCode {
  id: string;
  code: string;
  description: string | null;
  is_active: boolean;
  max_uses: number | null;
  current_uses: number;
  created_by: string | null;
  created_at: string;
  expires_at: string | null;
}

export function useAccessCodes() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: accessCodes = [], isLoading } = useQuery({
    queryKey: ['access_codes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('access_codes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as AccessCode[];
    },
    enabled: !!user,
  });

  const createAccessCode = useMutation({
    mutationFn: async ({
      code,
      description,
      maxUses,
      expiresAt,
    }: {
      code: string;
      description?: string;
      maxUses?: number | null;
      expiresAt?: string | null;
    }) => {
      const { data, error } = await supabase
        .from('access_codes')
        .insert({
          code,
          description: description || null,
          max_uses: maxUses || null,
          expires_at: expiresAt || null,
          created_by: user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['access_codes'] });
      toast.success('Código de acesso criado!');
    },
    onError: (error: Error) => {
      if (error.message.includes('duplicate')) {
        toast.error('Este código já existe');
      } else {
        toast.error('Erro ao criar código de acesso');
      }
    },
  });

  const updateAccessCode = useMutation({
    mutationFn: async ({
      id,
      isActive,
    }: {
      id: string;
      isActive: boolean;
    }) => {
      const { data, error } = await supabase
        .from('access_codes')
        .update({ is_active: isActive })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['access_codes'] });
      toast.success('Código de acesso atualizado!');
    },
    onError: () => {
      toast.error('Erro ao atualizar código');
    },
  });

  const deleteAccessCode = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('access_codes')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['access_codes'] });
      toast.success('Código de acesso excluído!');
    },
    onError: () => {
      toast.error('Erro ao excluir código');
    },
  });

  const generateRandomCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  return {
    accessCodes,
    isLoading,
    createAccessCode,
    updateAccessCode,
    deleteAccessCode,
    generateRandomCode,
  };
}
