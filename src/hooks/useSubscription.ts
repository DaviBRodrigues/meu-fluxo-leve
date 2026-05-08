import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type SubscriptionStatus = 'pending' | 'trial' | 'active' | 'expired' | 'cancelled';

export interface SubscriptionInfo {
  status: SubscriptionStatus;
  hasAccess: boolean;
  isTrial: boolean;
  isActive: boolean;
  trialExpiresAt: Date | null;
  subscriptionExpiresAt: Date | null;
  daysRemaining: number | null;
  accessViaBypass: boolean;
}

export function useSubscription() {
  const { user } = useAuth();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['subscription', user?.id],
    queryFn: async (): Promise<SubscriptionInfo> => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('subscription_status, trial_expires_at, subscription_expires_at, access_via_bypass')
        .eq('user_id', user!.id)
        .single();

      const { data: roles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user!.id);
      const isAdmin = (roles ?? []).some((r) => r.role === 'admin');

      const status = (profile?.subscription_status ?? 'pending') as SubscriptionStatus;
      const trialExpiresAt = profile?.trial_expires_at ? new Date(profile.trial_expires_at) : null;
      const subExpiresAt = profile?.subscription_expires_at
        ? new Date(profile.subscription_expires_at)
        : null;
      const now = new Date();

      const trialValid = status === 'trial' && trialExpiresAt && trialExpiresAt > now;
      const activeValid =
        status === 'active' && (!subExpiresAt || subExpiresAt > now);
      const bypass = !!profile?.access_via_bypass;

      const hasAccess = isAdmin || bypass || !!trialValid || !!activeValid;

      let daysRemaining: number | null = null;
      const ref = activeValid ? subExpiresAt : trialValid ? trialExpiresAt : null;
      if (ref) {
        daysRemaining = Math.max(0, Math.ceil((ref.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
      }

      return {
        status,
        hasAccess,
        isTrial: !!trialValid,
        isActive: !!activeValid,
        trialExpiresAt,
        subscriptionExpiresAt: subExpiresAt,
        daysRemaining,
        accessViaBypass: bypass,
      };
    },
    enabled: !!user,
    staleTime: 30_000,
  });

  return { subscription: data, isLoading, refetch };
}
