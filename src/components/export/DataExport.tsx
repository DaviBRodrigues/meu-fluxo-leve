import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Download, FileSpreadsheet, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { getMonthName } from '@/lib/format';

type ExportType = 'transactions' | 'accounts' | 'budgets' | 'investments' | 'goals' | 'all';

const exportOptions: { value: ExportType; label: string; description: string }[] = [
  { value: 'transactions', label: 'Transações', description: 'Receitas, despesas e transferências' },
  { value: 'accounts', label: 'Contas', description: 'Saldos e informações das contas' },
  { value: 'budgets', label: 'Orçamentos', description: 'Limites por categoria' },
  { value: 'investments', label: 'Investimentos', description: 'Carteira de investimentos' },
  { value: 'goals', label: 'Metas', description: 'Metas de economia' },
  { value: 'all', label: 'Tudo', description: 'Exportar todos os dados de uma vez' },
];

function downloadCSV(content: string, filename: string) {
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function escapeCSV(value: any): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function arrayToCSV(headers: string[], rows: any[][]): string {
  const headerLine = headers.map(escapeCSV).join(',');
  const dataLines = rows.map(row => row.map(escapeCSV).join(','));
  return [headerLine, ...dataLines].join('\n');
}

export default function DataExport() {
  const { user } = useAuth();
  const [selectedType, setSelectedType] = useState<ExportType>('transactions');
  const [isExporting, setIsExporting] = useState(false);
  const [selectedYear, setSelectedYear] = useState(String(new Date().getFullYear()));
  const [filterByYear, setFilterByYear] = useState(true);

  const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i);

  const exportTransactions = async () => {
    let query = supabase
      .from('transactions')
      .select('*, category:categories(name), account:accounts(name)')
      .eq('user_id', user!.id)
      .order('date', { ascending: false });

    if (filterByYear) {
      query = query
        .gte('date', `${selectedYear}-01-01`)
        .lte('date', `${selectedYear}-12-31`);
    }

    const { data, error } = await query;
    if (error) throw error;
    if (!data || data.length === 0) {
      toast.info('Nenhuma transação encontrada para exportar');
      return;
    }

    const headers = ['Data', 'Tipo', 'Descrição', 'Valor', 'Categoria', 'Conta', 'Recorrente', 'Parcelado', 'Parcela', 'Notas'];
    const rows = data.map(t => [
      t.date,
      t.type === 'income' ? 'Receita' : 'Despesa',
      t.description,
      Number(t.amount).toFixed(2).replace('.', ','),
      (t.category as any)?.name || '',
      (t.account as any)?.name || '',
      t.is_recurring ? 'Sim' : 'Não',
      t.is_installment ? `Sim (${t.installment_number}/${t.installment_count})` : 'Não',
      t.installment_number ? `${t.installment_number}/${t.installment_count}` : '',
      t.notes || '',
    ]);

    const suffix = filterByYear ? `_${selectedYear}` : '_completo';
    downloadCSV(arrayToCSV(headers, rows), `transacoes${suffix}.csv`);
    toast.success(`${data.length} transações exportadas!`);
  };

  const exportAccounts = async () => {
    const { data, error } = await supabase
      .from('accounts')
      .select('*')
      .eq('user_id', user!.id)
      .eq('is_active', true)
      .order('name');

    if (error) throw error;
    if (!data || data.length === 0) {
      toast.info('Nenhuma conta encontrada');
      return;
    }

    const typeMap: Record<string, string> = {
      checking: 'Conta Corrente', savings: 'Poupança', credit: 'Cartão de Crédito',
      investment: 'Investimento', cash: 'Dinheiro', other: 'Outro',
    };

    const headers = ['Nome', 'Tipo', 'Saldo'];
    const rows = data.map(a => [
      a.name,
      typeMap[a.type] || a.type,
      Number(a.balance).toFixed(2).replace('.', ','),
    ]);

    downloadCSV(arrayToCSV(headers, rows), 'contas.csv');
    toast.success(`${data.length} contas exportadas!`);
  };

  const exportBudgets = async () => {
    const { data, error } = await supabase
      .from('budgets')
      .select('*, category:categories(name)')
      .eq('user_id', user!.id)
      .order('year', { ascending: false })
      .order('month', { ascending: false });

    if (error) throw error;
    if (!data || data.length === 0) {
      toast.info('Nenhum orçamento encontrado');
      return;
    }

    const headers = ['Mês', 'Ano', 'Categoria', 'Limite'];
    const rows = data.map(b => [
      getMonthName(b.month),
      b.year,
      (b.category as any)?.name || '',
      Number(b.amount).toFixed(2).replace('.', ','),
    ]);

    downloadCSV(arrayToCSV(headers, rows), 'orcamentos.csv');
    toast.success(`${data.length} orçamentos exportados!`);
  };

  const exportInvestments = async () => {
    const { data, error } = await supabase
      .from('investments')
      .select('*, category:investment_categories(name)')
      .eq('user_id', user!.id)
      .order('name');

    if (error) throw error;
    if (!data || data.length === 0) {
      toast.info('Nenhum investimento encontrado');
      return;
    }

    const headers = ['Nome', 'Categoria', 'Valor Inicial', 'Valor Atual', 'Meta', 'Notas'];
    const rows = data.map(inv => [
      inv.name,
      (inv.category as any)?.name || '',
      Number(inv.initial_amount).toFixed(2).replace('.', ','),
      Number(inv.current_amount).toFixed(2).replace('.', ','),
      inv.target_amount ? Number(inv.target_amount).toFixed(2).replace('.', ',') : '',
      inv.notes || '',
    ]);

    downloadCSV(arrayToCSV(headers, rows), 'investimentos.csv');
    toast.success(`${data.length} investimentos exportados!`);
  };

  const exportGoals = async () => {
    const { data, error } = await supabase
      .from('savings_goals')
      .select('*')
      .eq('user_id', user!.id)
      .order('name');

    if (error) throw error;
    if (!data || data.length === 0) {
      toast.info('Nenhuma meta encontrada');
      return;
    }

    const headers = ['Nome', 'Valor Atual', 'Meta', 'Progresso (%)', 'Data Alvo', 'Concluída'];
    const rows = data.map(g => [
      g.name,
      Number(g.current_amount).toFixed(2).replace('.', ','),
      Number(g.target_amount).toFixed(2).replace('.', ','),
      ((Number(g.current_amount) / Number(g.target_amount)) * 100).toFixed(1).replace('.', ','),
      g.target_date || '',
      g.is_completed ? 'Sim' : 'Não',
    ]);

    downloadCSV(arrayToCSV(headers, rows), 'metas.csv');
    toast.success(`${data.length} metas exportadas!`);
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      if (selectedType === 'all') {
        await exportTransactions();
        await exportAccounts();
        await exportBudgets();
        await exportInvestments();
        await exportGoals();
        toast.success('Todos os dados exportados!');
      } else {
        const exporters: Record<ExportType, () => Promise<void>> = {
          transactions: exportTransactions,
          accounts: exportAccounts,
          budgets: exportBudgets,
          investments: exportInvestments,
          goals: exportGoals,
          all: async () => {},
        };
        await exporters[selectedType]();
      }
    } catch (err) {
      console.error('Export error:', err);
      toast.error('Erro ao exportar dados');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSpreadsheet className="w-5 h-5 text-primary" />
          Exportar Dados
        </CardTitle>
        <CardDescription>
          Baixe seus dados financeiros em formato CSV para usar em planilhas
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>O que exportar?</Label>
          <Select value={selectedType} onValueChange={(v) => setSelectedType(v as ExportType)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {exportOptions.map(opt => (
                <SelectItem key={opt.value} value={opt.value}>
                  <div className="flex flex-col">
                    <span>{opt.label}</span>
                    <span className="text-xs text-muted-foreground">{opt.description}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {(selectedType === 'transactions' || selectedType === 'all') && (
          <div className="space-y-3 p-3 rounded-lg border bg-muted/30">
            <div className="flex items-center gap-2">
              <Checkbox
                id="filterYear"
                checked={filterByYear}
                onCheckedChange={(v) => setFilterByYear(!!v)}
              />
              <Label htmlFor="filterYear" className="text-sm cursor-pointer">
                Filtrar transações por ano
              </Label>
            </div>
            {filterByYear && (
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map(y => (
                    <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        )}

        <Button onClick={handleExport} disabled={isExporting} className="w-full">
          {isExporting ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Download className="w-4 h-4 mr-2" />
          )}
          {isExporting ? 'Exportando...' : 'Exportar CSV'}
        </Button>

        <p className="text-xs text-muted-foreground text-center">
          Os arquivos CSV podem ser abertos no Excel, Google Sheets ou qualquer editor de planilhas
        </p>
      </CardContent>
    </Card>
  );
}
