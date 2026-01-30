import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTransactions } from '@/hooks/useTransactions';
import { useRecurringReminders } from '@/hooks/useRecurringReminders';
import { useAccounts } from '@/hooks/useAccounts';
import { formatCurrency } from '@/lib/format';
import { TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MonthProjectionProps {
  month: number;
  year: number;
}

export default function MonthProjection({ month, year }: MonthProjectionProps) {
  const { transactions, totalIncome, totalExpenses } = useTransactions({ month, year });
  const { dueReminders } = useRecurringReminders();
  const { totalBalance } = useAccounts();

  // Calculate days elapsed and remaining in month
  const today = new Date();
  const daysInMonth = new Date(year, month, 0).getDate();
  const currentDay = today.getMonth() + 1 === month && today.getFullYear() === year
    ? today.getDate()
    : daysInMonth;
  const daysRemaining = daysInMonth - currentDay;

  // Calculate average daily spending (only variable expenses)
  const variableExpenses = transactions
    .filter(t => t.type === 'expense' && t.recurrence === 'variable')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const dailyAverage = currentDay > 0 ? variableExpenses / currentDay : 0;

  // Project remaining variable expenses
  const projectedVariableExpenses = dailyAverage * daysRemaining;

  // Sum pending fixed expenses from reminders
  const pendingFixedExpenses = dueReminders.reduce((sum, r) => sum + Number(r.amount), 0);

  // Total projected expenses
  const totalProjectedExpenses = totalExpenses + projectedVariableExpenses + pendingFixedExpenses;

  // Projected end-of-month balance
  const projectedBalance = totalBalance - projectedVariableExpenses - pendingFixedExpenses;
  const projectedSavings = totalIncome - totalProjectedExpenses;

  const isPositive = projectedSavings >= 0;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          Projeção de Final de Mês
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Main Projection */}
          <div className={cn(
            'p-4 rounded-lg',
            isPositive ? 'bg-income/10' : 'bg-destructive/10'
          )}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Saldo projetado</p>
                <p className={cn(
                  'text-2xl font-bold',
                  isPositive ? 'text-income' : 'text-destructive'
                )}>
                  {formatCurrency(projectedBalance)}
                </p>
              </div>
              {isPositive ? (
                <TrendingUp className="w-8 h-8 text-income" />
              ) : (
                <TrendingDown className="w-8 h-8 text-destructive" />
              )}
            </div>
          </div>

          {/* Breakdown */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Gastos variáveis restantes</p>
              <p className="font-semibold">{formatCurrency(projectedVariableExpenses)}</p>
              <p className="text-xs text-muted-foreground">
                ~{formatCurrency(dailyAverage)}/dia × {daysRemaining} dias
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Despesas fixas pendentes</p>
              <p className="font-semibold">{formatCurrency(pendingFixedExpenses)}</p>
              <p className="text-xs text-muted-foreground">
                {dueReminders.length} lembrete(s)
              </p>
            </div>
          </div>

          {/* Savings Projection */}
          <div className="pt-3 border-t border-border">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Economia projetada</span>
              <span className={cn(
                'font-semibold',
                isPositive ? 'text-income' : 'text-destructive'
              )}>
                {isPositive ? '+' : ''}{formatCurrency(projectedSavings)}
              </span>
            </div>
          </div>

          {/* Warning */}
          {!isPositive && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>Atenção: você pode terminar o mês no vermelho.</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
