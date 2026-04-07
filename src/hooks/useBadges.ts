import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useSavingsGoals } from './useSavingsGoals';

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  earned: boolean;
  progress?: number;
  maxProgress?: number;
}

export function useBadges() {
  const { user } = useAuth();
  const { completedGoals, goals } = useSavingsGoals();

  // Get all transactions for streak calculation
  const { data: allTransactions = [] } = useQuery({
    queryKey: ['all-transactions-for-badges', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transactions')
        .select('date, type')
        .eq('user_id', user!.id)
        .order('date', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const badges = useMemo<Badge[]>(() => {
    // Calculate streak (consecutive days with transactions)
    const uniqueDays = [...new Set(allTransactions.map(t => t.date))].sort().reverse();
    let streak = 0;
    if (uniqueDays.length > 0) {
      const today = new Date();
      const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      
      // Check if latest entry is today or yesterday
      const latest = uniqueDays[0];
      const latestDate = new Date(latest + 'T12:00:00');
      const diffMs = today.getTime() - latestDate.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      
      if (diffDays <= 1) {
        streak = 1;
        for (let i = 1; i < uniqueDays.length; i++) {
          const prevDate = new Date(uniqueDays[i - 1] + 'T12:00:00');
          const currDate = new Date(uniqueDays[i] + 'T12:00:00');
          const diff = Math.floor((prevDate.getTime() - currDate.getTime()) / (1000 * 60 * 60 * 24));
          if (diff === 1) {
            streak++;
          } else {
            break;
          }
        }
      }
    }

    const totalTransactions = allTransactions.length;

    return [
      {
        id: 'first-transaction',
        name: 'Primeiro Passo',
        description: 'Registre sua primeira transação',
        icon: '🚀',
        earned: totalTransactions >= 1,
        progress: Math.min(totalTransactions, 1),
        maxProgress: 1,
      },
      {
        id: 'streak-3',
        name: 'Constância',
        description: 'Registre transações por 3 dias seguidos',
        icon: '🔥',
        earned: streak >= 3,
        progress: Math.min(streak, 3),
        maxProgress: 3,
      },
      {
        id: 'streak-7',
        name: 'Disciplinado',
        description: 'Registre transações por 7 dias seguidos',
        icon: '⭐',
        earned: streak >= 7,
        progress: Math.min(streak, 7),
        maxProgress: 7,
      },
      {
        id: 'streak-30',
        name: 'Mestre Financeiro',
        description: 'Registre transações por 30 dias seguidos',
        icon: '👑',
        earned: streak >= 30,
        progress: Math.min(streak, 30),
        maxProgress: 30,
      },
      {
        id: 'transactions-10',
        name: 'Organizando',
        description: 'Registre 10 transações',
        icon: '📊',
        earned: totalTransactions >= 10,
        progress: Math.min(totalTransactions, 10),
        maxProgress: 10,
      },
      {
        id: 'transactions-50',
        name: 'Controlador',
        description: 'Registre 50 transações',
        icon: '📈',
        earned: totalTransactions >= 50,
        progress: Math.min(totalTransactions, 50),
        maxProgress: 50,
      },
      {
        id: 'transactions-100',
        name: 'Expert',
        description: 'Registre 100 transações',
        icon: '🏆',
        earned: totalTransactions >= 100,
        progress: Math.min(totalTransactions, 100),
        maxProgress: 100,
      },
      {
        id: 'first-goal',
        name: 'Sonhador',
        description: 'Crie sua primeira meta de economia',
        icon: '🎯',
        earned: goals.length >= 1,
        progress: Math.min(goals.length, 1),
        maxProgress: 1,
      },
      {
        id: 'goal-completed',
        name: 'Conquistador',
        description: 'Complete uma meta de economia',
        icon: '🎉',
        earned: completedGoals.length >= 1,
        progress: Math.min(completedGoals.length, 1),
        maxProgress: 1,
      },
      {
        id: 'goals-3',
        name: 'Ambicioso',
        description: 'Complete 3 metas de economia',
        icon: '💎',
        earned: completedGoals.length >= 3,
        progress: Math.min(completedGoals.length, 3),
        maxProgress: 3,
      },
    ];
  }, [allTransactions, goals, completedGoals]);

  const earnedBadges = badges.filter(b => b.earned);
  const pendingBadges = badges.filter(b => !b.earned);

  return { badges, earnedBadges, pendingBadges };
}
