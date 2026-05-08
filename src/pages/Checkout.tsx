import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Loader2, Sparkles, LogOut, Crown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/hooks/useSubscription';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Plan {
  id: 'basic' | 'essential' | 'premium';
  name: string;
  price: number;
  period: string;
  totalLabel: string;
  badge?: string;
  highlight?: boolean;
  features: string[];
}

const PLANS: Plan[] = [
  {
    id: 'basic',
    name: 'Básico',
    price: 59.9,
    period: '/mês',
    totalLabel: 'Cobrança mensal',
    features: ['Acesso completo ao Equilibra', 'Suporte por e-mail', 'Cancele quando quiser'],
  },
  {
    id: 'essential',
    name: 'Essencial',
    price: 39.9,
    period: '/mês',
    totalLabel: 'R$ 119,70 a cada 3 meses',
    badge: 'Mais escolhido',
    highlight: true,
    features: ['Tudo do Básico', '33% de economia', 'Renovação trimestral'],
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 29.9,
    period: '/mês',
    totalLabel: 'R$ 179,40 a cada 6 meses',
    badge: 'Melhor custo',
    features: ['Tudo do Essencial', '50% de economia', 'Renovação semestral'],
  },
];

export default function Checkout() {
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const { subscription, refetch } = useSubscription();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const handleSubscribe = async (planId: Plan['id']) => {
    setLoadingPlan(planId);
    try {
      const { data, error } = await supabase.functions.invoke('activate-subscription', {
        body: { action: 'simulate_payment', plan_id: planId },
      });
      if (error || !data?.ok) throw new Error(data?.error ?? error?.message ?? 'Falha');
      toast.success('Pagamento confirmado! Bem-vindo. ');
      await refetch();
      navigate('/');
    } catch (e) {
      toast.error('Erro ao processar pagamento: ' + (e as Error).message);
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-10 space-y-3">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium">
            <Sparkles className="w-4 h-4" />
            {subscription?.isTrial && subscription.daysRemaining !== null
              ? `Você está no período de teste — ${subscription.daysRemaining} dia(s) restantes`
              : 'Escolha seu plano'}
          </div>
          <h1 className="text-4xl font-bold">Continue organizando suas finanças</h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            {user?.email} — Assine para liberar acesso completo ao Equilibra.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {PLANS.map((plan) => (
            <Card
              key={plan.id}
              className={cn(
                'relative transition-all',
                plan.highlight && 'border-primary shadow-lg md:scale-105'
              )}
            >
              {plan.badge && (
                <Badge
                  className="absolute -top-3 left-1/2 -translate-x-1/2"
                  variant={plan.highlight ? 'default' : 'secondary'}
                >
                  {plan.badge}
                </Badge>
              )}
              <CardHeader>
                <div className="flex items-center gap-2">
                  {plan.highlight && <Crown className="w-5 h-5 text-primary" />}
                  <CardTitle>{plan.name}</CardTitle>
                </div>
                <CardDescription>{plan.totalLabel}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold">
                      R$ {plan.price.toFixed(2).replace('.', ',')}
                    </span>
                    <span className="text-muted-foreground">{plan.period}</span>
                  </div>
                </div>
                <ul className="space-y-2 text-sm">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-income mt-0.5 shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  className="w-full"
                  variant={plan.highlight ? 'default' : 'outline'}
                  disabled={loadingPlan !== null}
                  onClick={() => handleSubscribe(plan.id)}
                >
                  {loadingPlan === plan.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'Assinar agora'
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center space-y-3">
          <p className="text-xs text-muted-foreground">
            Modo de teste: o pagamento é simulado. Em produção, integraremos um provedor real.
          </p>
          <Button variant="ghost" size="sm" onClick={() => signOut()}>
            <LogOut className="w-4 h-4 mr-2" /> Sair
          </Button>
        </div>
      </div>
    </div>
  );
}
