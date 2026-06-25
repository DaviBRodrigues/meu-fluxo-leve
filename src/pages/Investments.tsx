import { useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { useInvestments } from '@/hooks/useInvestments';
import { useAccounts } from '@/hooks/useAccounts';
import { formatCurrency, formatDate } from '@/lib/format';
import { Investment, InvestmentTransactionType } from '@/types/database';
import InvestmentCard from '@/components/investments/InvestmentCard';
import InvestmentForm from '@/components/investments/InvestmentForm';
import InvestmentTransactionForm from '@/components/investments/InvestmentTransactionForm';
import EmptyState from '@/components/shared/EmptyState';
import AnimatedStatCard from '@/components/dashboard/AnimatedStatCard';
import { Plus, TrendingUp, Wallet, PiggyBank, ArrowUpRight, ArrowDownRight } from 'lucide-react';

export default function Investments() {
  const {
    categories,
    investments,
    transactions,
    isLoading,
    totalInvested,
    totalInitial,
    totalYield,
    yieldPercentage,
    createCategory,
    createInvestment,
    updateInvestment,
    deleteInvestment,
    depositToInvestment,
    withdrawFromInvestment,
    addYield,
  } = useInvestments();

  const { accounts } = useAccounts();

  const [showForm, setShowForm] = useState(false);
  const [editingInvestment, setEditingInvestment] = useState<Investment | null>(null);
  const [transactionType, setTransactionType] = useState<InvestmentTransactionType | null>(null);
  const [selectedInvestment, setSelectedInvestment] = useState<Investment | null>(null);

  const handleCreateInvestment = (data: {
    name: string;
    category_id?: string;
    target_amount?: number;
    color: string;
    notes?: string;
  }) => {
    if (editingInvestment) {
      updateInvestment.mutate({ id: editingInvestment.id, ...data });
    } else {
      createInvestment.mutate(data);
    }
    setEditingInvestment(null);
  };

  const handleDeposit = (investment: Investment) => {
    setSelectedInvestment(investment);
    setTransactionType('deposit');
  };

  const handleWithdraw = (investment: Investment) => {
    setSelectedInvestment(investment);
    setTransactionType('withdrawal');
  };

  const handleAddYield = (investment: Investment) => {
    setSelectedInvestment(investment);
    setTransactionType('yield');
  };

  const handleTransactionSubmit = (data: {
    investment_id: string;
    account_id: string;
    amount: number;
    description?: string;
    date?: string;
  }) => {
    if (transactionType === 'deposit') {
      depositToInvestment.mutate(data);
    } else if (transactionType === 'withdrawal') {
      withdrawFromInvestment.mutate(data);
    } else if (transactionType === 'yield') {
      addYield.mutate(data);
    }
    setTransactionType(null);
    setSelectedInvestment(null);
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-5 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">Investimentos</h1>
            <p className="text-sm text-muted-foreground">Suas caixinhas de investimento</p>
          </div>
          <Button onClick={() => setShowForm(true)} className="w-full sm:w-auto">
            <Plus className="w-4 h-4 mr-2" />
            Nova Caixinha
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
          <AnimatedStatCard
            title="Total Investido"
            value={totalInvested}
            icon={PiggyBank}
            trend={
              investments.length > 0
                ? { value: `${investments.length} investimentos`, isPositive: true }
                : undefined
            }
          />
          <AnimatedStatCard
            title="Total Aportado"
            value={totalInitial}
            icon={Wallet}
          />
          <div className="col-span-2 md:col-span-1">
            <AnimatedStatCard
              title="Rendimentos"
              value={totalYield}
              icon={TrendingUp}
              trend={
                totalInitial > 0
                  ? {
                      value: `${yieldPercentage.toFixed(2)}%`,
                      isPositive: yieldPercentage >= 0,
                    }
                  : undefined
              }
            />
          </div>
        </div>

        <Tabs defaultValue="investments" className="space-y-4">
          <TabsList className="w-full sm:w-auto">
            <TabsTrigger value="investments" className="flex-1 sm:flex-none">Caixinhas</TabsTrigger>
            <TabsTrigger value="history" className="flex-1 sm:flex-none">Histórico</TabsTrigger>
          </TabsList>

          <TabsContent value="investments">
            {investments.length === 0 ? (
              <EmptyState
                icon={PiggyBank}
                title="Nenhum investimento"
                description="Crie sua primeira caixinha de investimento para começar a acompanhar seus rendimentos."
                actionLabel="Criar Caixinha"
                onAction={() => setShowForm(true)}
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
                {investments.map((investment) => (
                  <InvestmentCard
                    key={investment.id}
                    investment={investment}
                    onDeposit={handleDeposit}
                    onWithdraw={handleWithdraw}
                    onAddYield={handleAddYield}
                    onEdit={(inv) => {
                      setEditingInvestment(inv);
                      setShowForm(true);
                    }}
                    onDelete={(id, refundAccountId) => deleteInvestment.mutate({ id, refundAccountId })}
                    accounts={accounts.filter((a) => a.is_active)}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="history">
            {transactions.length === 0 ? (
              <EmptyState
                icon={TrendingUp}
                title="Nenhuma movimentação"
                description="Faça um aporte ou resgate para ver o histórico aqui."
              />
            ) : (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base sm:text-lg">Histórico de Movimentações</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {transactions.map((tx) => {
                      const isDeposit = tx.type === 'deposit';
                      const isWithdraw = tx.type === 'withdrawal';
                      const colorClass = isDeposit
                        ? 'text-emerald-500'
                        : isWithdraw
                        ? 'text-destructive'
                        : 'text-primary';
                      const bgClass = isDeposit
                        ? 'bg-emerald-500/15'
                        : isWithdraw
                        ? 'bg-destructive/15'
                        : 'bg-primary/15';
                      return (
                        <div
                          key={tx.id}
                          className="flex items-center justify-between gap-3 p-3 rounded-lg bg-muted/40"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className={`w-9 h-9 shrink-0 rounded-full flex items-center justify-center ${bgClass}`}>
                              {isDeposit ? (
                                <ArrowUpRight className={`w-4 h-4 ${colorClass}`} />
                              ) : isWithdraw ? (
                                <ArrowDownRight className={`w-4 h-4 ${colorClass}`} />
                              ) : (
                                <TrendingUp className={`w-4 h-4 ${colorClass}`} />
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-foreground text-sm truncate">
                                {tx.investment?.name}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">
                                {isDeposit ? 'Aporte' : isWithdraw ? 'Resgate' : 'Rendimento'}
                                {tx.description && ` • ${tx.description}`}
                              </p>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <p className={`font-semibold text-sm ${colorClass}`}>
                              {isWithdraw ? '-' : '+'}
                              {formatCurrency(Number(tx.amount))}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatDate(tx.date)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <InvestmentForm
        open={showForm}
        onOpenChange={(open) => {
          setShowForm(open);
          if (!open) setEditingInvestment(null);
        }}
        categories={categories}
        investment={editingInvestment}
        onSubmit={handleCreateInvestment}
        onCreateCategory={(cat) => createCategory.mutate(cat)}
      />

      {selectedInvestment && transactionType && (
        <InvestmentTransactionForm
          open={true}
          onOpenChange={(open) => {
            if (!open) {
              setTransactionType(null);
              setSelectedInvestment(null);
            }
          }}
          type={transactionType}
          investment={selectedInvestment}
          accounts={accounts}
          onSubmit={handleTransactionSubmit}
        />
      )}
    </AppLayout>
  );
}
