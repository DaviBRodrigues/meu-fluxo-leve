import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { Account } from '@/types/database';

const accountSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(50),
  type: z.string().min(1, 'Tipo é obrigatório'),
  balance: z.string(),
  color: z.string(),
});

type FormData = z.infer<typeof accountSchema>;

const accountTypes = [
  { value: 'checking', label: 'Conta Corrente' },
  { value: 'savings', label: 'Poupança' },
  { value: 'credit_card', label: 'Cartão de Crédito' },
  { value: 'cash', label: 'Dinheiro' },
  { value: 'investment', label: 'Investimento' },
];

const colors = [
  '#3B82F6', // Blue
  '#22C55E', // Green
  '#EF4444', // Red
  '#F97316', // Orange
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#14B8A6', // Teal
  '#EAB308', // Yellow
];

interface AccountFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<Account, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => void;
  isLoading?: boolean;
  editAccount?: Account | null;
}

export default function AccountForm({ isOpen, onClose, onSubmit, isLoading, editAccount }: AccountFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(accountSchema),
    defaultValues: editAccount
      ? {
          name: editAccount.name,
          type: editAccount.type,
          balance: String(editAccount.balance),
          color: editAccount.color,
        }
      : {
          name: '',
          type: 'checking',
          balance: '0',
          color: colors[0],
        },
  });

  const selectedColor = watch('color');

  const handleFormSubmit = (data: FormData) => {
    const balance = parseFloat(data.balance.replace(/\./g, '').replace(',', '.')) || 0;

    onSubmit({
      name: data.name,
      type: data.type,
      balance,
      color: data.color,
      icon: 'wallet',
      is_active: true,
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
          <DialogTitle>{editAccount ? 'Editar Conta' : 'Nova Conta'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome da conta</Label>
            <Input
              id="name"
              placeholder="Ex: Nubank, Itaú, Carteira"
              {...register('name')}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Tipo de conta</Label>
            <Select
              defaultValue={editAccount?.type || 'checking'}
              onValueChange={(v) => setValue('type', v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {accountTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="balance">Saldo inicial (R$)</Label>
            <Input
              id="balance"
              placeholder="0,00"
              {...register('balance')}
            />
          </div>

          <div className="space-y-2">
            <Label>Cor</Label>
            <div className="flex gap-2 flex-wrap">
              {colors.map((color) => (
                <button
                  key={color}
                  type="button"
                  className={`w-8 h-8 rounded-lg transition-all ${
                    selectedColor === color ? 'ring-2 ring-offset-2 ring-primary' : ''
                  }`}
                  style={{ backgroundColor: color }}
                  onClick={() => setValue('color', color)}
                />
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={handleClose}>
              Cancelar
            </Button>
            <Button type="submit" className="flex-1" disabled={isLoading}>
              {isLoading ? <Loader2 className="animate-spin" /> : 'Salvar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}