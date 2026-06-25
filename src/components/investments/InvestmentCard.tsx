import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
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
import { Account, Investment } from '@/types/database';
import { formatCurrency } from '@/lib/format';

interface InvestmentCardProps {
  investment: Investment;
  accounts: Account[];
  onDeposit: (investment: Investment) => void;
  onWithdraw: (investment: Investment) => void;
  onAddYield: (investment: Investment) => void;
  onEdit: (investment: Investment) => void;
  onDelete: (id: string, refundAccountId?: string) => void;
}

export default function InvestmentCard({
  investment,
  accounts,
  onDeposit,
  onWithdraw,
  onAddYield,
  onEdit,
  onDelete,
}: InvestmentCardProps) {
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [refund, setRefund] = useState(true);
  const [refundAccountId, setRefundAccountId] = useState<string>(accounts[0]?.id || '');

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
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-2 mb-3">
            <div className="flex items-center gap-3 min-w-0">
              <div
                className="w-10 h-10 shrink-0 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: `${investment.color}20` }}
              >
                <TrendingUp className="w-5 h-5" style={{ color: investment.color }} />
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold text-foreground text-sm truncate">{investment.name}</h3>
                {investment.category && (
                  <Badge variant="secondary" className="text-[10px] mt-0.5 px-1.5 py-0">
                    {investment.category.name}
                  </Badge>
                )}
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
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

          <div className="space-y-2">
            <div>
              <p className="text-xl sm:text-2xl font-bold text-foreground tabular-nums">
                {formatCurrency(Number(investment.current_amount))}
              </p>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
                <span className="text-xs text-muted-foreground">
                  Aportado: {formatCurrency(Number(investment.initial_amount))}
                </span>
                <span
                  className={`text-xs font-medium ${
                    yieldAmount >= 0 ? 'text-emerald-500' : 'text-destructive'
                  }`}
                >
                  {yieldAmount >= 0 ? '+' : ''}
                  {formatCurrency(yieldAmount)} ({yieldPercentage.toFixed(1)}%)
                </span>
              </div>
            </div>

            {progress !== null && (
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Meta {progress.toFixed(0)}%</span>
                  <span className="text-foreground tabular-nums">
                    {formatCurrency(Number(investment.target_amount))}
                  </span>
                </div>
                <Progress value={progress} className="h-1.5" />
              </div>
            )}

            {investment.notes && (
              <p className="text-xs text-muted-foreground line-clamp-2">{investment.notes}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-border">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDeposit(investment)}
            >
              <Plus className="w-4 h-4 mr-1" />
              Aportar
            </Button>
            <Button
              variant="outline"
              size="sm"
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
            <AlertDialogTitle>Excluir caixinha?</AlertDialogTitle>
            <AlertDialogDescription>
              A caixinha "{investment.name}" e todo seu histórico serão removidos permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-3 py-2">
            <div className="flex items-start gap-2">
              <Checkbox
                id={`refund-${investment.id}`}
                checked={refund}
                onCheckedChange={(c) => setRefund(c === true)}
              />
              <div className="grid gap-1">
                <Label htmlFor={`refund-${investment.id}`} className="cursor-pointer">
                  Devolver saldo para uma conta
                </Label>
                <p className="text-xs text-muted-foreground">
                  Devolve o total aportado ({formatCurrency(Number(investment.initial_amount))}) para a conta escolhida. Desmarque se o dinheiro nunca saiu de uma conta sua (ex: saldo inicial).
                </p>
              </div>
            </div>

            {refund && (
              <Select value={refundAccountId} onValueChange={setRefundAccountId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma conta" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: a.color }} />
                        {a.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => onDelete(investment.id, refund ? refundAccountId : undefined)}
              disabled={refund && !refundAccountId}
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
