import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { MoreVertical, Plus, Minus, TrendingUp, Trash2, Pencil } from 'lucide-react';
import { Investment } from '@/types/database';
import { formatCurrency } from '@/lib/format';

interface InvestmentCardProps {
  investment: Investment;
  onDeposit: (investment: Investment) => void;
  onWithdraw: (investment: Investment) => void;
  onAddYield: (investment: Investment) => void;
  onEdit: (investment: Investment) => void;
  onDelete: (id: string) => void;
}

export default function InvestmentCard({
  investment,
  onDeposit,
  onWithdraw,
  onAddYield,
  onEdit,
  onDelete,
}: InvestmentCardProps) {
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);

  const yieldAmount = Number(investment.current_amount) - Number(investment.initial_amount);
  const yieldPercentage = Number(investment.initial_amount) > 0
    ? (yieldAmount / Number(investment.initial_amount)) * 100
    : 0;

  const progress = investment.target_amount
    ? Math.min((Number(investment.current_amount) / Number(investment.target_amount)) * 100, 100)
    : null;

  return (
    <>
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-5">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: `${investment.color}20` }}
              >
                <TrendingUp className="w-6 h-6" style={{ color: investment.color }} />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">{investment.name}</h3>
                {investment.category && (
                  <Badge variant="secondary" className="text-xs mt-1">
                    {investment.category.name}
                  </Badge>
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
                <DropdownMenuItem onClick={() => onDeposit(investment)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Aportar
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onWithdraw(investment)}>
                  <Minus className="w-4 h-4 mr-2" />
                  Resgatar
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onAddYield(investment)}>
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Registrar Rendimento
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onEdit(investment)}>
                  <Pencil className="w-4 h-4 mr-2" />
                  Editar
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setShowDeleteAlert(true)}
                  className="text-destructive"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Excluir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="space-y-3">
            <div>
              <p className="text-2xl font-bold text-foreground">
                {formatCurrency(Number(investment.current_amount))}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm text-muted-foreground">
                  Investido: {formatCurrency(Number(investment.initial_amount))}
                </span>
                <span
                  className={`text-sm font-medium ${
                    yieldAmount >= 0 ? 'text-emerald-500' : 'text-destructive'
                  }`}
                >
                  {yieldAmount >= 0 ? '+' : ''}
                  {formatCurrency(yieldAmount)} ({yieldPercentage.toFixed(2)}%)
                </span>
              </div>
            </div>

            {progress !== null && (
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Meta</span>
                  <span className="text-foreground">
                    {formatCurrency(Number(investment.target_amount))}
                  </span>
                </div>
                <Progress value={progress} className="h-2" />
                <p className="text-xs text-muted-foreground mt-1 text-right">
                  {progress.toFixed(0)}% alcançado
                </p>
              </div>
            )}

            {investment.notes && (
              <p className="text-sm text-muted-foreground mt-2">{investment.notes}</p>
            )}
          </div>

          <div className="flex gap-2 mt-4 pt-4 border-t border-border">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => onDeposit(investment)}
            >
              <Plus className="w-4 h-4 mr-1" />
              Aportar
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => onWithdraw(investment)}
            >
              <Minus className="w-4 h-4 mr-1" />
              Resgatar
            </Button>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir investimento?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O investimento "{investment.name}" e todo
              seu histórico serão removidos permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => onDelete(investment.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
