import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useAccounts } from '@/hooks/useAccounts';
import { useCategories } from '@/hooks/useCategories';
import { useTransactions } from '@/hooks/useTransactions';
import { formatCurrency } from '@/lib/format';
import { toast } from 'sonner';
import { Upload, FileText, ArrowRight, Check, X, Loader2, AlertTriangle, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TransactionType } from '@/types/database';

interface ParsedRow {
  [key: string]: string;
}

interface MappedTransaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: TransactionType;
  selected: boolean;
  original: ParsedRow;
}

type ColumnMapping = {
  date: string;
  description: string;
  amount: string;
};

type ImportStep = 'upload' | 'mapping' | 'preview' | 'importing';

export default function ImportTransactions() {
  const [step, setStep] = useState<ImportStep>('upload');
  const [rawData, setRawData] = useState<ParsedRow[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<ColumnMapping>({ date: '', description: '', amount: '' });
  const [mappedTransactions, setMappedTransactions] = useState<MappedTransaction[]>([]);
  const [accountId, setAccountId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [defaultType, setDefaultType] = useState<TransactionType>('expense');
  const [isImporting, setIsImporting] = useState(false);
  const [fileName, setFileName] = useState('');

  const { accounts } = useAccounts();
  const { expenseCategories, incomeCategories } = useCategories(defaultType);
  const { createTransaction } = useTransactions();

  const allCategories = defaultType === 'expense' ? expenseCategories : incomeCategories;

  const parseCSV = (text: string): { headers: string[]; rows: ParsedRow[] } => {
    const lines = text.trim().split('\n');
    if (lines.length < 2) return { headers: [], rows: [] };

    // Detect separator
    const firstLine = lines[0];
    const separator = firstLine.includes(';') ? ';' : ',';

    const csvHeaders = firstLine.split(separator).map(h => h.trim().replace(/^"|"$/g, ''));
    const rows = lines.slice(1).map(line => {
      const values = line.split(separator).map(v => v.trim().replace(/^"|"$/g, ''));
      const row: ParsedRow = {};
      csvHeaders.forEach((header, i) => {
        row[header] = values[i] || '';
      });
      return row;
    }).filter(row => Object.values(row).some(v => v !== ''));

    return { headers: csvHeaders, rows };
  };

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      toast.error('Por favor, selecione um arquivo CSV');
      return;
    }

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const { headers: h, rows } = parseCSV(text);
      if (h.length === 0) {
        toast.error('Arquivo CSV vazio ou inválido');
        return;
      }
      setHeaders(h);
      setRawData(rows);

      // Auto-detect mapping
      const autoMapping: ColumnMapping = { date: '', description: '', amount: '' };
      h.forEach(header => {
        const lower = header.toLowerCase();
        if (lower.includes('data') || lower.includes('date')) autoMapping.date = header;
        if (lower.includes('descri') || lower.includes('desc') || lower.includes('memo')) autoMapping.description = header;
        if (lower.includes('valor') || lower.includes('amount') || lower.includes('value')) autoMapping.amount = header;
      });
      setMapping(autoMapping);
      setStep('mapping');
      toast.success(`${rows.length} linhas encontradas no arquivo`);
    };
    reader.readAsText(file, 'UTF-8');
  }, []);

  const parseAmount = (value: string): number => {
    // Handle Brazilian format: 1.234,56 or -1.234,56
    let cleaned = value.replace(/[^\d,.\-]/g, '');
    if (cleaned.includes(',') && cleaned.includes('.')) {
      // 1.234,56 format
      cleaned = cleaned.replace(/\./g, '').replace(',', '.');
    } else if (cleaned.includes(',')) {
      cleaned = cleaned.replace(',', '.');
    }
    return Math.abs(parseFloat(cleaned) || 0);
  };

  const detectType = (value: string): TransactionType => {
    const cleaned = value.replace(/[^\d,.\-]/g, '');
    return cleaned.startsWith('-') ? 'expense' : defaultType;
  };

  const handleApplyMapping = () => {
    if (!mapping.date || !mapping.description || !mapping.amount) {
      toast.error('Mapeie todas as colunas obrigatórias');
      return;
    }

    const mapped: MappedTransaction[] = rawData.map((row, i) => {
      const rawAmount = row[mapping.amount] || '0';
      return {
        id: `import-${i}`,
        date: parseDate(row[mapping.date] || ''),
        description: row[mapping.description] || '',
        amount: parseAmount(rawAmount),
        type: detectType(rawAmount),
        selected: true,
        original: row,
      };
    }).filter(t => t.amount > 0 && t.description);

    setMappedTransactions(mapped);
    setStep('preview');
  };

  const parseDate = (dateStr: string): string => {
    // Try dd/MM/yyyy
    const brMatch = dateStr.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})$/);
    if (brMatch) {
      return `${brMatch[3]}-${brMatch[2].padStart(2, '0')}-${brMatch[1].padStart(2, '0')}`;
    }
    // Try yyyy-MM-dd
    const isoMatch = dateStr.match(/^(\d{4})[/\-.](\d{1,2})[/\-.](\d{1,2})$/);
    if (isoMatch) {
      return `${isoMatch[1]}-${isoMatch[2].padStart(2, '0')}-${isoMatch[3].padStart(2, '0')}`;
    }
    // Fallback to today
    return new Date().toISOString().split('T')[0];
  };

  const toggleTransaction = (id: string) => {
    setMappedTransactions(prev =>
      prev.map(t => t.id === id ? { ...t, selected: !t.selected } : t)
    );
  };

  const toggleAll = (selected: boolean) => {
    setMappedTransactions(prev => prev.map(t => ({ ...t, selected })));
  };

  const handleImport = async () => {
    if (!accountId || !categoryId) {
      toast.error('Selecione a conta e a categoria');
      return;
    }

    const selected = mappedTransactions.filter(t => t.selected);
    if (selected.length === 0) {
      toast.error('Selecione pelo menos uma transação');
      return;
    }

    setIsImporting(true);
    setStep('importing');
    let success = 0;
    let errors = 0;

    for (const transaction of selected) {
      try {
        await createTransaction.mutateAsync({
          account_id: accountId,
          category_id: categoryId,
          type: transaction.type,
          amount: transaction.amount,
          description: transaction.description,
          date: transaction.date,
          recurrence: 'variable',
          is_recurring: false,
        });
        success++;
      } catch {
        errors++;
      }
    }

    setIsImporting(false);

    if (errors === 0) {
      toast.success(`${success} transações importadas com sucesso!`);
    } else {
      toast.warning(`${success} importadas, ${errors} com erro`);
    }

    // Reset
    setStep('upload');
    setRawData([]);
    setMappedTransactions([]);
    setFileName('');
  };

  const handleReset = () => {
    setStep('upload');
    setRawData([]);
    setHeaders([]);
    setMapping({ date: '', description: '', amount: '' });
    setMappedTransactions([]);
    setFileName('');
  };

  const selectedCount = mappedTransactions.filter(t => t.selected).length;
  const selectedTotal = mappedTransactions.filter(t => t.selected).reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="space-y-6">
      {/* Steps indicator */}
      <div className="flex items-center gap-2 text-sm">
        {['Upload', 'Mapeamento', 'Pré-visualização'].map((label, i) => {
          const stepIndex = ['upload', 'mapping', 'preview'].indexOf(step);
          const isActive = i === stepIndex;
          const isDone = i < stepIndex;
          return (
            <div key={label} className="flex items-center gap-2">
              {i > 0 && <ArrowRight className="w-4 h-4 text-muted-foreground" />}
              <Badge variant={isActive ? 'default' : isDone ? 'secondary' : 'outline'}>
                {isDone ? <Check className="w-3 h-3 mr-1" /> : null}
                {label}
              </Badge>
            </div>
          );
        })}
      </div>

      {/* Step 1: Upload */}
      {step === 'upload' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Upload className="w-5 h-5 text-primary" />
              Importar Arquivo CSV
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary/50 transition-colors">
              <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">
                Arraste um arquivo CSV ou clique para selecionar
              </p>
              <p className="text-xs text-muted-foreground mb-4">
                Formatos aceitos: CSV (separado por vírgula ou ponto-e-vírgula)
              </p>
              <label>
                <Input
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={handleFileUpload}
                />
                <Button type="button" asChild>
                  <span>Selecionar Arquivo</span>
                </Button>
              </label>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Column Mapping */}
      {step === 'mapping' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center justify-between">
              <span className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Mapear Colunas — {fileName}
              </span>
              <Button variant="ghost" size="sm" onClick={handleReset}>
                <X className="w-4 h-4 mr-1" />
                Cancelar
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Indique qual coluna do seu arquivo corresponde a cada campo:
            </p>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label>📅 Data *</Label>
                <Select value={mapping.date} onValueChange={(v) => setMapping(m => ({ ...m, date: v }))}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {headers.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>📝 Descrição *</Label>
                <Select value={mapping.description} onValueChange={(v) => setMapping(m => ({ ...m, description: v }))}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {headers.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>💰 Valor *</Label>
                <Select value={mapping.amount} onValueChange={(v) => setMapping(m => ({ ...m, amount: v }))}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {headers.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Preview of raw data */}
            <div className="mt-4">
              <p className="text-sm font-medium mb-2">Prévia dos dados ({rawData.length} linhas)</p>
              <div className="overflow-auto max-h-48 border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {headers.map(h => <TableHead key={h} className="text-xs whitespace-nowrap">{h}</TableHead>)}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rawData.slice(0, 5).map((row, i) => (
                      <TableRow key={i}>
                        {headers.map(h => <TableCell key={h} className="text-xs">{row[h]}</TableCell>)}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {rawData.length > 5 && (
                <p className="text-xs text-muted-foreground mt-1">Mostrando 5 de {rawData.length}</p>
              )}
            </div>

            <div className="flex justify-end">
              <Button onClick={handleApplyMapping}>
                Aplicar mapeamento
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Preview & Import */}
      {step === 'preview' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Check className="w-5 h-5 text-primary" />
                Confirmar Importação
              </span>
              <Button variant="ghost" size="sm" onClick={handleReset}>
                <X className="w-4 h-4 mr-1" />
                Cancelar
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Config selectors */}
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label>🏦 Conta destino *</Label>
                <Select value={accountId} onValueChange={setAccountId}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {accounts.map(a => (
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
              <div className="space-y-2">
                <Label>🏷️ Categoria *</Label>
                <Select value={categoryId} onValueChange={setCategoryId}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {allCategories.map(c => (
                      <SelectItem key={c.id} value={c.id}>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: c.color }} />
                          {c.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>📊 Tipo padrão</Label>
                <Select value={defaultType} onValueChange={(v) => setDefaultType(v as TransactionType)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="expense">Despesa</SelectItem>
                    <SelectItem value="income">Receita</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Summary */}
            <div className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg text-sm">
              <span>{selectedCount} de {mappedTransactions.length} selecionadas</span>
              <span className="text-muted-foreground">|</span>
              <span className="font-medium">Total: {formatCurrency(selectedTotal)}</span>
              <div className="ml-auto flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => toggleAll(true)}>Selecionar todas</Button>
                <Button variant="ghost" size="sm" onClick={() => toggleAll(false)}>Limpar seleção</Button>
              </div>
            </div>

            {/* Transaction table */}
            <div className="overflow-auto max-h-96 border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10"></TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead>Tipo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mappedTransactions.map(t => (
                    <TableRow key={t.id} className={cn(!t.selected && 'opacity-40')}>
                      <TableCell>
                        <Checkbox
                          checked={t.selected}
                          onCheckedChange={() => toggleTransaction(t.id)}
                        />
                      </TableCell>
                      <TableCell className="text-sm">{t.date}</TableCell>
                      <TableCell className="text-sm max-w-[200px] truncate">{t.description}</TableCell>
                      <TableCell className="text-sm text-right font-medium">{formatCurrency(t.amount)}</TableCell>
                      <TableCell>
                        <Badge variant={t.type === 'income' ? 'default' : 'destructive'} className="text-xs">
                          {t.type === 'income' ? 'Receita' : 'Despesa'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setStep('mapping')}>Voltar</Button>
              <Button onClick={handleImport} disabled={selectedCount === 0 || !accountId || !categoryId}>
                <Upload className="w-4 h-4 mr-2" />
                Importar {selectedCount} transações
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Importing state */}
      {step === 'importing' && (
        <Card>
          <CardContent className="p-12 text-center">
            <Loader2 className="w-12 h-12 mx-auto animate-spin text-primary mb-4" />
            <p className="text-lg font-medium">Importando transações...</p>
            <p className="text-sm text-muted-foreground mt-1">Isso pode levar alguns segundos</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
