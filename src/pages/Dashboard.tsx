import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import AppLayout from '@/components/layout/AppLayout';
import StatCard from '@/components/dashboard/StatCard';
import RecentTransactions from '@/components/dashboard/RecentTransactions';
import ExpensesByCategory from '@/components/dashboard/ExpensesByCategory';
import MonthlyChart from '@/components/dashboard/MonthlyChart';
import TransactionForm from '@/components/transactions/TransactionForm';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useTransactions } from '@/hooks/useTransactions';
import { useAccounts } from '@/hooks/useAccounts';
import { useSavingsGoals } from '@/hooks/useSavingsGoals';
import { useRecurringReminders } from '@/hooks/useRecurringReminders';
import { formatCurrency, formatMonthYear } from '@/lib/format';
import {
  Wallet,
  ArrowUpCircle,
  ArrowDownCircle,
  TrendingUp,
  Plus,
  Bell,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { TransactionType } from '@/types/database';

export default function Dashboard() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formType, setFormType] = useState<TransactionType>('expense');

  const month = selectedDate.getMonth() + 1;
  const year = selectedDate.getFullYear();

  const { transactions, totalIncome, totalExpenses, isLoading: isLoadingTransactions, createTransaction } = useTransactions({ month, year });
  const { totalBalance, isLoading: isLoadingAccounts } = useAccounts();
  const { activeGoals } = useSavingsGoals();
  const { dueReminders } = useRecurringReminders();

  // All transactions for charts
  const { transactions: allTransactions } = useTransactions();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Skeleton className="w-32 h-32 rounded-full" />
      </div>
    );
  }

  if (!user) {
    navigate('/auth');
    return null;
  }

  const economy = totalIncome - totalExpenses;

  const handlePreviousMonth = () => {
    setSelectedDate(new Date(year, month - 2, 1));
  };

  const handleNextMonth = () => {
    setSelectedDate(new Date(year, month, 1));
  };

  const handleOpenForm = (type: TransactionType) => {
    setFormType(type);
    setIsFormOpen(true);
  };

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <div className="flex items-center gap-2 mt-1">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handlePreviousMonth}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-muted-foreground capitalize">
                {formatMonthYear(selectedDate)}
              </span>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleNextMonth}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => handleOpenForm('income')}>
              <ArrowUpCircle className="w-4 h-4 mr-2" />
              Receita
            </Button>
            <Button onClick={() => handleOpenForm('expense')}>
              <ArrowDownCircle className="w-4 h-4 mr-2" />
              Despesa
            </Button>
          </div>
        </div>

        {/* Reminders Alert */}
        {dueReminders.length > 0 && (
          <Card className="border-warning/50 bg-warning/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-warning/20 flex items-center justify-center">
                  <Bell className="w-5 h-5 text-warning" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">Lembretes pendentes</p>
                  <p className="text-sm text-muted-foreground">
                    Você tem {dueReminders.length} despesa(s) fixa(s) para registrar este mês
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={() => navigate('/configuracoes')}>
                  Ver lembretes
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Saldo Total"
            value={formatCurrency(totalBalance)}
            icon={Wallet}
            variant="balance"
          />
          <StatCard
            title="Receitas do mês"
            value={formatCurrency(totalIncome)}
            icon={ArrowUpCircle}
            variant="income"
          />
          <StatCard
            title="Despesas do mês"
            value={formatCurrency(totalExpenses)}
            icon={ArrowDownCircle}
            variant="expense"
          />
          <StatCard
            title="Economia do mês"
            value={formatCurrency(economy)}
            icon={TrendingUp}
            trend={
              economy !== 0
                ? { value: `${((economy / (totalIncome || 1)) * 100).toFixed(0)}% das receitas`, isPositive: economy > 0 }
                : undefined
            }
          />
        </div>

        {/* Goals Summary */}
        {activeGoals.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-semibold flex items-center justify-between">
                <span>Metas Ativas</span>
                <Button variant="ghost" size="sm" onClick={() => navigate('/metas')}>
                  Ver todas
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 overflow-x-auto pb-2">
                {activeGoals.slice(0, 3).map((goal) => {
                  const progress = (Number(goal.current_amount) / Number(goal.target_amount)) * 100;
                  return (
                    <div
                      key={goal.id}
                      className="min-w-[200px] p-3 rounded-lg border bg-card"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: goal.color }}
                        />
                        <span className="font-medium text-sm truncate">{goal.name}</span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${progress}%`, backgroundColor: goal.color }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatCurrency(Number(goal.current_amount))} / {formatCurrency(Number(goal.target_amount))}
                      </p>
                    </div>
                  );
                })}
                <button
                  onClick={() => navigate('/metas')}
                  className="min-w-[200px] p-3 rounded-lg border border-dashed flex items-center justify-center gap-2 text-muted-foreground hover:bg-accent transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span className="text-sm">Nova meta</span>
                </button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Charts */}
        <div className="grid gap-6 lg:grid-cols-2">
          <MonthlyChart transactions={allTransactions} isLoading={isLoadingTransactions} />
          <ExpensesByCategory transactions={transactions} isLoading={isLoadingTransactions} />
        </div>

        {/* Recent Transactions */}
        <RecentTransactions transactions={transactions} isLoading={isLoadingTransactions} />

        {/* Transaction Form */}
        <TransactionForm
          type={formType}
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          onSubmit={(data) => createTransaction.mutate(data)}
          isLoading={createTransaction.isPending}
        />
      </div>
    </AppLayout>
  );
}