import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';

type FilterPeriod = 'today' | 'week' | 'month' | 'all';

interface TransactionFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  period: FilterPeriod;
  onPeriodChange: (period: FilterPeriod) => void;
  compact?: boolean;
  onCompactChange?: (value: boolean) => void;
}

const periodLabels: Record<FilterPeriod, string> = {
  today: 'Hoje',
  week: 'Esta Semana',
  month: 'Este Mês',
  all: 'Todos',
};

export default function TransactionFilters({
  search,
  onSearchChange,
  period,
  onPeriodChange,
  compact,
  onCompactChange,
}: TransactionFiltersProps) {
  const periods: FilterPeriod[] = ['today', 'week', 'month', 'all'];

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      {/* Search */}
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por descrição..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Quick Filters */}
      <div className="flex items-center gap-3">
        <div className="flex gap-1 bg-muted/50 p-1 rounded-lg">
          {periods.map((p) => (
            <Button
              key={p}
              variant="ghost"
              size="sm"
              className={cn(
                'text-xs h-8 px-3',
                period === p && 'bg-background shadow-sm'
              )}
              onClick={() => onPeriodChange(p)}
            >
              {periodLabels[p]}
            </Button>
          ))}
        </div>

        {onCompactChange !== undefined && (
          <div className="flex items-center gap-2">
            <Switch
              checked={compact}
              onCheckedChange={onCompactChange}
              id="compact-view"
            />
            <label htmlFor="compact-view" className="text-xs text-muted-foreground cursor-pointer whitespace-nowrap">
              Compacto
            </label>
          </div>
        )}
      </div>
    </div>
  );
}

export type { FilterPeriod };
