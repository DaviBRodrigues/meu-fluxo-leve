import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Account, Investment, InvestmentTransactionType } from '@/types/database';
import { formatCurrency } from '@/lib/format';
import { Plus, Minus, TrendingUp } from 'lucide-react';

const formSchema = z.object({
  account_id: z.string().min(1, 'Selecione uma conta'),
  amount: z.string().min(1, 'Valor é obrigatório'),
  description: z.string().optional(),
  date: z.string(),
});

type FormData = z.infer<typeof formSchema>;

interface InvestmentTransactionFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: InvestmentTransactionType;
  investment: Investment;
  accounts: Account[];
  onSubmit: (data: {
    investment_id: string;
    account_id: string;
    amount: number;
    description?: string;
    date?: string;
  }) => void;
}

const typeConfig = {
  deposit: {
    title: 'Aportar em',
    icon: Plus,
    buttonText: 'Confirmar Aporte',
    color: 'text-emerald-500',
  },
  withdrawal: {
    title: 'Resgatar de',
    icon: Minus,
    buttonText: 'Confirmar Resgate',
    color: 'text-destructive',
  },
  yield: {
    title: 'Registrar Rendimento em',
    icon: TrendingUp,
    buttonText: 'Confirmar Rendimento',
    color: 'text-primary',
  },
};

export default function InvestmentTransactionForm({
  open,
  onOpenChange,
  type,
  investment,
  accounts,
  onSubmit,
}: InvestmentTransactionFormProps) {
  const config = typeConfig[type];
  const Icon = config.icon;

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      account_id: '',
      amount: '',
      description: '',
      date: new Date().toISOString().split('T')[0],
    },
  });

  const handleSubmit = (data: FormData) => {
    onSubmit({
      investment_id: investment.id,
      account_id: data.account_id,
      amount: parseFloat(data.amount),
      description: data.description || undefined,
      date: data.date,
    });
    form.reset();
    onOpenChange(false);
  };

  const activeAccounts = accounts.filter((a) => a.is_active);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon className={`w-5 h-5 ${config.color}`} />
            {config.title} {investment.name}
          </DialogTitle>
        </DialogHeader>

        <div className="mb-4 p-3 bg-muted/50 rounded-lg">
          <p className="text-sm text-muted-foreground">Saldo atual</p>
          <p className="text-xl font-bold">
            {formatCurrency(Number(investment.current_amount))}
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {type !== 'yield' && (
              <FormField
                control={form.control}
                name="account_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {type === 'deposit' ? 'Debitar de' : 'Creditar em'}
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma conta" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {activeAccounts.map((account) => (
                          <SelectItem key={account.id} value={account.id}>
                            <div className="flex items-center justify-between gap-4">
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-3 h-3 rounded-full"
                                  style={{ backgroundColor: account.color }}
                                />
                                {account.name}
                              </div>
                              <span className="text-muted-foreground">
                                {formatCurrency(account.balance)}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {type === 'yield' && (
              <FormField
                control={form.control}
                name="account_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Conta de referência</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma conta" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {activeAccounts.map((account) => (
                          <SelectItem key={account.id} value={account.id}>
                            <div className="flex items-center gap-2">
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: account.color }}
                              />
                              {account.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0,00"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição (opcional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Aporte mensal" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" className="flex-1">
                {config.buttonText}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
