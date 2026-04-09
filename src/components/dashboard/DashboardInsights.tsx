import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Brain, TrendingUp, AlertTriangle, AlertCircle, Sparkles, ArrowRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Insight {
  type: 'positive' | 'warning' | 'alert';
  title: string;
  description: string;
}

interface DashboardInsightsProps {
  totalBalance: number;
  monthIncome: number;
  monthExpenses: number;
  month: number;
  year: number;
}

const CACHE_KEY = 'dashboard-insights-cache';

function getCached(month: number, year: number): Insight[] | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const cached = JSON.parse(raw);
    if (cached.month === month && cached.year === year && Date.now() - cached.timestamp < 3600000) {
      return cached.insights;
    }
  } catch { /* ignore */ }
  return null;
}

function setCache(month: number, year: number, insights: Insight[]) {
  localStorage.setItem(CACHE_KEY, JSON.stringify({ month, year, insights, timestamp: Date.now() }));
}

const iconMap = {
  positive: TrendingUp,
  warning: AlertTriangle,
  alert: AlertCircle,
};

const colorMap = {
  positive: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', icon: 'text-emerald-500', title: 'text-emerald-700 dark:text-emerald-400' },
  warning: { bg: 'bg-amber-500/10', border: 'border-amber-500/20', icon: 'text-amber-500', title: 'text-amber-700 dark:text-amber-400' },
  alert: { bg: 'bg-red-500/10', border: 'border-red-500/20', icon: 'text-red-500', title: 'text-red-700 dark:text-red-400' },
};

export default function DashboardInsights({ totalBalance, monthIncome, monthExpenses, month, year }: DashboardInsightsProps) {
  const navigate = useNavigate();
  const [insights, setInsights] = useState<Insight[]>(() => getCached(month, year) || []);
  const [isLoading, setIsLoading] = useState(false);

  const analyze = async () => {
    setIsLoading(true);
    try {
      const financialData = {
        year,
        totalBalance,
        yearIncome: monthIncome,
        yearExpenses: monthExpenses,
        monthlyData: [{ month: `Mês ${month}`, income: monthIncome, expenses: monthExpenses }],
        categoryBreakdown: [],
        budgets: [],
        goals: [],
      };

      const { data, error } = await supabase.functions.invoke('ai-financial-analysis', {
        body: { financialData },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const result: Insight[] = (data.insights || []).slice(0, 3);
      setInsights(result);
      setCache(month, year, result);
      toast.success('Insights gerados!');
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || 'Erro ao gerar insights');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Brain className="w-5 h-5 text-primary" />
          Insights IA
        </CardTitle>
        <div className="flex gap-2">
          <Button onClick={analyze} disabled={isLoading} size="sm" variant="outline" className="gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            {isLoading ? 'Analisando...' : insights.length ? 'Atualizar' : 'Analisar'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-2 p-2 rounded-lg border">
                <Skeleton className="w-8 h-8 rounded-full shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3.5 w-1/3" />
                  <Skeleton className="h-3 w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : insights.length === 0 ? (
          <p className="text-center text-muted-foreground py-4 text-sm">
            Clique em "Analisar" para obter insights rápidos sobre o mês atual.
          </p>
        ) : (
          <div className="space-y-2">
            {insights.map((insight, i) => {
              const colors = colorMap[insight.type] || colorMap.warning;
              const Icon = iconMap[insight.type] || AlertTriangle;
              return (
                <div key={i} className={`flex gap-2 p-2 rounded-lg border ${colors.bg} ${colors.border}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${colors.bg}`}>
                    <Icon className={`w-4 h-4 ${colors.icon}`} />
                  </div>
                  <div className="min-w-0">
                    <h4 className={`font-medium text-xs ${colors.title}`}>{insight.title}</h4>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{insight.description}</p>
                  </div>
                </div>
              );
            })}
            <Button variant="ghost" size="sm" className="w-full gap-1 text-xs mt-1" onClick={() => navigate('/relatorios')}>
              Ver análise completa <ArrowRight className="w-3 h-3" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
