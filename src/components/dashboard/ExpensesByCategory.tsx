import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Transaction } from '@/types/database';
import { formatCurrency } from '@/lib/format';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { ArrowLeft } from 'lucide-react';
import { usePrivacy } from '@/contexts/PrivacyContext';

interface ExpensesByCategoryProps {
  transactions: Transaction[];
  isLoading?: boolean;
}

export default function ExpensesByCategory({ transactions, isLoading }: ExpensesByCategoryProps) {
  const [drillDownCategory, setDrillDownCategory] = useState<string | null>(null);
  const { isPrivate } = usePrivacy();

  const expenses = transactions.filter((t) => t.type === 'expense');

  // Group by parent category (or category itself if no parent)
  const expensesByCategory = expenses.reduce((acc, t) => {
    const cat = t.category;
    const parentName = cat?.parent_id ? undefined : cat?.name || 'Outros';
    const categoryName = parentName || cat?.name || 'Outros';
    const categoryColor = cat?.color || '#6B7280';
    const parentId = cat?.parent_id || cat?.id || 'other';

    if (!acc[categoryName]) {
      acc[categoryName] = { value: 0, color: categoryColor, id: parentId };
    }
    acc[categoryName].value += Number(t.amount);
    return acc;
  }, {} as Record<string, { value: number; color: string; id: string }>);

  // If drilling down, show subcategory breakdown
  const drillDownData = drillDownCategory
    ? expenses
        .filter(t => {
          const cat = t.category;
          return cat?.parent_id === drillDownCategory || (cat?.id === drillDownCategory && !cat?.parent_id);
        })
        .reduce((acc, t) => {
          const name = t.category?.name || 'Outros';
          const color = t.category?.color || '#6B7280';
          if (!acc[name]) acc[name] = { value: 0, color };
          acc[name].value += Number(t.amount);
          return acc;
        }, {} as Record<string, { value: number; color: string }>)
    : null;

  const rawData = drillDownData
    ? Object.entries(drillDownData).map(([name, data]) => ({ name, value: data.value, color: data.color }))
    : Object.entries(expensesByCategory).map(([name, data]) => ({ name, value: data.value, color: data.color, id: data.id }));

  const chartData = rawData.sort((a, b) => b.value - a.value).slice(0, 6);
  const total = chartData.reduce((sum, item) => sum + item.value, 0);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const percentage = ((data.value / total) * 100).toFixed(1);
      return (
        <div className="bg-popover border rounded-lg shadow-lg p-3">
          <p className="font-medium">{data.name}</p>
          <p className="text-sm text-muted-foreground">
            {isPrivate ? 'R$ •••••' : formatCurrency(data.value)} ({percentage}%)
          </p>
        </div>
      );
    }
    return null;
  };

  const handlePieClick = (data: any) => {
    if (!drillDownCategory && data?.id) {
      setDrillDownCategory(data.id);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          {drillDownCategory && (
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setDrillDownCategory(null)}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
          )}
          {drillDownCategory ? 'Subcategorias' : 'Despesas por Categoria'}
        </CardTitle>
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
                  onClick={handlePieClick}
                  className="cursor-pointer"
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