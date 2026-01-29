import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import AppLayout from '@/components/layout/AppLayout';
import GoalCard from '@/components/goals/GoalCard';
import GoalForm from '@/components/goals/GoalForm';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSavingsGoals } from '@/hooks/useSavingsGoals';
import { formatCurrency } from '@/lib/format';
import { Target, Plus, Trophy } from 'lucide-react';

export default function Goals() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [isFormOpen, setIsFormOpen] = useState(false);

  const { activeGoals, completedGoals, isLoading, createGoal, deleteGoal, addToGoal } = useSavingsGoals();

  if (loading) return null;
  if (!user) {
    navigate('/auth');
    return null;
  }

  const totalSaved = activeGoals.reduce((sum, g) => sum + Number(g.current_amount), 0);
  const totalTarget = activeGoals.reduce((sum, g) => sum + Number(g.target_amount), 0);

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Target className="w-7 h-7 text-primary" />
              Metas de Economia
            </h1>
            <p className="text-muted-foreground mt-1">Defina e acompanhe seus objetivos financeiros</p>
          </div>
          <Button onClick={() => setIsFormOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Nova Meta
          </Button>
        </div>

        {/* Summary */}
        {activeGoals.length > 0 && (
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-4">
              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Metas ativas</p>
                  <p className="text-2xl font-bold">{activeGoals.length}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total guardado</p>
                  <p className="text-2xl font-bold text-income">{formatCurrency(totalSaved)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Meta total</p>
                  <p className="text-2xl font-bold">{formatCurrency(totalTarget)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Goals Tabs */}
        <Tabs defaultValue="active" className="w-full">
          <TabsList>
            <TabsTrigger value="active">
              Ativas ({activeGoals.length})
            </TabsTrigger>
            <TabsTrigger value="completed">
              Concluídas ({completedGoals.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="mt-4">
            {isLoading ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {[...Array(3)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <div className="h-2 bg-muted" />
                    <CardContent className="p-4">
                      <div className="h-32 bg-muted rounded" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : activeGoals.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Target className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Nenhuma meta ativa</h3>
                  <p className="text-muted-foreground mb-4">
                    Crie metas para alcançar seus objetivos financeiros
                  </p>
                  <Button onClick={() => setIsFormOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Criar primeira meta
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {activeGoals.map((goal) => (
                  <GoalCard
                    key={goal.id}
                    goal={goal}
                    onAddAmount={(id, amount) => addToGoal.mutate({ id, amount })}
                    onDelete={(id) => deleteGoal.mutate(id)}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="completed" className="mt-4">
            {completedGoals.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Trophy className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Nenhuma meta concluída</h3>
                  <p className="text-muted-foreground">
                    Suas metas concluídas aparecerão aqui
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {completedGoals.map((goal) => (
                  <GoalCard
                    key={goal.id}
                    goal={goal}
                    onDelete={(id) => deleteGoal.mutate(id)}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Form */}
        <GoalForm
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          onSubmit={(data) => createGoal.mutate(data)}
          isLoading={createGoal.isPending}
        />
      </div>
    </AppLayout>
  );
}