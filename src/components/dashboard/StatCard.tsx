import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  variant?: 'default' | 'income' | 'expense' | 'balance';
}

export default function StatCard({ title, value, icon: Icon, trend, variant = 'default' }: StatCardProps) {
  const variantStyles = {
    default: 'bg-card',
    income: 'bg-income/10 border-income/20',
    expense: 'bg-expense/10 border-expense/20',
    balance: 'bg-primary/10 border-primary/20',
  };

  const iconStyles = {
    default: 'bg-muted text-muted-foreground',
    income: 'bg-income/20 text-income',
    expense: 'bg-expense/20 text-expense',
    balance: 'bg-primary/20 text-primary',
  };

  return (
    <Card className={cn('border', variantStyles[variant])}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold tracking-tight">{value}</p>
            {trend && (
              <p className={cn(
                'text-sm font-medium',
                trend.isPositive ? 'text-income' : 'text-expense'
              )}>
                {trend.isPositive ? '↑' : '↓'} {trend.value}
              </p>
            )}
          </div>
          <div className={cn('p-3 rounded-xl', iconStyles[variant])}>
            <Icon className="w-5 h-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}