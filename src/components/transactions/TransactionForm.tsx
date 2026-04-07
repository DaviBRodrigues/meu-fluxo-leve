import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format, addMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CurrencyInput } from '@/components/shared/CurrencyInput';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCategories } from '@/hooks/useCategories';
import { useAccounts } from '@/hooks/useAccounts';
import { TransactionType } from '@/types/database';
import { Input } from '@/components/ui/input';

const transactionSchema = z.object({
  description: z.string().min(1, 'Descrição é obrigatória').max(100),
  amount: z.string().min(1, 'Valor é obrigatório'),
  date: z.date(),
  category_id: z.string().min(1, 'Categoria é obrigatória'),
  account_id: z.string().min(1, 'Conta é obrigatória'),
  recurrence: z.enum(['fixed', 'variable']),
  is_recurring: z.boolean(),
  is_installment: z.boolean(),
  installment_count: z.number().min(2).max(120).optional(),
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
    is_installment?: boolean;
    installment_count?: number;
    notes: string | null;
  }) => void;
  isLoading?: boolean;
}

export default function TransactionForm({ type, isOpen, onClose, onSubmit, isLoading }: TransactionFormProps) {
  const { categories, getSubcategories } = useCategories(type);
  const parentCategories = categories.filter(c => !c.parent_id);
  const { accounts } = useAccounts();
  const [date, setDate] = useState<Date>(new Date());
  const [selectedParentId, setSelectedParentId] = useState<string>('');
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
      is_installment: false,
      installment_count: undefined,
      notes: '',
    },
  });

  const watchRecurrence = watch('recurrence');
  const watchIsRecurring = watch('is_recurring');
  const watchIsInstallment = watch('is_installment');
  const watchInstallmentCount = watch('installment_count');

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
      is_installment: data.is_installment,
      installment_count: data.is_installment ? data.installment_count : undefined,
      notes: data.notes || null,
    });

    reset();
    setDate(new Date());
    onClose();
  };

  const handleClose = () => {
    reset();
    setDate(new Date());
    setSelectedParentId('');
    onClose();
  };

  const subcategories = selectedParentId ? getSubcategories(selectedParentId) : [];

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
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
            <Label htmlFor="amount">Valor {watchIsInstallment && watchInstallmentCount ? `(total: será dividido em ${watchInstallmentCount}x)` : ''}</Label>
            <CurrencyInput
              id="amount"
              placeholder="0,00"
              value={watch('amount')}
              onChange={(value) => setValue('amount', value)}
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
              <Select onValueChange={(v) => {
                setSelectedParentId(v);
                // If this category has no subcategories, set it directly
                const subs = getSubcategories(v);
                if (subs.length === 0) {
                  setValue('category_id', v);
                } else {
                  setValue('category_id', '');
                }
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {parentCategories.map((category) => (
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

          {/* Subcategory selector */}
          {subcategories.length > 0 && (
            <div className="space-y-2">
              <Label>Subcategoria</Label>
              <Select onValueChange={(v) => setValue('category_id', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a subcategoria" />
                </SelectTrigger>
                <SelectContent>
                  {subcategories.map((sub) => (
                    <SelectItem key={sub.id} value={sub.id}>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: sub.color }}
                        />
                        {sub.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

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
              <Label>Tipo de {type === 'income' ? 'receita' : 'despesa'}</Label>
              <p className="text-sm text-muted-foreground">
                {watchRecurrence === 'fixed' ? 'Fixa (recorrente)' : 'Variável (eventual)'}
              </p>
            </div>
            <Select
              value={watchRecurrence}
              onValueChange={(v: 'fixed' | 'variable') => {
                setValue('recurrence', v);
                if (v === 'variable') {
                  setValue('is_recurring', false);
                }
              }}
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

          {/* Parcelamento */}
          {type === 'expense' && (
            <div className="border border-border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Parcelamento</Label>
                  <p className="text-sm text-muted-foreground">Dividir em parcelas mensais</p>
                </div>
                <Switch
                  checked={watchIsInstallment}
                  onCheckedChange={(v) => {
                    setValue('is_installment', v);
                    if (!v) setValue('installment_count', undefined);
                    else setValue('installment_count', 2);
                  }}
                />
              </div>

              {watchIsInstallment && (
                <div className="space-y-2">
                  <Label>Número de parcelas</Label>
                  <Input
                    type="number"
                    min={2}
                    max={120}
                    value={watchInstallmentCount || ''}
                    onChange={(e) => setValue('installment_count', parseInt(e.target.value) || 2)}
                    placeholder="Ex: 12"
                  />
                  {watchInstallmentCount && watch('amount') && (
                    <p className="text-sm text-muted-foreground">
                      {watchInstallmentCount}x de R$ {(parseFloat(watch('amount').replace(/\./g, '').replace(',', '.')) / watchInstallmentCount).toFixed(2).replace('.', ',')}
                    </p>
                  )}
                </div>
              )}
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
