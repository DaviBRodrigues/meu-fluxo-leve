import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import AppLayout from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTransactions } from '@/hooks/useTransactions';
import { useAccounts } from '@/hooks/useAccounts';
import { formatCurrency, getMonthName } from '@/lib/format';
import { BarChart3, TrendingUp, TrendingDown, Wallet, Landmark } from 'lucide-react';
import SmartAnalysis from '@/components/reports/SmartAnalysis';
import { useBudgets } from '@/hooks/useBudgets';
import { useSavingsGoals } from '@/hooks/useSavingsGoals';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LineChart, Line } from 'recharts';

export default function Reports() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const { transactions, isLoading } = useTransactions();
  const { totalBalance } = useAccounts();
  const { budgets } = useBudgets(undefined, undefined);
  const { goals } = useSavingsGoals();

  if (loading) return null;
  if (!user) {
    navigate('/auth');
    return null;
  }

  // Filter transactions for selected year (parse date string to avoid timezone shift)
  const yearTransactions = transactions.filter((t) => {
    const [y] = t.date.split('-').map(Number);
    return y === selectedYear;
  });

  // Monthly data for charts
  const monthlyData = Array.from({ length: 12 }, (_, i) => {
    const month = i + 1;
    const monthTransactions = yearTransactions.filter((t) => {
      const [, m] = t.date.split('-').map(Number);
      return m === month;
    });

    const income = monthTransactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const expense = monthTransactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    return {
      month: getMonthName(month).slice(0, 3),
      fullMonth: getMonthName(month),
      Receitas: income,
      Despesas: expense,
      Saldo: income - expense,
    };
  });

  // Year totals
  const yearIncome = yearTransactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const yearExpenses = yearTransactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const yearBalance = yearIncome - yearExpenses;

  // Category breakdown for the year
  const categoryBreakdown = yearTransactions
    .filter((t) => t.type === 'expense')
    .reduce((acc, t) => {
      const categoryName = t.category?.name || 'Outros';
      const categoryColor = t.category?.color || '#6B7280';
      if (!acc[categoryName]) {
        acc[categoryName] = { value: 0, color: categoryColor };
      }
      acc[categoryName].value += Number(t.amount);
      return acc;
    }, {} as Record<string, { value: number; color: string }>);

  const categoryData = Object.entries(categoryBreakdown)
    .map(([name, data]) => ({
      name,
      value: data.value,
      color: data.color,
    }))
    .sort((a, b) => b.value - a.value);

  const smartFinancialData = {
    year: selectedYear,
    totalBalance,
    yearIncome,
    yearExpenses,
    monthlyData: monthlyData.map((m) => ({ month: m.fullMonth, income: m.Receitas, expenses: m.Despesas })),
    categoryBreakdown: categoryData.map((c) => ({ name: c.name, value: c.value })),
    budgets: budgets.map((b: any) => ({
      category: b.category?.name || 'Sem nome',
      budgeted: Number(b.amount),
      spent: yearTransactions
        .filter((t) => t.type === 'expense' && t.category_id === b.category_id)
        .reduce((s, t) => s + Number(t.amount), 0),
    })),
    goals: goals.map((g) => ({
      name: g.name,
      target: Number(g.target_amount),
      current: Number(g.current_amount),
      completed: g.is_completed,
    })),
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-popover border rounded-lg shadow-lg p-3">
          <p className="font-medium capitalize mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i);

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <BarChart3 className="w-7 h-7 text-primary" />
              Relatórios
            </h1>
            <p className="text-muted-foreground mt-1">Análise do seu histórico financeiro</p>
          </div>
          <Select value={String(selectedYear)} onValueChange={(v) => setSelectedYear(Number(v))}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map((year) => (
                <SelectItem key={year} value={String(year)}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Year Summary */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Landmark className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Saldo em Conta</p>
                  <p className={`text-xl font-bold ${totalBalance >= 0 ? 'text-income' : 'text-expense'}`}>
                    {formatCurrency(totalBalance)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-income/10 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-income" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Receitas {selectedYear}</p>
                  <p className="text-xl font-bold text-income">{formatCurrency(yearIncome)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-expense/10 flex items-center justify-center">
                  <TrendingDown className="w-6 h-6 text-expense" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Despesas {selectedYear}</p>
                  <p className="text-xl font-bold text-expense">{formatCurrency(yearExpenses)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Wallet className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Balanço {selectedYear}</p>
                  <p className={`text-xl font-bold ${yearBalance >= 0 ? 'text-income' : 'text-expense'}`}>
                    {formatCurrency(yearBalance)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Smart Analysis */}
        <SmartAnalysis financialData={smartFinancialData} />

        {/* Monthly Comparison Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Comparativo Mensal - {selectedYear}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="month"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                    tickFormatter={(value) => `R$${value / 1000}k`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar dataKey="Receitas" fill="hsl(var(--income))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Despesas" fill="hsl(var(--expense))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Balance Evolution */}
        <Card>
          <CardHeader>
            <CardTitle>Evolução do Saldo - {selectedYear}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="month"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                    tickFormatter={(value) => `R$${value / 1000}k`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="Saldo"
                    stroke="hsl(var(--primary))"
                    strokeWidth={3}
                    dot={{ fill: 'hsl(var(--primary))' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Category Ranking */}
        <Card>
          <CardHeader>
            <CardTitle>Ranking de Despesas por Categoria - {selectedYear}</CardTitle>
          </CardHeader>
          <CardContent>
            {categoryData.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>Sem despesas registradas em {selectedYear}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {categoryData.map((category, index) => {
                  const percentage = (category.value / yearExpenses) * 100;
                  return (
                    <div key={category.name} className="flex items-center gap-4">
                      <span className="text-2xl font-bold text-muted-foreground w-8">
                        {index + 1}º
                      </span>
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: category.color }}
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium">{category.name}</span>
                          <span className="font-semibold">{formatCurrency(category.value)}</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${percentage}%`,
                              backgroundColor: category.color,
                            }}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {percentage.toFixed(1)}% do total
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Monthly Details Table */}
        <Card>
          <CardHeader>
            <CardTitle>Resumo Mensal - {selectedYear}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-2 font-medium">Mês</th>
                    <th className="text-right py-3 px-2 font-medium">Receitas</th>
                    <th className="text-right py-3 px-2 font-medium">Despesas</th>
                    <th className="text-right py-3 px-2 font-medium">Saldo</th>
                  </tr>
                </thead>
                <tbody>
                  {monthlyData.map((month) => (
                    <tr key={month.month} className="border-b last:border-0">
                      <td className="py-3 px-2 capitalize">{month.fullMonth}</td>
                      <td className="py-3 px-2 text-right text-income">
                        {formatCurrency(month.Receitas)}
                      </td>
                      <td className="py-3 px-2 text-right text-expense">
                        {formatCurrency(month.Despesas)}
                      </td>
                      <td className={`py-3 px-2 text-right font-medium ${month.Saldo >= 0 ? 'text-income' : 'text-expense'}`}>
                        {formatCurrency(month.Saldo)}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-muted/50 font-semibold">
                    <td className="py-3 px-2">Total</td>
                    <td className="py-3 px-2 text-right text-income">{formatCurrency(yearIncome)}</td>
                    <td className="py-3 px-2 text-right text-expense">{formatCurrency(yearExpenses)}</td>
                    <td className={`py-3 px-2 text-right ${yearBalance >= 0 ? 'text-income' : 'text-expense'}`}>
                      {formatCurrency(yearBalance)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}