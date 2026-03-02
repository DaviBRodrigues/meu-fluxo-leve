import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DeleteConfirmDialog } from '@/components/shared/DeleteConfirmDialog';
import { Transaction } from '@/types/database';
import { formatCurrency, formatDate, formatRelativeDate } from '@/lib/format';
import { ArrowUpCircle, ArrowDownCircle, Trash2, Edit, Receipt, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import TransactionFilters, { FilterPeriod } from './TransactionFilters';
import EmptyState from '@/components/shared/EmptyState';
import { startOfDay, startOfWeek, startOfMonth, isAfter, isEqual, format } from 'date-fns';
import { parseLocalDate } from '@/lib/format';

interface TransactionListProps {
  transactions: Transaction[];
  isLoading?: boolean;
  onDelete?: (transaction: Transaction) => void;
  onEdit?: (transaction: Transaction) => void;
  showFilters?: boolean;
  isDeleting?: boolean;
}

// Group transactions by date
function groupTransactionsByDate(transactions: Transaction[]): Record<string, Transaction[]> {
  return transactions.reduce((acc, transaction) => {
    // Use the date string for grouping (YYYY-MM-DD format from DB)
    const dateKey = format(parseLocalDate(transaction.date), 'yyyy-MM-dd');
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(transaction);
    return acc;
  }, {} as Record<string, Transaction[]>);
}

export default function TransactionList({
  transactions,
  isLoading,
  onDelete,
  onEdit,
  showFilters = true,
  isDeleting = false,
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
        const transactionDate = parseLocalDate(t.date);
        return isAfter(transactionDate, startDate) || isEqual(transactionDate, startDate);
      });
    }

    return filtered;
  }, [transactions, search, period]);

  // Group filtered transactions by date
  const groupedTransactions = useMemo(() => {
    return groupTransactionsByDate(filteredTransactions);
  }, [filteredTransactions]);

  // Sort date keys in descending order
  const sortedDateKeys = useMemo(() => {
    return Object.keys(groupedTransactions).sort((a, b) => b.localeCompare(a));
  }, [groupedTransactions]);

  const handleConfirmDelete = () => {
    if (transactionToDelete && onDelete) {
      onDelete(transactionToDelete);
      setTransactionToDelete(null);
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, x: -100 },
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
            <div className="space-y-6">
              {sortedDateKeys.map((dateKey) => (
                <div key={dateKey}>
                  {/* Date Group Header */}
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-1">
                    {formatRelativeDate(dateKey)}
                  </h3>
                  
                  {/* Transactions for this date */}
                  <div className="space-y-2">
                    <AnimatePresence mode="popLayout">
                      {groupedTransactions[dateKey].map((transaction, index) => (
                        <motion.div
                          key={transaction.id}
                          variants={itemVariants}
                          initial="hidden"
                          animate="visible"
                          exit="exit"
                          transition={{ delay: index * 0.03, duration: 0.2 }}
                          layout
                          className="flex items-center gap-3 p-3 rounded-xl bg-card shadow-sm hover:shadow-md transition-all group"
                        >
                          <div
                            className={cn(
                              'w-12 h-12 rounded-xl flex items-center justify-center shrink-0',
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
                            <div className="flex items-center gap-2">
                              <p className="font-medium truncate">{transaction.description}</p>
                              {transaction.recurrence === 'fixed' && (
                                <RefreshCw className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <span
                                className="inline-block w-2 h-2 rounded-full shrink-0"
                                style={{ backgroundColor: transaction.category?.color }}
                              />
                              <span className="truncate">{transaction.category?.name}</span>
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
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <DeleteConfirmDialog
        isOpen={!!transactionToDelete}
        onClose={() => setTransactionToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Confirmar exclusão"
        description="Tem certeza que deseja remover esta transação?"
        itemName={transactionToDelete?.description}
        affectsBalance={true}
        isLoading={isDeleting}
      />
    </>
  );
}
