import { useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useBudgets } from '@/hooks/useBudgets';
import { useCategories } from '@/hooks/useCategories';
import { useTransactions } from '@/hooks/useTransactions';
import { formatCurrency, formatMonthYear } from '@/lib/format';
import { Plus, Edit, Trash2, ChevronLeft, ChevronRight, AlertTriangle, PiggyBank } from 'lucide-react';
import { cn } from '@/lib/utils';
import EmptyState from '@/components/shared/EmptyState';

export default function Budgets() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<string | null>(null);
  const [formData, setFormData] = useState({ category_id: '', amount: '' });

  const month = selectedDate.getMonth() + 1;
  const year = selectedDate.getFullYear();

  const { budgets, isLoading, createBudget, updateBudget, deleteBudget } = useBudgets(month, year);
  const { categories } = useCategories('expense');
  const { transactions } = useTransactions({ month, year, type: 'expense' });

  const handlePreviousMonth = () => {
    setSelectedDate(new Date(year, month - 2, 1));
  };

  const handleNextMonth = () => {
    setSelectedDate(new Date(year, month, 1));
  };

  const handleOpenForm = (budgetId?: string) => {
    if (budgetId) {
      const budget = budgets.find(b => b.id === budgetId);
      if (budget) {
        setFormData({
          category_id: budget.category_id,
          amount: String(budget.amount),
        });
        setEditingBudget(budgetId);
      }
    } else {
      setFormData({ category_id: '', amount: '' });
      setEditingBudget(null);
    }
    setIsFormOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(formData.amount.replace(/\./g, '').replace(',', '.'));
    if (isNaN(amount) || amount <= 0) return;

    if (editingBudget) {
      updateBudget.mutate({ id: editingBudget, amount });
    } else {
      createBudget.mutate({
        category_id: formData.category_id,
        amount,
        month,
        year,
      });
    }
    setIsFormOpen(false);
    setFormData({ category_id: '', amount: '' });
  };

  // Calculate spending per category
  const spendingByCategory = transactions.reduce((acc, t) => {
    acc[t.category_id] = (acc[t.category_id] || 0) + Number(t.amount);
    return acc;
  }, {} as Record<string, number>);

  // Get categories without budgets
  const categoriesWithoutBudget = categories.filter(
    c => !budgets.some(b => b.category_id === c.id)
  );

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Orçamentos</h1>
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
          <Button onClick={() => handleOpenForm()} disabled={categoriesWithoutBudget.length === 0}>
            <Plus className="w-4 h-4 mr-2" />
            Novo Orçamento
          </Button>
        </div>

        {/* Budget Cards */}
        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-4 bg-muted rounded w-1/2 mb-4" />
                  <div className="h-8 bg-muted rounded w-3/4 mb-2" />
                  <div className="h-2 bg-muted rounded w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : budgets.length === 0 ? (
          <EmptyState
            icon={PiggyBank}
            title="Nenhum orçamento definido"
            description="Defina limites de gastos por categoria para controlar melhor suas finanças."
            actionLabel="Criar Orçamento"
            onAction={() => handleOpenForm()}
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {budgets.map((budget) => {
              const spent = spendingByCategory[budget.category_id] || 0;
              const percentage = Math.min((spent / Number(budget.amount)) * 100, 100);
              const isOver = spent > Number(budget.amount);
              const isWarning = percentage >= 80 && !isOver;

              return (
                <Card
                  key={budget.id}
                  className={cn(
                    'transition-all',
                    isOver && 'border-destructive/50 bg-destructive/5',
                    isWarning && 'border-warning/50 bg-warning/5'
                  )}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: budget.category?.color }}
                        />
                        <CardTitle className="text-base font-medium">
                          {budget.category?.name}
                        </CardTitle>
                      </div>
                      <div className="flex items-center gap-1">
                        {(isOver || isWarning) && (
                          <AlertTriangle
                            className={cn(
                              'w-4 h-4',
                              isOver ? 'text-destructive' : 'text-warning'
                            )}
                          />
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleOpenForm(budget.id)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => deleteBudget.mutate(budget.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-end justify-between">
                        <div>
                          <p className="text-2xl font-bold">{formatCurrency(spent)}</p>
                          <p className="text-sm text-muted-foreground">
                            de {formatCurrency(Number(budget.amount))}
                          </p>
                        </div>
                        <span
                          className={cn(
                            'text-sm font-medium',
                            isOver ? 'text-destructive' : isWarning ? 'text-warning' : 'text-muted-foreground'
                          )}
                        >
                          {percentage.toFixed(0)}%
                        </span>
                      </div>
                      <Progress
                        value={percentage}
                        className={cn(
                          'h-2',
                          isOver && '[&>div]:bg-destructive',
                          isWarning && '[&>div]:bg-warning'
                        )}
                      />
                      {isOver && (
                        <p className="text-sm text-destructive">
                          Excedeu {formatCurrency(spent - Number(budget.amount))}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Form Dialog */}
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingBudget ? 'Editar Orçamento' : 'Novo Orçamento'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              {!editingBudget && (
                <div className="space-y-2">
                  <Label>Categoria</Label>
                  <Select
                    value={formData.category_id}
                    onValueChange={(v) => setFormData({ ...formData, category_id: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {categoriesWithoutBudget.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: category.color }}
                            />
                            {category.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label>Limite mensal (R$)</Label>
                <Input
                  placeholder="0,00"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setIsFormOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" className="flex-1">
                  Salvar
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
