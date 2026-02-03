import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import AppLayout from '@/components/layout/AppLayout';
import TransactionForm from '@/components/transactions/TransactionForm';
import TransactionList from '@/components/transactions/TransactionList';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTransactions } from '@/hooks/useTransactions';
import { useAccounts } from '@/hooks/useAccounts';
import { formatCurrency, getMonthName } from '@/lib/format';
import { ArrowUpCircle, Plus, ChevronLeft, ChevronRight } from 'lucide-react';

export default function Income() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedAccountId, setSelectedAccountId] = useState<string | undefined>();

  const month = selectedDate.getMonth() + 1;
  const year = selectedDate.getFullYear();

  const { transactions, totalIncome, isLoading, createTransaction, deleteTransaction } = useTransactions({
    month,
    year,
    type: 'income',
    accountId: selectedAccountId,
  });

  const { accounts } = useAccounts();

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

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <ArrowUpCircle className="w-7 h-7 text-income" />
              Receitas
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
            Nova Receita
          </Button>
        </div>

        {/* Summary */}
        <Card className="bg-income/5 border-income/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total de receitas em {getMonthName(month)}</p>
                <p className="text-3xl font-bold text-income">{formatCurrency(totalIncome)}</p>
              </div>
              <div className="w-16 h-16 rounded-2xl bg-income/20 flex items-center justify-center">
                <ArrowUpCircle className="w-8 h-8 text-income" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Filters */}
        <div className="flex gap-4">
          <Select
            value={selectedAccountId || 'all'}
            onValueChange={(v) => setSelectedAccountId(v === 'all' ? undefined : v)}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Todas as contas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as contas</SelectItem>
              {accounts.map((account) => (
                <SelectItem key={account.id} value={account.id}>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: account.color }}
                    />
                    {account.name}
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
          type="income"
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          onSubmit={(data) => createTransaction.mutate(data)}
          isLoading={createTransaction.isPending}
        />
      </div>
    </AppLayout>
  );
}