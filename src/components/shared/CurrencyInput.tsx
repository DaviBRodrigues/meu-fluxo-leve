import { forwardRef, useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface CurrencyInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  value?: string;
  onChange?: (value: string) => void;
  prefix?: string;
}

export const CurrencyInput = forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ className, value = '', onChange, prefix = 'R$', ...props }, ref) => {
    const [displayValue, setDisplayValue] = useState('');

    useEffect(() => {
      if (value) {
        setDisplayValue(formatCurrencyInput(value));
      }
    }, [value]);

    const formatCurrencyInput = (input: string): string => {
      // Remove tudo exceto números
      const numbers = input.replace(/\D/g, '');
      
      if (!numbers) return '';

      // Converte para centavos e formata
      const cents = parseInt(numbers, 10);
      const reais = cents / 100;
      
      return reais.toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;
      const formatted = formatCurrencyInput(inputValue);
      setDisplayValue(formatted);
      
      // Retorna o valor numérico para o form
      if (onChange) {
        onChange(formatted);
      }
    };

    return (
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
          {prefix}
        </span>
        <Input
          ref={ref}
          type="text"
          inputMode="numeric"
          className={cn('pl-10', className)}
          value={displayValue}
          onChange={handleChange}
          {...props}
        />
      </div>
    );
  }
);

CurrencyInput.displayName = 'CurrencyInput';
