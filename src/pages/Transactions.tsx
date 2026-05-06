import { useEffect, useState } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import AppLayout from '@/components/layout/AppLayout';
import TransactionForm from '@/components/transactions/TransactionForm';
import TransactionList from '@/components/transactions/TransactionList';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Progress } from '@/components/ui/progress';
import { useTransactions } from '@/hooks/useTransactions';
import { useAccounts } from '@/hooks/useAccounts';
import { useCategories } from '@/hooks/useCategories';
import { useBudgets } from '@/hooks/useBudgets';
import { useShortcuts } from '@/contexts/ShortcutsContext';
import { formatCurrency, getMonthName } from '@/lib/format';
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Plus,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Receipt,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { TransactionType } from '@/types/database';

type TypeFilter = 'all' | TransactionType;

export default function Transactions() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { setNewTransactionHandler } = useShortcuts();

  const initialType = (searchParams.get('type') as TypeFilter) || 'all';
  const [typeFilter, setTypeFilter] = useState<TypeFilter>(initialType);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formType, setFormType] = useState<TransactionType>('expense');
  const [initialFormData, setInitialFormData] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedAccountId, setSelectedAccountId] = useState<string | undefined>();
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | undefined>();

  const month = selectedDate.getMonth() + 1;
  const year = selectedDate.getFullYear();

  const {
    transactions,
    totalIncome,
    totalExpenses,
    isLoading,
    createTransaction,
    deleteTransaction,
    deleteInstallmentGroup,
  } = useTransactions({
    month,
    year,
    type: typeFilter === 'all' ? undefined : typeFilter,
    accountId: selectedAccountId,
    categoryId: selectedCategoryId,
  });

  const { accounts } = useAccounts();
  const { categories } = useCategories();
  const filterCategories = categories.filter((c) => !c.parent_id);
  const { budgets } = useBudgets(month, year);

  const openForm = (type: TransactionType, prefill?: any) => {
    setFormType(type);
    setInitialFormData(prefill || null);
    setIsFormOpen(true);
  };

  // Register hotkey handler
  useEffect(() => {
    setNewTransactionHandler((type) => openForm(type));
    return () => setNewTransactionHandler(null);
  }, [setNewTransactionHandler]);

  // Open form from navigation state (e.g., redirect)
  useEffect(() => {
    const state = location.state as any;
    if (state?.newType) {
      openForm(state.newType);
      navigate(location.pathname + location.search, { replace: true, state: {} });
    }
  }, [location]);

  // Sync URL with filter
  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    if (typeFilter === 'all') params.delete('type');
    else params.set('type', typeFilter);
    setSearchParams(params, { replace: true });
  }, [typeFilter]);

  if (loading) return null;
  if (!user) {
    navigate('/auth');
    return null;
  }

  const handlePreviousMonth = () => setSelectedDate(new Date(year, month - 2, 1));
  const handleNextMonth = () => setSelectedDate(new Date(year, month, 1));

  // Budget alerts (only when viewing expenses or all)
  const showBudgets = typeFilter !== 'income';
  const expenseTransactions = transactions.filter((t) => t.type === 'expense');
  const categorySpending = expenseTransactions.reduce((acc, t) => {
    if (!acc[t.category_id]) acc[t.category_id] = { spent: 0, category: t.category };
    acc[t.category_id].spent += Number(t.amount);
    return acc;
  }, {} as Record<string, { spent: number; category: any }>);
  const budgetAlerts = showBudgets
    ? budgets
        .map((b) => {
          const spent = categorySpending[b.category_id]?.spent || 0;
          const percentage = (spent / Number(b.amount)) * 100;
          return {
            ...b,
            spent,
            percentage,
            isOverBudget: percentage >= 100,
            isWarning: percentage >= 80 && percentage < 100,
          };
        })
        .filter((b) => b.isWarning || b.isOverBudget)
    : [];

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Receipt className="w-7 h-7 text-primary" />
              Transações
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handlePreviousMonth}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-muted-foreground capitalize">
                {getMonthName(month)} {year}
              </span>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleNextMonth}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => openForm('income')}>
              <ArrowUpCircle className="w-4 h-4 mr-2 text-income" />
              Nova Receita
            </Button>
            <Button variant="outline" onClick={() => openForm('expense')}>
              <ArrowDownCircle className="w-4 h-4 mr-2 text-expense" />
              Nova Despesa
            </Button>
          </div>
        </div>

        {/* Type filter + Summary */}
        <div className="flex flex-col gap-4">
          <ToggleGroup
            type="single"
            value={typeFilter}
            onValueChange={(v) => v && setTypeFilter(v as TypeFilter)}
            className="justify-start"
          >
            <ToggleGroupItem value="all">Todas</ToggleGroupItem>
            <ToggleGroupItem value="income">Receitas</ToggleGroupItem>
            <ToggleGroupItem value="expense">Despesas</ToggleGroupItem>
          </ToggleGroup>

          <div className="grid gap-4 sm:grid-cols-2">
            <Card className="bg-income/5 border-income/20">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Receitas</p>
                  <p className="text-2xl font-bold text-income">{formatCurrency(totalIncome)}</p>
                </div>
                <ArrowUpCircle className="w-8 h-8 text-income" />
              </CardContent>
            </Card>
            <Card className="bg-expense/5 border-expense/20">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Despesas</p>
                  <p className="text-2xl font-bold text-expense">{formatCurrency(totalExpenses)}</p>
                </div>
                <ArrowDownCircle className="w-8 h-8 text-expense" />
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Budget Alerts */}
        {budgetAlerts.length > 0 && (
          <div className="space-y-2">
            {budgetAlerts.map((alert) => (
              <Card
                key={alert.id}
                className={cn(
                  'border',
                  alert.isOverBudget ? 'border-expense/50 bg-expense/5' : 'border-warning/50 bg-warning/5'
                )}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        'w-10 h-10 rounded-full flex items-center justify-center',
                        alert.isOverBudget ? 'bg-expense/20' : 'bg-warning/20'
                      )}
                    >
                      <AlertTriangle
                        className={cn('w-5 h-5', alert.isOverBudget ? 'text-expense' : 'text-warning')}
                      />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium">{alert.category?.name}</span>
                        <span
                          className={cn(
                            'text-sm font-medium',
                            alert.isOverBudget ? 'text-expense' : 'text-warning'
                          )}
                        >
                          {alert.percentage.toFixed(0)}%
                        </span>
                      </div>
                      <Progress value={Math.min(alert.percentage, 100)} className="h-2" />
                      <p className="text-sm text-muted-foreground mt-1">
                        {formatCurrency(alert.spent)} de {formatCurrency(Number(alert.amount))}
                        {alert.isOverBudget &&
                          ` (${formatCurrency(alert.spent - Number(alert.amount))} acima)`}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap gap-4">
          <Select
            value={selectedAccountId || 'all'}
            onValueChange={(v) => setSelectedAccountId(v === 'all' ? undefined : v)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Todas as contas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as contas</SelectItem>
              {accounts.map((account) => (
                <SelectItem key={account.id} value={account.id}>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: account.color }} />
                    {account.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={selectedCategoryId || 'all'}
            onValueChange={(v) => setSelectedCategoryId(v === 'all' ? undefined : v)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Todas as categorias" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as categorias</SelectItem>
              {filterCategories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: category.color }} />
                    {category.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Transaction List */}
        <TransactionList
          transactions={transactions}
          isLoading={isLoading}
          onDelete={(t) => deleteTransaction.mutate(t)}
          onDeleteGroup={(groupId) => deleteInstallmentGroup.mutate(groupId)}
          onDuplicate={(t) =>
            openForm(t.type as TransactionType, {
              description: t.description.replace(/\s*\(\d+\/\d+\)$/, ''),
              amount: Number(t.amount),
              category_id: t.category_id,
              account_id: t.account_id,
              notes: t.notes || '',
            })
          }
          isDeleting={deleteTransaction.isPending || deleteInstallmentGroup.isPending}
          enableBulkActions
        />

        {/* Form */}
        <TransactionForm
          type={formType}
          isOpen={isFormOpen}
          onClose={() => {
            setIsFormOpen(false);
            setInitialFormData(null);
          }}
          onSubmit={(data) => createTransaction.mutate(data)}
          isLoading={createTransaction.isPending}
          initialData={initialFormData}
        />
      </div>
    </AppLayout>
  );
}
