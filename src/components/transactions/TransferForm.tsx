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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CalendarIcon, Loader2, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAccounts } from '@/hooks/useAccounts';

const transferSchema = z.object({
  description: z.string().min(1, 'Descrição é obrigatória').max(100),
  amount: z.string().min(1, 'Valor é obrigatório'),
  date: z.date(),
  from_account_id: z.string().min(1, 'Conta de origem é obrigatória'),
  to_account_id: z.string().min(1, 'Conta de destino é obrigatória'),
  notes: z.string().max(500).optional(),
}).refine((data) => data.from_account_id !== data.to_account_id, {
  message: 'As contas devem ser diferentes',
  path: ['to_account_id'],
});

type FormData = z.infer<typeof transferSchema>;

interface TransferFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    from_account_id: string;
    to_account_id: string;
    amount: number;
    description: string;
    date: string;
    notes: string | null;
  }) => void;
  isLoading?: boolean;
}

export default function TransferForm({ isOpen, onClose, onSubmit, isLoading }: TransferFormProps) {
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
    resolver: zodResolver(transferSchema),
    defaultValues: {
      description: '',
      amount: '',
      date: new Date(),
      from_account_id: '',
      to_account_id: '',
      notes: '',
    },
  });

  const watchFromAccount = watch('from_account_id');

  const handleFormSubmit = (data: FormData) => {
    const amount = parseFloat(data.amount.replace(/\./g, '').replace(',', '.'));
    if (isNaN(amount) || amount <= 0) return;

    onSubmit({
      from_account_id: data.from_account_id,
      to_account_id: data.to_account_id,
      amount,
      description: data.description,
      date: format(data.date, 'yyyy-MM-dd'),
      notes: data.notes || null,
    });

    reset();
    onClose();
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const fromAccount = accounts.find(a => a.id === watchFromAccount);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowRight className="w-5 h-5 text-primary" />
            Nova Transferência
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Input
              id="description"
              placeholder="Ex: Transferência para poupança"
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

          {/* From/To Accounts */}
          <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-end">
            <div className="space-y-2">
              <Label>De</Label>
              <Select onValueChange={(v) => setValue('from_account_id', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Origem" />
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
              {errors.from_account_id && (
                <p className="text-sm text-destructive">{errors.from_account_id.message}</p>
              )}
            </div>

            <ArrowRight className="w-5 h-5 text-muted-foreground mb-2" />

            <div className="space-y-2">
              <Label>Para</Label>
              <Select onValueChange={(v) => setValue('to_account_id', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Destino" />
                </SelectTrigger>
                <SelectContent>
                  {accounts
                    .filter((a) => a.id !== watchFromAccount)
                    .map((account) => (
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
              {errors.to_account_id && (
                <p className="text-sm text-destructive">{errors.to_account_id.message}</p>
              )}
            </div>
          </div>

          {fromAccount && (
            <p className="text-sm text-muted-foreground">
              Saldo disponível: R$ {Number(fromAccount.balance).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
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
              {isLoading ? <Loader2 className="animate-spin" /> : 'Transferir'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
