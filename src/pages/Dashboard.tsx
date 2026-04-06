import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import AppLayout from '@/components/layout/AppLayout';
import AnimatedStatCard from '@/components/dashboard/AnimatedStatCard';
import { BalanceHighlight } from '@/components/dashboard/BalanceHighlight';
import { FloatingActionButton } from '@/components/dashboard/FloatingActionButton';
import RecentTransactions from '@/components/dashboard/RecentTransactions';
import ExpensesByCategory from '@/components/dashboard/ExpensesByCategory';
import MonthlyChart from '@/components/dashboard/MonthlyChart';
import BudgetProgress from '@/components/dashboard/BudgetProgress';
import MonthProjection from '@/components/dashboard/MonthProjection';
import InstallmentsTracker from '@/components/dashboard/InstallmentsTracker';
import TutorialDialog from '@/components/tutorial/TutorialDialog';
import { QuickActions } from '@/components/dashboard/QuickActions';
import TransactionForm from '@/components/transactions/TransactionForm';
import TransferForm from '@/components/transactions/TransferForm';
import { SkeletonCard } from '@/components/shared/SkeletonCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTransactions } from '@/hooks/useTransactions';
import { useAccounts } from '@/hooks/useAccounts';
import { useSavingsGoals } from '@/hooks/useSavingsGoals';
import { useRecurringReminders } from '@/hooks/useRecurringReminders';
import { useTransfer } from '@/hooks/useTransfer';
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

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export default function Dashboard() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [formType, setFormType] = useState<TransactionType>('expense');
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);

  // Show tutorial on first visit
  useEffect(() => {
    if (!localStorage.getItem('tutorial-completed')) {
      setIsTutorialOpen(true);
    }
  }, []);

  const month = selectedDate.getMonth() + 1;
  const year = selectedDate.getFullYear();

  const { transactions, totalIncome, totalExpenses, isLoading: isLoadingTransactions, createTransaction } = useTransactions({ month, year });
  const { totalBalance, isLoading: isLoadingAccounts } = useAccounts();
  const { activeGoals } = useSavingsGoals();
  const { dueReminders } = useRecurringReminders();
  const { createTransfer } = useTransfer();

  // All transactions for charts
  const { transactions: allTransactions } = useTransactions();

  if (loading) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <SkeletonCard key={i} variant="stat" />
            ))}
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <SkeletonCard variant="chart" />
            <SkeletonCard variant="chart" />
          </div>
          <SkeletonCard variant="list" />
        </div>
      </AppLayout>
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
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-8 lg:space-y-10"
      >
        {/* Header with Month Navigation */}
        <motion.div variants={itemVariants} className="flex items-center justify-between">
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
        </motion.div>

        {/* Balance Highlight - Full Width */}
        <motion.div variants={itemVariants}>
          <BalanceHighlight balance={totalBalance} isLoading={isLoadingAccounts} />
        </motion.div>

        {/* Quick Actions - Desktop only */}
        <motion.div variants={itemVariants} className="hidden lg:block">
          <QuickActions
            onNewIncome={() => handleOpenForm('income')}
            onNewExpense={() => handleOpenForm('expense')}
            onTransfer={() => setIsTransferOpen(true)}
          />
        </motion.div>

        {/* Reminders Alert */}
        {dueReminders.length > 0 && (
          <motion.div variants={itemVariants}>
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
          </motion.div>
        )}

        {/* Stats Grid - 3 columns now (balance is separate) */}
        <motion.div variants={itemVariants} className="grid gap-4 sm:grid-cols-3">
          <AnimatedStatCard
            title="Receitas do mês"
            value={totalIncome}
            icon={ArrowUpCircle}
            variant="income"
          />
          <AnimatedStatCard
            title="Despesas do mês"
            value={totalExpenses}
            icon={ArrowDownCircle}
            variant="expense"
          />
          <AnimatedStatCard
            title="Economia do mês"
            value={economy}
            icon={TrendingUp}
            trend={
              economy !== 0
                ? { value: `${((economy / (totalIncome || 1)) * 100).toFixed(0)}% das receitas`, isPositive: economy > 0 }
                : undefined
            }
          />
        </motion.div>

        {/* Financial Intelligence Cards */}
        <motion.div variants={itemVariants} className="grid gap-6 lg:grid-cols-2">
          <MonthProjection month={month} year={year} />
          <BudgetProgress month={month} year={year} />
        </motion.div>

        {/* Goals Summary */}
        {activeGoals.length > 0 && (
          <motion.div variants={itemVariants}>
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
                      <motion.div
                        key={goal.id}
                        whileHover={{ scale: 1.02 }}
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
                            className="h-full rounded-full transition-all duration-500"
                            style={{ width: `${progress}%`, backgroundColor: goal.color }}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatCurrency(Number(goal.current_amount))} / {formatCurrency(Number(goal.target_amount))}
                        </p>
                      </motion.div>
                    );
                  })}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    onClick={() => navigate('/metas')}
                    className="min-w-[200px] p-3 rounded-lg border border-dashed flex items-center justify-center gap-2 text-muted-foreground hover:bg-accent transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span className="text-sm">Nova meta</span>
                  </motion.button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Installments Tracker */}
        <motion.div variants={itemVariants}>
          <InstallmentsTracker />
        </motion.div>

        {/* Charts */}
        <motion.div variants={itemVariants} className="grid gap-6 lg:grid-cols-2">
          <MonthlyChart transactions={allTransactions} isLoading={isLoadingTransactions} />
          <ExpensesByCategory transactions={transactions} isLoading={isLoadingTransactions} />
        </motion.div>

        {/* Recent Transactions */}
        <motion.div variants={itemVariants}>
          <RecentTransactions transactions={transactions} isLoading={isLoadingTransactions} />
        </motion.div>

        {/* Transaction Form */}
        <TransactionForm
          type={formType}
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          onSubmit={(data) => createTransaction.mutate(data)}
          isLoading={createTransaction.isPending}
        />

        {/* Transfer Form */}
        <TransferForm
          isOpen={isTransferOpen}
          onClose={() => setIsTransferOpen(false)}
          onSubmit={(data) => createTransfer.mutate(data)}
          isLoading={createTransfer.isPending}
        />

        {/* Floating Action Button - Mobile only */}
        <FloatingActionButton
          onNewIncome={() => handleOpenForm('income')}
          onNewExpense={() => handleOpenForm('expense')}
          onTransfer={() => setIsTransferOpen(true)}
        />
      </motion.div>
    </AppLayout>
  );
}
