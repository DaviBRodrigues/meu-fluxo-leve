import { motion } from 'framer-motion';
import { Wallet } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { formatCurrency } from '@/lib/format';
import CountUp from 'react-countup';
import { cn } from '@/lib/utils';

interface BalanceHighlightProps {
  balance: number;
  isLoading?: boolean;
}

export function BalanceHighlight({ balance, isLoading }: BalanceHighlightProps) {
  return (
    <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent overflow-hidden">
      <CardContent className="p-6 sm:p-8">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Saldo Total</p>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {isLoading ? (
                <div className="h-12 w-48 bg-muted animate-pulse rounded-lg" />
              ) : (
                <p className={cn(
                  'text-4xl sm:text-5xl font-bold tracking-tight',
                  balance >= 0 ? 'text-primary' : 'text-expense'
                )}>
                  <CountUp
                    start={0}
                    end={balance}
                    duration={1}
                    decimals={2}
                    decimal=","
                    separator="."
                    prefix="R$ "
                  />
                </p>
              )}
            </motion.div>
            <p className="text-xs text-muted-foreground mt-2">
              {balance >= 0 ? 'Suas finanças estão em dia!' : 'Atenção: saldo negativo'}
            </p>
          </div>
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="hidden sm:flex w-20 h-20 rounded-2xl bg-primary/20 items-center justify-center"
          >
            <Wallet className="w-10 h-10 text-primary" />
          </motion.div>
        </div>
      </CardContent>
    </Card>
  );
}
