import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Transaction } from '@/types/database';
import { formatCurrency } from '@/lib/format';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface ExpensesByCategoryProps {
  transactions: Transaction[];
  isLoading?: boolean;
}

export default function ExpensesByCategory({ transactions, isLoading }: ExpensesByCategoryProps) {
  const expensesByCategory = transactions
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

  const chartData = Object.entries(expensesByCategory)
    .map(([name, data]) => ({
      name,
      value: data.value,
      color: data.color,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  const total = chartData.reduce((sum, item) => sum + item.value, 0);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const percentage = ((data.value / total) * 100).toFixed(1);
      return (
        <div className="bg-popover border rounded-lg shadow-lg p-3">
          <p className="font-medium">{data.name}</p>
          <p className="text-sm text-muted-foreground">
            {formatCurrency(data.value)} ({percentage}%)
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold">Despesas por Categoria</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-64 flex items-center justify-center">
            <div className="w-32 h-32 rounded-full bg-muted animate-pulse" />
          </div>
        ) : chartData.length === 0 ? (
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            <p>Sem despesas neste período</p>
          </div>
        ) : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  layout="horizontal"
                  verticalAlign="bottom"
                  formatter={(value) => (
                    <span className="text-sm text-foreground">{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}