import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Account } from '@/types/database';
import { formatCurrency } from '@/lib/format';
import { Wallet, CreditCard, PiggyBank, Banknote, TrendingUp, MoreVertical, Trash2, Edit } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

const accountIcons: Record<string, React.ElementType> = {
  checking: Wallet,
  savings: PiggyBank,
  credit_card: CreditCard,
  cash: Banknote,
  investment: TrendingUp,
};

const accountTypeLabels: Record<string, string> = {
  checking: 'Conta Corrente',
  savings: 'Poupança',
  credit_card: 'Cartão de Crédito',
  cash: 'Dinheiro',
  investment: 'Investimento',
};

interface AccountCardProps {
  account: Account;
  onEdit?: (account: Account) => void;
  onDelete?: (id: string) => void;
}

export default function AccountCard({ account, onEdit, onDelete }: AccountCardProps) {
  const Icon = accountIcons[account.type] || Wallet;
  const isNegative = Number(account.balance) < 0;

  return (
    <Card className="overflow-hidden">
      <div className="h-2" style={{ backgroundColor: account.color }} />
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: `${account.color}20` }}
            >
              <Icon className="w-6 h-6" style={{ color: account.color }} />
            </div>
            <div>
              <p className="font-semibold">{account.name}</p>
              <p className="text-sm text-muted-foreground">{accountTypeLabels[account.type] || account.type}</p>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onEdit && (
                <DropdownMenuItem onClick={() => onEdit(account)}>
                  <Edit className="w-4 h-4 mr-2" />
                  Editar
                </DropdownMenuItem>
              )}
              {onDelete && (
                <DropdownMenuItem
                  onClick={() => onDelete(account.id)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Remover
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="mt-4">
          <p className="text-sm text-muted-foreground">Saldo</p>
          <p className={cn('text-2xl font-bold', isNegative ? 'text-expense' : 'text-foreground')}>
            {formatCurrency(Number(account.balance))}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}