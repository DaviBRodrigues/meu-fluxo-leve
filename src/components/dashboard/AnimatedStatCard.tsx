import { useEffect, useState } from 'react';
import CountUp from 'react-countup';
import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePrivacy } from '@/contexts/PrivacyContext';

interface AnimatedStatCardProps {
  title: string;
  value: number;
  prefix?: string;
  suffix?: string;
  icon: LucideIcon;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  variant?: 'default' | 'income' | 'expense' | 'balance';
  decimals?: number;
}

export default function AnimatedStatCard({
  title,
  value,
  prefix = 'R$ ',
  suffix = '',
  icon: Icon,
  trend,
  variant = 'default',
  decimals = 2,
}: AnimatedStatCardProps) {
  const [prevValue, setPrevValue] = useState(0);
  const [currentValue, setCurrentValue] = useState(value);
  const { isPrivate } = usePrivacy();

  useEffect(() => {
    setPrevValue(currentValue);
    setCurrentValue(value);
  }, [value]);

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
    <Card className={cn('border transition-all', variantStyles[variant])}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold tracking-tight">
              {isPrivate ? (
                <span className="text-muted-foreground">R$ •••••</span>
              ) : (
                <CountUp
                  start={prevValue}
                  end={currentValue}
                  duration={1}
                  decimals={decimals}
                  decimal=","
                  separator="."
                  prefix={prefix}
                  suffix={suffix}
                />
              )}
            </p>
            {trend && !isPrivate && (
              <p
                className={cn(
                  'text-sm font-medium',
                  trend.isPositive ? 'text-income' : 'text-expense'
                )}
              >
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
