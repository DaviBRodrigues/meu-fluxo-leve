import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Transaction } from '@/types/database';
import { formatCurrency, formatDate } from '@/lib/format';
import { ArrowUpCircle, ArrowDownCircle, Trash2, Edit, Receipt } from 'lucide-react';
import { cn } from '@/lib/utils';
import TransactionFilters, { FilterPeriod } from './TransactionFilters';
import EmptyState from '@/components/shared/EmptyState';
import { startOfDay, startOfWeek, startOfMonth, isAfter, isEqual } from 'date-fns';

interface TransactionListProps {
  transactions: Transaction[];
  isLoading?: boolean;
  onDelete?: (transaction: Transaction) => void;
  onEdit?: (transaction: Transaction) => void;
  showFilters?: boolean;
}

export default function TransactionList({
  transactions,
  isLoading,
  onDelete,
  onEdit,
  showFilters = true,
}: TransactionListProps) {
  const [search, setSearch] = useState('');
  const [period, setPeriod] = useState<FilterPeriod>('all');
  const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null);

  const filteredTransactions = useMemo(() => {
    let filtered = transactions;

    // Filter by search
    if (search) {
      filtered = filtered.filter(
        (t) =>
          t.description.toLowerCase().includes(search.toLowerCase()) ||
          t.category?.name.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Filter by period
    if (period !== 'all') {
      const today = new Date();
      let startDate: Date;

      switch (period) {
        case 'today':
          startDate = startOfDay(today);
          break;
        case 'week':
          startDate = startOfWeek(today, { weekStartsOn: 0 });
          break;
        case 'month':
          startDate = startOfMonth(today);
          break;
        default:
          startDate = new Date(0);
      }

      filtered = filtered.filter((t) => {
        const transactionDate = new Date(t.date);
        return isAfter(transactionDate, startDate) || isEqual(transactionDate, startDate);
      });
    }

    return filtered;
  }, [transactions, search, period]);

  const handleConfirmDelete = () => {
    if (transactionToDelete && onDelete) {
      onDelete(transactionToDelete);
      setTransactionToDelete(null);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 animate-pulse">
                <div className="w-12 h-12 bg-muted rounded-lg" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
                <div className="h-4 bg-muted rounded w-24" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardContent className="p-4">
          {/* Filters */}
          {showFilters && (
            <div className="mb-4">
              <TransactionFilters
                search={search}
                onSearchChange={setSearch}
                period={period}
                onPeriodChange={setPeriod}
              />
            </div>
          )}

          {filteredTransactions.length === 0 ? (
            transactions.length === 0 ? (
              <EmptyState
                icon={Receipt}
                title="Nenhuma transação ainda"
                description="Comece registrando sua primeira receita ou despesa para acompanhar suas finanças."
              />
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <p>Nenhuma transação encontrada para os filtros selecionados</p>
              </div>
            )
          ) : (
            <div className="space-y-2">
              {filteredTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors group"
                >
                  <div
                    className={cn(
                      'w-12 h-12 rounded-lg flex items-center justify-center shrink-0',
                      transaction.type === 'income' ? 'bg-income/10' : 'bg-expense/10'
                    )}
                  >
                    {transaction.type === 'income' ? (
                      <ArrowUpCircle className="w-6 h-6 text-income" />
                    ) : (
                      <ArrowDownCircle className="w-6 h-6 text-expense" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{transaction.description}</p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span
                        className="inline-block w-2 h-2 rounded-full"
                        style={{ backgroundColor: transaction.category?.color }}
                      />
                      <span>{transaction.category?.name}</span>
                      <span>•</span>
                      <span>{formatDate(transaction.date)}</span>
                      {transaction.recurrence === 'fixed' && (
                        <>
                          <span>•</span>
                          <span className="text-xs bg-muted px-1.5 py-0.5 rounded">Fixa</span>
                        </>
                      )}
                    </div>
                  </div>

                  <p
                    className={cn(
                      'font-bold text-lg whitespace-nowrap',
                      transaction.type === 'income' ? 'text-income' : 'text-expense'
                    )}
                  >
                    {transaction.type === 'income' ? '+' : '-'} {formatCurrency(Number(transaction.amount))}
                  </p>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {onEdit && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => onEdit(transaction)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    )}
                    {onDelete && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => setTransactionToDelete(transaction)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!transactionToDelete} onOpenChange={() => setTransactionToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a transação "{transactionToDelete?.description}"?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive text-destructive-foreground">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
