import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const goalSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(50),
  target_amount: z.string().min(1, 'Valor é obrigatório'),
  current_amount: z.string().optional(),
  color: z.string(),
});

type FormData = z.infer<typeof goalSchema>;

const colors = [
  '#8B5CF6', // Purple
  '#3B82F6', // Blue
  '#22C55E', // Green
  '#EF4444', // Red
  '#F97316', // Orange
  '#EC4899', // Pink
  '#14B8A6', // Teal
  '#EAB308', // Yellow
];

interface GoalFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    target_amount: number;
    current_amount?: number;
    target_date?: string | null;
    color?: string;
  }) => void;
  isLoading?: boolean;
}

export default function GoalForm({ isOpen, onClose, onSubmit, isLoading }: GoalFormProps) {
  const [targetDate, setTargetDate] = useState<Date | undefined>();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(goalSchema),
    defaultValues: {
      name: '',
      target_amount: '',
      current_amount: '0',
      color: colors[0],
    },
  });

  const selectedColor = watch('color');

  const handleFormSubmit = (data: FormData) => {
    const targetAmount = parseFloat(data.target_amount.replace(/\./g, '').replace(',', '.'));
    const currentAmount = parseFloat((data.current_amount || '0').replace(/\./g, '').replace(',', '.')) || 0;

    if (targetAmount <= 0) return;

    onSubmit({
      name: data.name,
      target_amount: targetAmount,
      current_amount: currentAmount,
      target_date: targetDate ? format(targetDate, 'yyyy-MM-dd') : null,
      color: data.color,
    });

    reset();
    setTargetDate(undefined);
    onClose();
  };

  const handleClose = () => {
    reset();
    setTargetDate(undefined);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nova Meta de Economia</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome da meta</Label>
            <Input
              id="name"
              placeholder="Ex: Viagem, Carro novo, Reserva de emergência"
              {...register('name')}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="target_amount">Valor da meta (R$)</Label>
            <Input
              id="target_amount"
              placeholder="0,00"
              {...register('target_amount')}
            />
            {errors.target_amount && (
              <p className="text-sm text-destructive">{errors.target_amount.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="current_amount">Valor já guardado (R$)</Label>
            <Input
              id="current_amount"
              placeholder="0,00"
              {...register('current_amount')}
            />
          </div>

          <div className="space-y-2">
            <Label>Data limite (opcional)</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !targetDate && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {targetDate ? format(targetDate, 'dd/MM/yyyy') : 'Selecione uma data'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={targetDate}
                  onSelect={setTargetDate}
                  locale={ptBR}
                  disabled={(date) => date < new Date()}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
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
              {isLoading ? <Loader2 className="animate-spin" /> : 'Criar Meta'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}