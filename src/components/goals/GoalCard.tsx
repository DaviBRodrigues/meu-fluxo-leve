import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { SavingsGoal } from '@/types/database';
import { formatCurrency, formatDate } from '@/lib/format';
import { Target, Plus, Trash2, MoreVertical, Check } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface GoalCardProps {
  goal: SavingsGoal;
  onAddAmount?: (id: string, amount: number) => void;
  onDelete?: (id: string) => void;
}

export default function GoalCard({ goal, onAddAmount, onDelete }: GoalCardProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [addAmount, setAddAmount] = useState('');

  const progress = Math.min((Number(goal.current_amount) / Number(goal.target_amount)) * 100, 100);
  const remaining = Number(goal.target_amount) - Number(goal.current_amount);

  const handleAddAmount = () => {
    const amount = parseFloat(addAmount.replace(/\./g, '').replace(',', '.'));
    if (amount > 0 && onAddAmount) {
      onAddAmount(goal.id, amount);
      setAddAmount('');
      setIsAddDialogOpen(false);
    }
  };

  return (
    <>
      <Card className={cn('overflow-hidden', goal.is_completed && 'border-income/50')}>
        <div className="h-2" style={{ backgroundColor: goal.color }} />
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: `${goal.color}20` }}
              >
                {goal.is_completed ? (
                  <Check className="w-6 h-6 text-income" />
                ) : (
                  <Target className="w-6 h-6" style={{ color: goal.color }} />
                )}
              </div>
              <div>
                <p className="font-semibold">{goal.name}</p>
                {goal.target_date && (
                  <p className="text-sm text-muted-foreground">
                    Meta: {formatDate(goal.target_date)}
                  </p>
                )}
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {!goal.is_completed && onAddAmount && (
                  <DropdownMenuItem onClick={() => setIsAddDialogOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar valor
                  </DropdownMenuItem>
                )}
                {onDelete && (
                  <DropdownMenuItem
                    onClick={() => onDelete(goal.id)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Remover
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="mt-4 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Progresso</span>
              <span className="font-medium">{progress.toFixed(0)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
            <div className="flex justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Guardado</p>
                <p className="font-semibold text-income">
                  {formatCurrency(Number(goal.current_amount))}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Meta</p>
                <p className="font-semibold">{formatCurrency(Number(goal.target_amount))}</p>
              </div>
            </div>
            {!goal.is_completed && remaining > 0 && (
              <p className="text-sm text-muted-foreground text-center">
                Faltam {formatCurrency(remaining)}
              </p>
            )}
          </div>

          {!goal.is_completed && onAddAmount && (
            <Button
              variant="outline"
              className="w-full mt-4"
              onClick={() => setIsAddDialogOpen(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Adicionar valor
            </Button>
          )}
        </CardContent>
      </Card>

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Adicionar à meta</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Quanto você deseja adicionar a "{goal.name}"?
            </p>
            <Input
              placeholder="0,00"
              value={addAmount}
              onChange={(e) => setAddAmount(e.target.value)}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddAmount}>Adicionar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}