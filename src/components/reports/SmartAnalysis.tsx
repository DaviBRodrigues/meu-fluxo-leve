import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Brain, TrendingUp, AlertTriangle, AlertCircle, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/format';

interface Insight {
  type: 'positive' | 'warning' | 'alert';
  title: string;
  description: string;
}

interface FinancialData {
  year: number;
  totalBalance: number;
  yearIncome: number;
  yearExpenses: number;
  monthlyData: { month: string; income: number; expenses: number }[];
  categoryBreakdown: { name: string; value: number }[];
  budgets: { category: string; budgeted: number; spent: number }[];
  goals: { name: string; target: number; current: number; completed: boolean }[];
}

interface SmartAnalysisProps {
  financialData: FinancialData;
}

const CACHE_KEY = 'smart-analysis-cache';

function getCachedInsights(year: number): Insight[] | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const cached = JSON.parse(raw);
    if (cached.year === year && Date.now() - cached.timestamp < 3600000) {
      return cached.insights;
    }
  } catch { /* ignore */ }
  return null;
}

function cacheInsights(year: number, insights: Insight[]) {
  localStorage.setItem(CACHE_KEY, JSON.stringify({ year, insights, timestamp: Date.now() }));
}

const insightConfig = {
  positive: {
    icon: TrendingUp,
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
    iconColor: 'text-emerald-500',
    titleColor: 'text-emerald-700 dark:text-emerald-400',
  },
  warning: {
    icon: AlertTriangle,
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
    iconColor: 'text-amber-500',
    titleColor: 'text-amber-700 dark:text-amber-400',
  },
  alert: {
    icon: AlertCircle,
    bg: 'bg-red-500/10',
    border: 'border-red-500/20',
    iconColor: 'text-red-500',
    titleColor: 'text-red-700 dark:text-red-400',
  },
};

export default function SmartAnalysis({ financialData }: SmartAnalysisProps) {
  const [insights, setInsights] = useState<Insight[]>(() => getCachedInsights(financialData.year) || []);
  const [isLoading, setIsLoading] = useState(false);

  const analyze = async () => {
    setIsLoading(true);
    try {
      const userProfile = localStorage.getItem('financial-profile') || '';
      const { data, error } = await supabase.functions.invoke('ai-financial-analysis', {
        body: { financialData, userProfile },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const result: Insight[] = data.insights || [];
      setInsights(result);
      cacheInsights(financialData.year, result);
      toast.success('Análise concluída!');
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || 'Erro ao gerar análise');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-primary" />
          Análise Inteligente
        </CardTitle>
        <Button onClick={analyze} disabled={isLoading} size="sm" className="gap-2">
          <Sparkles className="w-4 h-4" />
          {isLoading ? 'Analisando...' : insights.length ? 'Reanalisar' : 'Analisar'}
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-3 p-3 rounded-lg border">
                <Skeleton className="w-10 h-10 rounded-full shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : insights.length === 0 ? (
          <p className="text-center text-muted-foreground py-6">
            Clique em "Analisar" para a IA gerar insights sobre suas finanças de {financialData.year}.
          </p>
        ) : (
          <div className="space-y-3">
            {insights.map((insight, i) => {
              const config = insightConfig[insight.type] || insightConfig.warning;
              const Icon = config.icon;
              return (
                <div key={i} className={`flex gap-3 p-3 rounded-lg border ${config.bg} ${config.border}`}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${config.bg}`}>
                    <Icon className={`w-5 h-5 ${config.iconColor}`} />
                  </div>
                  <div>
                    <h4 className={`font-medium text-sm ${config.titleColor}`}>{insight.title}</h4>
                    <p className="text-sm text-muted-foreground mt-1">{insight.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
