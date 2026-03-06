import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useBudgets } from '@/hooks/useBudgets';
import { useTransactions } from '@/hooks/useTransactions';
import { formatCurrency } from '@/lib/format';
import { AlertTriangle, PiggyBank } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BudgetProgressProps {
  month: number;
  year: number;
}

export default function BudgetProgress({ month, year }: BudgetProgressProps) {
  const navigate = useNavigate();
  const { budgets, isLoading } = useBudgets(month, year);
  const { transactions } = useTransactions({ month, year, type: 'expense' });

  // Calculate spending per category
  const spendingByCategory = transactions.reduce((acc, t) => {
    acc[t.category_id] = (acc[t.category_id] || 0) + Number(t.amount);
    return acc;
  }, {} as Record<string, number>);

  // Get budgets with alerts (>= 80%)
  const budgetsWithStatus = budgets.map((budget) => {
    const spent = spendingByCategory[budget.category_id] || 0;
    const percentage = (spent / Number(budget.amount)) * 100;
    return {
      ...budget,
      spent,
      percentage,
      isOver: percentage > 100,
      isWarning: percentage >= 80 && percentage <= 100,
    };
  });

  const alertBudgets = budgetsWithStatus.filter(b => b.isWarning || b.isOver);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4 animate-pulse">
            <div className="h-4 bg-muted rounded w-1/3" />
            <div className="h-2 bg-muted rounded w-full" />
            <div className="h-2 bg-muted rounded w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (budgets.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <PiggyBank className="w-5 h-5 text-primary" />
            Orçamentos do Mês
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={() => navigate('/orcamentos')}>
            Ver todos
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Alert Summary */}
        {alertBudgets.length > 0 && (
          <div className="mb-4 p-3 rounded-lg bg-warning/10 border border-warning/20">
            <div className="flex items-center gap-2 text-warning">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-sm font-medium">
                {alertBudgets.length} orçamento(s) próximo(s) do limite
              </span>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {budgetsWithStatus.slice(0, 4).map((budget) => (
            <div key={budget.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: budget.category?.color }}
                  />
                  <span className="text-sm font-medium">{budget.category?.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    {formatCurrency(budget.spent)} / {formatCurrency(Number(budget.amount))}
                  </span>
                  <span
                    className={cn(
                      'text-xs font-medium px-1.5 py-0.5 rounded',
                      budget.isOver
                        ? 'bg-destructive/10 text-destructive'
                        : budget.isWarning
                        ? 'bg-warning/10 text-warning'
                        : 'bg-muted text-muted-foreground'
                    )}
                  >
                    {budget.percentage.toFixed(0)}%
                  </span>
                </div>
              </div>
              <Progress
                value={Math.min(budget.percentage, 100)}
                className={cn(
                  'h-1.5',
                  budget.isOver && '[&>div]:bg-destructive',
                  budget.isWarning && '[&>div]:bg-warning',
                  !budget.isOver && !budget.isWarning && budget.percentage >= 70 && '[&>div]:bg-yellow-500',
                  !budget.isOver && !budget.isWarning && budget.percentage < 70 && '[&>div]:bg-blue-500'
                )}
              />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
