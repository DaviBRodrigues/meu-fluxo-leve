import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import AppLayout from '@/components/layout/AppLayout';
import TransactionForm from '@/components/transactions/TransactionForm';
import TransactionList from '@/components/transactions/TransactionList';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { useTransactions } from '@/hooks/useTransactions';
import { useAccounts } from '@/hooks/useAccounts';
import { useCategories } from '@/hooks/useCategories';
import { useBudgets } from '@/hooks/useBudgets';
import { formatCurrency, getMonthName } from '@/lib/format';
import { ArrowDownCircle, Plus, ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Expenses() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedAccountId, setSelectedAccountId] = useState<string | undefined>();
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | undefined>();

  const month = selectedDate.getMonth() + 1;
  const year = selectedDate.getFullYear();

  const { transactions, totalExpenses, isLoading, createTransaction, deleteTransaction } = useTransactions({
    month,
    year,
    type: 'expense',
    accountId: selectedAccountId,
    categoryId: selectedCategoryId,
  });

  const { accounts } = useAccounts();
  const { expenseCategories } = useCategories('expense');
  const { budgets } = useBudgets(month, year);

  if (loading) return null;
  if (!user) {
    navigate('/auth');
    return null;
  }

  const handlePreviousMonth = () => {
    setSelectedDate(new Date(year, month - 2, 1));
  };

  const handleNextMonth = () => {
    setSelectedDate(new Date(year, month, 1));
  };

  // Calculate spending by category with budgets
  const categorySpending = transactions.reduce((acc, t) => {
    const categoryId = t.category_id;
    if (!acc[categoryId]) {
      acc[categoryId] = { spent: 0, category: t.category };
    }
    acc[categoryId].spent += Number(t.amount);
    return acc;
  }, {} as Record<string, { spent: number; category: typeof transactions[0]['category'] }>);

  const budgetAlerts = budgets
    .map((budget) => {
      const spent = categorySpending[budget.category_id]?.spent || 0;
      const percentage = (spent / Number(budget.amount)) * 100;
      return {
        ...budget,
        spent,
        percentage,
        isOverBudget: percentage >= 100,
        isWarning: percentage >= 80 && percentage < 100,
      };
    })
    .filter((b) => b.isWarning || b.isOverBudget);

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <ArrowDownCircle className="w-7 h-7 text-expense" />
              Despesas
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
          <Button onClick={() => setIsFormOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Nova Despesa
          </Button>
        </div>

        {/* Summary */}
        <Card className="bg-expense/5 border-expense/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total de despesas em {getMonthName(month)}</p>
                <p className="text-3xl font-bold text-expense">{formatCurrency(totalExpenses)}</p>
              </div>
              <div className="w-16 h-16 rounded-2xl bg-expense/20 flex items-center justify-center">
                <ArrowDownCircle className="w-8 h-8 text-expense" />
              </div>
            </div>
          </CardContent>
        </Card>

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
                        <span className={cn('text-sm font-medium', alert.isOverBudget ? 'text-expense' : 'text-warning')}>
                          {alert.percentage.toFixed(0)}%
                        </span>
                      </div>
                      <Progress
                        value={Math.min(alert.percentage, 100)}
                        className="h-2"
                      />
                      <p className="text-sm text-muted-foreground mt-1">
                        {formatCurrency(alert.spent)} de {formatCurrency(Number(alert.amount))}
                        {alert.isOverBudget && ` (${formatCurrency(alert.spent - Number(alert.amount))} acima)`}
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
              {expenseCategories.map((category) => (
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
          onDelete={(transaction) => deleteTransaction.mutate(transaction)}
          isDeleting={deleteTransaction.isPending}
        />

        {/* Form */}
        <TransactionForm
          type="expense"
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          onSubmit={(data) => createTransaction.mutate(data)}
          isLoading={createTransaction.isPending}
        />
      </div>
    </AppLayout>
  );
}