import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select as USelect,
  SelectContent as USelectContent,
  SelectItem as USelectItem,
  SelectTrigger as USelectTrigger,
  SelectValue as USelectValue,
} from '@/components/ui/select';
import { DeleteConfirmDialog } from '@/components/shared/DeleteConfirmDialog';
import { Transaction } from '@/types/database';
import { formatCurrency, formatRelativeDate } from '@/lib/format';
import {
  ArrowUpCircle,
  ArrowDownCircle,
  Trash2,
  Edit,
  Copy,
  Receipt,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import TransactionFilters, { FilterPeriod } from './TransactionFilters';
import EmptyState from '@/components/shared/EmptyState';
import { startOfDay, startOfWeek, startOfMonth, isAfter, isEqual, format } from 'date-fns';
import { parseLocalDate } from '@/lib/format';
import { useCategories } from '@/hooks/useCategories';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

interface TransactionListProps {
  transactions: Transaction[];
  isLoading?: boolean;
  onDelete?: (transaction: Transaction) => void;
  onDeleteGroup?: (groupId: string) => void;
  onEdit?: (transaction: Transaction) => void;
  onDuplicate?: (transaction: Transaction) => void;
  showFilters?: boolean;
  isDeleting?: boolean;
  enableBulkActions?: boolean;
}

function groupTransactionsByDate(transactions: Transaction[]): Record<string, Transaction[]> {
  return transactions.reduce((acc, transaction) => {
    const dateKey = format(parseLocalDate(transaction.date), 'yyyy-MM-dd');
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(transaction);
    return acc;
  }, {} as Record<string, Transaction[]>);
}

export default function TransactionList({
  transactions,
  isLoading,
  onDelete,
  onDeleteGroup,
  onEdit,
  onDuplicate,
  showFilters = true,
  isDeleting = false,
  enableBulkActions = false,
}: TransactionListProps) {
  const [search, setSearch] = useState('');
  const [period, setPeriod] = useState<FilterPeriod>('all');
  const [compact, setCompact] = useState(() => {
    try {
      return localStorage.getItem('transaction-compact-view') === 'true';
    } catch {
      return false;
    }
  });
  const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null);
  const [showGroupDeleteOption, setShowGroupDeleteOption] = useState(false);

  // Bulk selection
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [bulkCategoryOpen, setBulkCategoryOpen] = useState(false);
  const [bulkCategoryId, setBulkCategoryId] = useState('');
  const [bulkLoading, setBulkLoading] = useState(false);

  const { user } = useAuth();
  const { categories } = useCategories();
  const queryClient = useQueryClient();

  // Listen for compact toggle from elsewhere (hotkeys)
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'transaction-compact-view') {
        try {
          setCompact(localStorage.getItem('transaction-compact-view') === 'true');
        } catch {}
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const handleCompactChange = (value: boolean) => {
    setCompact(value);
    try {
      localStorage.setItem('transaction-compact-view', String(value));
    } catch {}
    if (!value) setSelected(new Set());
  };

  const filteredTransactions = useMemo(() => {
    let filtered = transactions;
    if (search) {
      filtered = filtered.filter(
        (t) =>
          t.description.toLowerCase().includes(search.toLowerCase()) ||
          t.category?.name.toLowerCase().includes(search.toLowerCase())
      );
    }
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
        const d = parseLocalDate(t.date);
        return isAfter(d, startDate) || isEqual(d, startDate);
      });
    }
    return filtered;
  }, [transactions, search, period]);

  const groupedTransactions = useMemo(
    () => groupTransactionsByDate(filteredTransactions),
    [filteredTransactions]
  );
  const sortedDateKeys = useMemo(
    () => Object.keys(groupedTransactions).sort((a, b) => b.localeCompare(a)),
    [groupedTransactions]
  );

  const handleConfirmDelete = () => {
    if (transactionToDelete && onDelete) {
      onDelete(transactionToDelete);
      setTransactionToDelete(null);
      setShowGroupDeleteOption(false);
    }
  };

  const handleConfirmDeleteGroup = () => {
    if (transactionToDelete && onDeleteGroup && (transactionToDelete as any).installment_group_id) {
      onDeleteGroup((transactionToDelete as any).installment_group_id);
      setTransactionToDelete(null);
      setShowGroupDeleteOption(false);
    }
  };

  const handleDeleteClick = (transaction: Transaction) => {
    setTransactionToDelete(transaction);
    setShowGroupDeleteOption(
      !!(transaction as any).is_installment && !!(transaction as any).installment_group_id
    );
  };

  const showBulk = enableBulkActions && compact;

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const clearSelection = () => setSelected(new Set());

  const selectedTransactions = useMemo(
    () => filteredTransactions.filter((t) => selected.has(t.id)),
    [filteredTransactions, selected]
  );

  const performBulkDelete = async () => {
    if (selected.size === 0 || !user) return;
    setBulkLoading(true);
    try {
      // Apply balance reverts grouped by account
      const balanceMap = new Map<string, number>();
      for (const t of selectedTransactions) {
        const adj = t.type === 'income' ? -Number(t.amount) : Number(t.amount);
        balanceMap.set(t.account_id, (balanceMap.get(t.account_id) || 0) + adj);
      }
      const ids = Array.from(selected);
      const { error } = await supabase
        .from('transactions')
        .delete()
        .in('id', ids)
        .eq('user_id', user.id);
      if (error) throw error;

      for (const [accountId, change] of balanceMap) {
        await supabase.rpc('update_account_balance', {
          p_account_id: accountId,
          p_amount_change: change,
        });
      }
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      toast.success(`${ids.length} transações removidas`);
      clearSelection();
      setBulkDeleteOpen(false);
    } catch (e) {
      toast.error('Erro ao excluir em lote');
    } finally {
      setBulkLoading(false);
    }
  };

  const performBulkCategoryChange = async () => {
    if (selected.size === 0 || !bulkCategoryId || !user) return;
    setBulkLoading(true);
    try {
      const { error } = await supabase
        .from('transactions')
        .update({ category_id: bulkCategoryId })
        .in('id', Array.from(selected))
        .eq('user_id', user.id);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      toast.success(`Categoria atualizada em ${selected.size} transações`);
      clearSelection();
      setBulkCategoryOpen(false);
      setBulkCategoryId('');
    } catch (e) {
      toast.error('Erro ao mudar categoria em lote');
    } finally {
      setBulkLoading(false);
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
          {showFilters && (
            <div className="mb-4">
              <TransactionFilters
                search={search}
                onSearchChange={setSearch}
                period={period}
                onPeriodChange={setPeriod}
                compact={compact}
                onCompactChange={handleCompactChange}
              />
            </div>
          )}

          {/* Bulk action bar */}
          {showBulk && selected.size > 0 && (
            <div className="mb-3 flex items-center justify-between gap-3 rounded-lg border bg-accent/40 px-3 py-2">
              <span className="text-sm font-medium">
                {selected.size} selecionada(s)
              </span>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => setBulkCategoryOpen(true)}>
                  Mudar categoria
                </Button>
                <Button size="sm" variant="destructive" onClick={() => setBulkDeleteOpen(true)}>
                  <Trash2 className="w-3.5 h-3.5 mr-1" /> Excluir
                </Button>
                <Button size="sm" variant="ghost" onClick={clearSelection}>
                  Cancelar
                </Button>
              </div>
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
            <div className={compact ? 'space-y-3' : 'space-y-6'}>
              {sortedDateKeys.map((dateKey) => (
                <div key={dateKey}>
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-1">
                    {formatRelativeDate(dateKey)}
                  </h3>

                  <div className={compact ? 'space-y-1' : 'space-y-2'}>
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
                          className={cn(
                            'flex items-center bg-card transition-all group',
                            compact
                              ? 'gap-2 p-2 rounded-lg'
                              : 'gap-3 p-3 rounded-xl shadow-sm hover:shadow-md',
                            selected.has(transaction.id) && 'ring-2 ring-primary'
                          )}
                        >
                          {showBulk && (
                            <Checkbox
                              checked={selected.has(transaction.id)}
                              onCheckedChange={() => toggleSelect(transaction.id)}
                            />
                          )}

                          <div
                            className={cn(
                              'rounded-xl flex items-center justify-center shrink-0',
                              compact ? 'w-8 h-8' : 'w-12 h-12',
                              transaction.type === 'income' ? 'bg-income/10' : 'bg-expense/10'
                            )}
                          >
                            {transaction.type === 'income' ? (
                              <ArrowUpCircle
                                className={compact ? 'w-4 h-4 text-income' : 'w-6 h-6 text-income'}
                              />
                            ) : (
                              <ArrowDownCircle
                                className={compact ? 'w-4 h-4 text-expense' : 'w-6 h-6 text-expense'}
                              />
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
                              'whitespace-nowrap',
                              compact ? 'text-sm font-semibold' : 'text-lg font-bold',
                              transaction.type === 'income' ? 'text-income' : 'text-expense'
                            )}
                          >
                            {transaction.type === 'income' ? '+' : '-'}{' '}
                            {formatCurrency(Number(transaction.amount))}
                          </p>

                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {onDuplicate && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => onDuplicate(transaction)}
                                title="Duplicar"
                              >
                                <Copy className="w-4 h-4" />
                              </Button>
                            )}
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
                                onClick={() => handleDeleteClick(transaction)}
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

      {showGroupDeleteOption && transactionToDelete ? (
        <AlertDialog
          open={!!transactionToDelete}
          onOpenChange={() => {
            setTransactionToDelete(null);
            setShowGroupDeleteOption(false);
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                Excluir parcela ou parcelamento?
              </AlertDialogTitle>
              <AlertDialogDescription>
                Esta transação faz parte de um parcelamento. O que deseja fazer?
                <span className="block mt-2 font-medium text-foreground">
                  "{transactionToDelete.description}"
                </span>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="flex flex-col gap-2 pt-2">
              <Button variant="outline" onClick={handleConfirmDelete} disabled={isDeleting}>
                Excluir apenas esta parcela
              </Button>
              <Button variant="destructive" onClick={handleConfirmDeleteGroup} disabled={isDeleting}>
                Excluir todas as parcelas
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setTransactionToDelete(null);
                  setShowGroupDeleteOption(false);
                }}
              >
                Cancelar
              </Button>
            </div>
          </AlertDialogContent>
        </AlertDialog>
      ) : (
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
      )}

      {/* Bulk delete confirm */}
      <AlertDialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir {selected.size} transações?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Os saldos das contas serão ajustados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={bulkLoading}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                performBulkDelete();
              }}
              disabled={bulkLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk category change */}
      <AlertDialog open={bulkCategoryOpen} onOpenChange={setBulkCategoryOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Mudar categoria de {selected.size} transações</AlertDialogTitle>
            <AlertDialogDescription>
              Selecione a nova categoria que será aplicada.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <USelect value={bulkCategoryId} onValueChange={setBulkCategoryId}>
            <USelectTrigger>
              <USelectValue placeholder="Selecione a categoria" />
            </USelectTrigger>
            <USelectContent>
              {categories
                .filter((c) => !c.parent_id)
                .map((c) => (
                  <USelectItem key={c.id} value={c.id}>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: c.color }}
                      />
                      {c.name}
                    </div>
                  </USelectItem>
                ))}
            </USelectContent>
          </USelect>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={bulkLoading}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                performBulkCategoryChange();
              }}
              disabled={bulkLoading || !bulkCategoryId}
            >
              Aplicar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
