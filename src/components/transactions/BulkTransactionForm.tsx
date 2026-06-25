import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { CurrencyInput } from '@/components/shared/CurrencyInput';
import { CalendarIcon, Plus, Trash2, Loader2, Table as TableIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCategories } from '@/hooks/useCategories';
import { useAccounts } from '@/hooks/useAccounts';
import { TransactionType } from '@/types/database';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/format';

interface BulkRow {
  id: string;
  description: string;
  category_id: string;
  amount: string;
}

interface BulkTransactionFormProps {
  isOpen: boolean;
  onClose: () => void;
  defaultType?: TransactionType;
  onSubmit: (transaction: {
    account_id: string;
    category_id: string;
    type: TransactionType;
    amount: number;
    description: string;
    date: string;
    recurrence: 'fixed' | 'variable';
    is_recurring: boolean;
    notes: string | null;
  }) => Promise<unknown> | unknown;
}

const newRow = (): BulkRow => ({
  id: crypto.randomUUID(),
  description: '',
  category_id: '',
  amount: '',
});

export default function BulkTransactionForm({
  isOpen,
  onClose,
  defaultType = 'expense',
  onSubmit,
}: BulkTransactionFormProps) {
  const [type, setType] = useState<TransactionType>(defaultType);
  const [date, setDate] = useState<Date>(new Date());
  const [accountId, setAccountId] = useState<string>('');
  const [rows, setRows] = useState<BulkRow[]>([newRow(), newRow(), newRow()]);
  const [isSaving, setIsSaving] = useState(false);

  const { accounts } = useAccounts();
  const { categories } = useCategories(type);

  // Flat list of categories (parents + subcategories with prefix)
  const categoryOptions = useMemo(() => {
    const parents = categories.filter((c) => !c.parent_id);
    const result: { id: string; label: string; color: string }[] = [];
    for (const p of parents) {
      result.push({ id: p.id, label: p.name, color: p.color });
      const subs = categories.filter((c) => c.parent_id === p.id);
      for (const s of subs) {
        result.push({ id: s.id, label: `  ↳ ${s.name}`, color: s.color });
      }
    }
    return result;
  }, [categories]);

  const updateRow = (id: string, patch: Partial<BulkRow>) => {
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  };

  const removeRow = (id: string) => {
    setRows((rs) => (rs.length > 1 ? rs.filter((r) => r.id !== id) : rs));
  };

  const addRow = () => setRows((rs) => [...rs, newRow()]);

  const parseAmount = (v: string) => parseFloat(v.replace(/\./g, '').replace(',', '.'));

  const validRows = rows.filter((r) => {
    const amt = parseAmount(r.amount);
    return r.description.trim() && r.category_id && !isNaN(amt) && amt > 0;
  });

  const total = validRows.reduce((sum, r) => sum + parseAmount(r.amount), 0);

  const handleSaveAll = async () => {
    if (!accountId) {
      toast.error('Selecione uma conta');
      return;
    }
    if (validRows.length === 0) {
      toast.error('Preencha ao menos uma linha completa');
      return;
    }

    setIsSaving(true);
    const dateStr = format(date, 'yyyy-MM-dd');
    let success = 0;
    let failed = 0;

    // Sequential to keep balance RPC consistent
    for (const row of validRows) {
      try {
        await onSubmit({
          account_id: accountId,
          category_id: row.category_id,
          type,
          amount: parseAmount(row.amount),
          description: row.description.trim(),
          date: dateStr,
          recurrence: 'variable',
          is_recurring: false,
          notes: null,
        });
        success++;
      } catch (e) {
        failed++;
      }
    }

    setIsSaving(false);

    if (success > 0) {
      toast.success(
        `${success} ${type === 'income' ? 'receita(s)' : 'despesa(s)'} adicionada(s)${
          failed > 0 ? ` • ${failed} falharam` : ''
        }`
      );
      // Reset for next batch
      setRows([newRow(), newRow(), newRow()]);
      onClose();
    } else {
      toast.error('Não foi possível salvar as transações');
    }
  };

  const handleClose = () => {
    if (isSaving) return;
    setRows([newRow(), newRow(), newRow()]);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TableIcon className="w-5 h-5" />
            Lançamento em lote
          </DialogTitle>
          <DialogDescription>
            Adicione várias transações de uma vez. Conta e data são aplicadas a todas as linhas.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Top controls */}
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label>Tipo</Label>
              <ToggleGroup
                type="single"
                value={type}
                onValueChange={(v) => v && setType(v as TransactionType)}
                className="justify-start"
              >
                <ToggleGroupItem value="expense" className="data-[state=on]:bg-expense data-[state=on]:text-white">
                  Despesas
                </ToggleGroupItem>
                <ToggleGroupItem value="income" className="data-[state=on]:bg-income data-[state=on]:text-white">
                  Receitas
                </ToggleGroupItem>
              </ToggleGroup>
            </div>

            <div className="space-y-1.5">
              <Label>Conta (para todas)</Label>
              <Select value={accountId} onValueChange={setAccountId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a conta" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.filter((a) => a.is_active).map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: a.color }} />
                        {a.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Data (para todas)</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(date, 'dd/MM/yyyy')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(d) => d && setDate(d)}
                    locale={ptBR}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Spreadsheet */}
          <div className="border border-border rounded-lg overflow-hidden">
            <div className="grid grid-cols-[1fr_180px_140px_40px] gap-2 px-3 py-2 bg-muted/50 text-xs font-medium text-muted-foreground">
              <div>Descrição</div>
              <div>Categoria</div>
              <div className="text-right">Valor</div>
              <div></div>
            </div>
            <div className="divide-y divide-border">
              {rows.map((row, idx) => (
                <div
                  key={row.id}
                  className="grid grid-cols-[1fr_180px_140px_40px] gap-2 px-2 py-1.5 items-center hover:bg-muted/30"
                >
                  <Input
                    value={row.description}
                    onChange={(e) => updateRow(row.id, { description: e.target.value })}
                    placeholder={`Item ${idx + 1}`}
                    className="h-9 border-0 shadow-none focus-visible:ring-1 bg-transparent"
                  />
                  <Select
                    value={row.category_id}
                    onValueChange={(v) => updateRow(row.id, { category_id: v })}
                  >
                    <SelectTrigger className="h-9 border-0 shadow-none focus:ring-1 bg-transparent">
                      <SelectValue placeholder="Categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {categoryOptions.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
                            <span className="whitespace-pre">{c.label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <CurrencyInput
                    value={row.amount}
                    onChange={(value) => updateRow(row.id, { amount: value })}
                    placeholder="0,00"
                    className="h-9 border-0 shadow-none focus-visible:ring-1 bg-transparent text-right tabular-nums"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => removeRow(row.id)}
                    disabled={rows.length === 1}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
            <div className="px-3 py-2 bg-muted/30 flex items-center justify-between">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={addRow}
                className="h-8 text-xs"
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                Adicionar linha
              </Button>
              <div className="text-sm">
                <span className="text-muted-foreground mr-2">
                  {validRows.length} de {rows.length} válidas
                </span>
                <span
                  className={cn(
                    'font-semibold tabular-nums',
                    type === 'income' ? 'text-income' : 'text-expense'
                  )}
                >
                  Total: {formatCurrency(total)}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            <Button type="button" variant="outline" className="sm:flex-1" onClick={handleClose} disabled={isSaving}>
              Cancelar
            </Button>
            <Button
              type="button"
              className={cn(
                'sm:flex-1 text-white',
                type === 'income' ? 'bg-income hover:bg-income/90' : 'bg-expense hover:bg-expense/90'
              )}
              onClick={handleSaveAll}
              disabled={isSaving || validRows.length === 0 || !accountId}
            >
              {isSaving ? (
                <Loader2 className="animate-spin w-4 h-4 mr-2" />
              ) : (
                <Plus className="w-4 h-4 mr-2" />
              )}
              Salvar {validRows.length > 0 ? `${validRows.length} ${validRows.length === 1 ? 'transação' : 'transações'}` : 'tudo'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
