import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Transaction } from '@/types/database';
import { formatCurrency, formatShortDate } from '@/lib/format';
import { ArrowUpCircle, ArrowDownCircle, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePrivacy } from '@/contexts/PrivacyContext';
import { Link } from 'react-router-dom';

interface RecentTransactionsProps {
  transactions: Transaction[];
  isLoading?: boolean;
}

export default function RecentTransactions({ transactions, isLoading }: RecentTransactionsProps) {
  const recentTransactions = transactions.slice(0, 5);
  const { isPrivate } = usePrivacy();

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-semibold">Transações Recentes</CardTitle>
        <Link to="/transacoes">
          <Button variant="ghost" size="sm" className="text-muted-foreground">
            Ver todas <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 animate-pulse">
                <div className="w-10 h-10 bg-muted rounded-lg" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
                <div className="h-4 bg-muted rounded w-20" />
              </div>
            ))}
          </div>
        ) : recentTransactions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>Nenhuma transação ainda</p>
            <p className="text-sm mt-1">Adicione sua primeira receita ou despesa</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentTransactions.map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent/50 transition-colors"
              >
                <div
                  className={cn(
                    'w-10 h-10 rounded-lg flex items-center justify-center',
                    transaction.type === 'income' ? 'bg-income/10' : 'bg-expense/10'
                  )}
                >
                  {transaction.type === 'income' ? (
                    <ArrowUpCircle className="w-5 h-5 text-income" />
                  ) : (
                    <ArrowDownCircle className="w-5 h-5 text-expense" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{transaction.description}</p>
                  <p className="text-sm text-muted-foreground">
                    {transaction.category?.name} • {formatShortDate(transaction.date)}
                  </p>
                </div>
                <p
                  className={cn(
                    'font-semibold whitespace-nowrap',
                    transaction.type === 'income' ? 'text-income' : 'text-expense'
                  )}
                >
                  {isPrivate ? 'R$ •••••' : `${transaction.type === 'income' ? '+' : '-'} ${formatCurrency(Number(transaction.amount))}`}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}