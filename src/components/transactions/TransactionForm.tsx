import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCategories } from '@/hooks/useCategories';
import { useAccounts } from '@/hooks/useAccounts';
import { TransactionType, Category, Account } from '@/types/database';

const transactionSchema = z.object({
  description: z.string().min(1, 'Descrição é obrigatória').max(100),
  amount: z.string().min(1, 'Valor é obrigatório'),
  date: z.date(),
  category_id: z.string().min(1, 'Categoria é obrigatória'),
  account_id: z.string().min(1, 'Conta é obrigatória'),
  recurrence: z.enum(['fixed', 'variable']),
  is_recurring: z.boolean(),
  notes: z.string().max(500).optional(),
});

type FormData = z.infer<typeof transactionSchema>;

interface TransactionFormProps {
  type: TransactionType;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    account_id: string;
    category_id: string;
    type: TransactionType;
    amount: number;
    description: string;
    date: string;
    recurrence: 'fixed' | 'variable';
    is_recurring: boolean;
    notes: string | null;
  }) => void;
  isLoading?: boolean;
}

export default function TransactionForm({ type, isOpen, onClose, onSubmit, isLoading }: TransactionFormProps) {
  const { categories } = useCategories(type);
  const { accounts } = useAccounts();
  const [date, setDate] = useState<Date>(new Date());

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      description: '',
      amount: '',
      date: new Date(),
      category_id: '',
      account_id: '',
      recurrence: 'variable',
      is_recurring: false,
      notes: '',
    },
  });

  const watchRecurrence = watch('recurrence');
  const watchIsRecurring = watch('is_recurring');

  const handleFormSubmit = (data: FormData) => {
    const amount = parseFloat(data.amount.replace(/\./g, '').replace(',', '.'));
    if (isNaN(amount) || amount <= 0) return;

    onSubmit({
      account_id: data.account_id,
      category_id: data.category_id,
      type,
      amount,
      description: data.description,
      date: format(data.date, 'yyyy-MM-dd'),
      recurrence: data.recurrence,
      is_recurring: data.is_recurring,
      notes: data.notes || null,
    });

    reset();
    onClose();
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {type === 'income' ? 'Nova Receita' : 'Nova Despesa'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Input
              id="description"
              placeholder={type === 'income' ? 'Ex: Salário mensal' : 'Ex: Conta de luz'}
              {...register('description')}
            />
            {errors.description && (
              <p className="text-sm text-destructive">{errors.description.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Valor (R$)</Label>
            <Input
              id="amount"
              placeholder="0,00"
              {...register('amount')}
            />
            {errors.amount && (
              <p className="text-sm text-destructive">{errors.amount.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Data</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !date && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, 'dd/MM/yyyy') : 'Selecione'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(d) => {
                      if (d) {
                        setDate(d);
                        setValue('date', d);
                      }
                    }}
                    locale={ptBR}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select onValueChange={(v) => setValue('category_id', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
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
              {errors.category_id && (
                <p className="text-sm text-destructive">{errors.category_id.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Conta</Label>
            <Select onValueChange={(v) => setValue('account_id', v)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a conta" />
              </SelectTrigger>
              <SelectContent>
                {accounts.map((account) => (
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
            {errors.account_id && (
              <p className="text-sm text-destructive">{errors.account_id.message}</p>
            )}
          </div>

          <div className="flex items-center justify-between py-2">
            <div className="space-y-0.5">
              <Label>Tipo de despesa</Label>
              <p className="text-sm text-muted-foreground">
                {watchRecurrence === 'fixed' ? 'Fixa (recorrente)' : 'Variável (eventual)'}
              </p>
            </div>
            <Select
              value={watchRecurrence}
              onValueChange={(v: 'fixed' | 'variable') => setValue('recurrence', v)}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="variable">Variável</SelectItem>
                <SelectItem value="fixed">Fixa</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {watchRecurrence === 'fixed' && (
            <div className="flex items-center justify-between py-2">
              <div className="space-y-0.5">
                <Label>Criar lembrete mensal</Label>
                <p className="text-sm text-muted-foreground">Receba aviso todo mês</p>
              </div>
              <Switch
                checked={watchIsRecurring}
                onCheckedChange={(v) => setValue('is_recurring', v)}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="notes">Observações (opcional)</Label>
            <Textarea
              id="notes"
              placeholder="Adicione notas ou detalhes..."
              {...register('notes')}
              rows={2}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={handleClose}>
              Cancelar
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={isLoading}
            >
              {isLoading ? <Loader2 className="animate-spin" /> : 'Salvar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}