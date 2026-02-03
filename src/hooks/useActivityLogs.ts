import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Json } from '@/integrations/supabase/types';

export interface ActivityLog {
  id: string;
  user_id: string;
  action_type: 'create' | 'update' | 'delete';
  entity_type: string;
  entity_id: string;
  entity_description: string;
  original_data: Json | null;
  new_data: Json | null;
  amount: number | null;
  is_deleted: boolean;
  created_at: string;
}

interface LogActivityParams {
  action_type: 'create' | 'update' | 'delete';
  entity_type: string;
  entity_id: string;
  entity_description: string;
  original_data?: Json | null;
  new_data?: Json | null;
  amount?: number | null;
}

export function useActivityLogs() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['activity_logs', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('activity_logs')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as ActivityLog[];
    },
    enabled: !!user,
  });

  const logActivity = useMutation({
    mutationFn: async (params: LogActivityParams) => {
      const { data, error } = await supabase
        .from('activity_logs')
        .insert([{
          user_id: user!.id,
          action_type: params.action_type,
          entity_type: params.entity_type,
          entity_id: params.entity_id,
          entity_description: params.entity_description,
          original_data: params.original_data ?? null,
          new_data: params.new_data ?? null,
          amount: params.amount ?? null,
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activity_logs'] });
    },
  });

  const clearLogs = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('activity_logs')
        .delete()
        .eq('user_id', user!.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activity_logs'] });
      toast.success('Histórico limpo com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao limpar histórico');
    },
  });

  const markAsDeleted = useMutation({
    mutationFn: async (logId: string) => {
      const { error } = await supabase
        .from('activity_logs')
        .update({ is_deleted: true })
        .eq('id', logId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activity_logs'] });
    },
  });

  return {
    logs,
    isLoading,
    logActivity,
    clearLogs,
    markAsDeleted,
  };
}
