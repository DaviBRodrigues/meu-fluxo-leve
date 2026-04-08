import { useState, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import Papa from 'papaparse';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Upload, FileSpreadsheet, Loader2, Trash2, AlertCircle, Check } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useAccounts } from '@/hooks/useAccounts';
import { useCategories } from '@/hooks/useCategories';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/format';
import { TransactionType } from '@/types/database';
import { cn } from '@/lib/utils';

interface ImportTransactionsProps {
  isOpen: boolean;
  onClose: () => void;
  type: TransactionType;
  onSuccess: () => void;
}

type Step = 'upload' | 'mapping' | 'preview';

interface ParsedRow {
  [key: string]: string;
}

interface MappedTransaction {
  date: string;
  description: string;
  amount: number;
  selected: boolean;
  categoryId: string;
  original: ParsedRow;
}

export default function ImportTransactions({ isOpen, onClose, type, onSuccess }: ImportTransactionsProps) {
  const { user } = useAuth();
  const { accounts } = useAccounts();
  const { categories } = useCategories(type);
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>('upload');
  const [rawData, setRawData] = useState<ParsedRow[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [dateColumn, setDateColumn] = useState('');
  const [descriptionColumn, setDescriptionColumn] = useState('');
  const [amountColumn, setAmountColumn] = useState('');
  const [accountId, setAccountId] = useState('');
  const [defaultCategoryId, setDefaultCategoryId] = useState('');
  const [mappedRows, setMappedRows] = useState<MappedTransaction[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [fileName, setFileName] = useState('');

  const reset = () => {
    setStep('upload');
    setRawData([]);
    setHeaders([]);
    setDateColumn('');
    setDescriptionColumn('');
    setAmountColumn('');
    setAccountId('');
    setDefaultCategoryId('');
    setMappedRows([]);
    setFileName('');
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      toast.error('Apenas arquivos CSV são aceitos');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Arquivo muito grande (máx 5MB)');
      return;
    }

    setFileName(file.name);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      encoding: 'UTF-8',
      complete: (results) => {
        if (results.errors.length > 0) {
          toast.error('Erro ao ler o arquivo CSV');
          console.error(results.errors);
          return;
        }

        const data = results.data as ParsedRow[];
        if (data.length === 0) {
          toast.error('Arquivo vazio');
          return;
        }

        const cols = Object.keys(data[0]);
        setHeaders(cols);
        setRawData(data.slice(0, 500)); // limit to 500 rows

        // Auto-detect columns
        const lower = cols.map(c => ({ original: c, lower: c.toLowerCase() }));
        const dateMatch = lower.find(c => c.lower.includes('data') || c.lower.includes('date'));
        const descMatch = lower.find(c => c.lower.includes('descri') || c.lower.includes('description') || c.lower.includes('histórico') || c.lower.includes('historico'));
        const amountMatch = lower.find(c => c.lower.includes('valor') || c.lower.includes('amount') || c.lower.includes('value') || c.lower.includes('quantia'));

        if (dateMatch) setDateColumn(dateMatch.original);
        if (descMatch) setDescriptionColumn(descMatch.original);
        if (amountMatch) setAmountColumn(amountMatch.original);

        setStep('mapping');
        toast.success(`${data.length} linhas encontradas`);
      },
    });

    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const parseDate = (value: string): string | null => {
    if (!value) return null;
    const cleaned = value.trim();

    // Try DD/MM/YYYY
    const brMatch = cleaned.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
    if (brMatch) {
      const [, d, m, y] = brMatch;
      return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
    }

    // Try YYYY-MM-DD
    const isoMatch = cleaned.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/);
    if (isoMatch) {
      const [, y, m, d] = isoMatch;
      return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
    }

    // Try MM/DD/YYYY
    const usMatch = cleaned.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
    if (usMatch) {
      const [, m, d, y] = usMatch;
      return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
    }

    return null;
  };

  const parseAmount = (value: string): number | null => {
    if (!value) return null;
    let cleaned = value.trim().replace(/[R$\s]/g, '');
    // Handle Brazilian format: 1.234,56
    if (cleaned.includes(',') && cleaned.includes('.')) {
      cleaned = cleaned.replace(/\./g, '').replace(',', '.');
    } else if (cleaned.includes(',')) {
      cleaned = cleaned.replace(',', '.');
    }
    const num = parseFloat(cleaned);
    return isNaN(num) ? null : Math.abs(num);
  };

  const handleMapping = () => {
    if (!dateColumn || !descriptionColumn || !amountColumn) {
      toast.error('Mapeie todas as colunas obrigatórias');
      return;
    }
    if (!accountId) {
      toast.error('Selecione uma conta');
      return;
    }
    if (!defaultCategoryId) {
      toast.error('Selecione uma categoria padrão');
      return;
    }

    const mapped: MappedTransaction[] = rawData
      .map(row => {
        const date = parseDate(row[dateColumn]);
        const amount = parseAmount(row[amountColumn]);
        const description = row[descriptionColumn]?.trim() || '';

        if (!date || amount === null || !description) return null;

        return {
          date,
          description,
          amount,
          selected: true,
          categoryId: defaultCategoryId,
          original: row,
        };
      })
      .filter(Boolean) as MappedTransaction[];

    if (mapped.length === 0) {
      toast.error('Nenhuma linha válida encontrada. Verifique o mapeamento.');
      return;
    }

    setMappedRows(mapped);
    setStep('preview');
    toast.success(`${mapped.length} transações mapeadas`);
  };

  const toggleRow = (index: number) => {
    setMappedRows(prev =>
      prev.map((r, i) => i === index ? { ...r, selected: !r.selected } : r)
    );
  };

  const toggleAll = (selected: boolean) => {
    setMappedRows(prev => prev.map(r => ({ ...r, selected })));
  };

  const updateCategory = (index: number, categoryId: string) => {
    setMappedRows(prev =>
      prev.map((r, i) => i === index ? { ...r, categoryId } : r)
    );
  };

  const removeRow = (index: number) => {
    setMappedRows(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    const selectedRows = mappedRows.filter(r => r.selected);
    if (selectedRows.length === 0) {
      toast.error('Selecione ao menos uma transação');
      return;
    }

    setIsSaving(true);
    try {
      const transactions = selectedRows.map(r => ({
        user_id: user!.id,
        account_id: accountId,
        category_id: r.categoryId,
        type,
        amount: r.amount,
        description: r.description,
        date: r.date,
      }));

      // Insert in batches of 50
      for (let i = 0; i < transactions.length; i += 50) {
        const batch = transactions.slice(i, i + 50);
        const { error } = await supabase.from('transactions').insert(batch);
        if (error) throw error;
      }

      // Update account balance
      const totalAmount = selectedRows.reduce((sum, r) => sum + r.amount, 0);
      const balanceChange = type === 'income' ? totalAmount : -totalAmount;

      const { data: account } = await supabase
        .from('accounts')
        .select('balance')
        .eq('id', accountId)
        .single();

      if (account) {
        await supabase
          .from('accounts')
          .update({ balance: Number(account.balance) + balanceChange })
          .eq('id', accountId);
      }

      toast.success(`${selectedRows.length} transações importadas com sucesso!`);
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      onSuccess();
      handleClose();
    } catch (err) {
      console.error('Import error:', err);
      toast.error('Erro ao importar transações');
    } finally {
      setIsSaving(false);
    }
  };

  const selectedCount = mappedRows.filter(r => r.selected).length;
  const selectedTotal = mappedRows.filter(r => r.selected).reduce((s, r) => s + r.amount, 0);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-primary" />
            Importar {type === 'income' ? 'Receitas' : 'Despesas'} via CSV
          </DialogTitle>
        </DialogHeader>

        {/* Steps indicator */}
        <div className="flex items-center gap-2 text-sm">
          {['Upload', 'Mapeamento', 'Revisão'].map((label, i) => {
            const steps: Step[] = ['upload', 'mapping', 'preview'];
            const isActive = steps.indexOf(step) >= i;
            return (
              <div key={label} className="flex items-center gap-2">
                {i > 0 && <div className={cn('w-8 h-0.5', isActive ? 'bg-primary' : 'bg-muted')} />}
                <div className={cn(
                  'flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium',
                  isActive ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                )}>
                  <span className="w-5 h-5 rounded-full bg-current/20 flex items-center justify-center text-[10px]">
                    {i + 1}
                  </span>
                  {label}
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex-1 overflow-hidden">
          {/* Step 1: Upload */}
          {step === 'upload' && (
            <div className="space-y-4 py-4">
              <div
                className="border-2 border-dashed rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="font-medium">Clique para selecionar um arquivo CSV</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Exporte o extrato do seu banco em formato CSV
                </p>
                <p className="text-xs text-muted-foreground mt-2">Máximo 5MB • Até 500 linhas</p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleFileUpload}
              />

              <Card className="bg-muted/30">
                <CardContent className="p-4 space-y-2">
                  <p className="text-sm font-medium flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-primary" />
                    Dicas para exportar do seu banco
                  </p>
                  <ul className="text-xs text-muted-foreground space-y-1 ml-6 list-disc">
                    <li>No app do banco, procure "Exportar extrato" ou "Download CSV"</li>
                    <li>O arquivo deve ter colunas de Data, Descrição e Valor</li>
                    <li>Formatos de data aceitos: DD/MM/AAAA ou AAAA-MM-DD</li>
                    <li>Valores podem usar vírgula ou ponto como separador decimal</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Step 2: Mapping */}
          {step === 'mapping' && (
            <div className="space-y-4 py-4">
              <p className="text-sm text-muted-foreground">
                Arquivo: <span className="font-medium text-foreground">{fileName}</span> ({rawData.length} linhas)
              </p>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Coluna de Data *</Label>
                  <Select value={dateColumn} onValueChange={setDateColumn}>
                    <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                    <SelectContent>
                      {headers.map(h => (
                        <SelectItem key={h} value={h}>{h}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Coluna de Descrição *</Label>
                  <Select value={descriptionColumn} onValueChange={setDescriptionColumn}>
                    <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                    <SelectContent>
                      {headers.map(h => (
                        <SelectItem key={h} value={h}>{h}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Coluna de Valor *</Label>
                  <Select value={amountColumn} onValueChange={setAmountColumn}>
                    <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                    <SelectContent>
                      {headers.map(h => (
                        <SelectItem key={h} value={h}>{h}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Conta destino *</Label>
                  <Select value={accountId} onValueChange={setAccountId}>
                    <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
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
              </div>

              <div className="space-y-2">
                <Label>Categoria padrão *</Label>
                <Select value={defaultCategoryId} onValueChange={setDefaultCategoryId}>
                  <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>
                    {categories.map(c => (
                      <SelectItem key={c.id} value={c.id}>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: c.color }} />
                          {c.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">Você pode alterar individualmente na revisão</p>
              </div>

              {/* Preview raw data */}
              {dateColumn && descriptionColumn && amountColumn && (
                <Card className="bg-muted/30">
                  <CardContent className="p-3">
                    <p className="text-xs font-medium mb-2">Prévia (3 primeiras linhas):</p>
                    <div className="space-y-1">
                      {rawData.slice(0, 3).map((row, i) => (
                        <div key={i} className="text-xs flex gap-3">
                          <span className="text-muted-foreground">{row[dateColumn]}</span>
                          <span className="flex-1 truncate">{row[descriptionColumn]}</span>
                          <span className="font-mono">{row[amountColumn]}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Step 3: Preview */}
          {step === 'preview' && (
            <div className="space-y-3 py-2">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  <span className="font-semibold text-foreground">{selectedCount}</span> de {mappedRows.length} selecionadas
                  {' • '}
                  Total: <span className="font-semibold text-foreground">{formatCurrency(selectedTotal)}</span>
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => toggleAll(true)}>
                    Selecionar tudo
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => toggleAll(false)}>
                    Desmarcar
                  </Button>
                </div>
              </div>

              <ScrollArea className="h-[340px] border rounded-lg">
                <div className="p-2 space-y-1">
                  {mappedRows.map((row, i) => (
                    <div
                      key={i}
                      className={cn(
                        'flex items-center gap-3 p-2 rounded-lg text-sm transition-colors',
                        row.selected ? 'bg-primary/5' : 'bg-muted/30 opacity-60'
                      )}
                    >
                      <Checkbox
                        checked={row.selected}
                        onCheckedChange={() => toggleRow(i)}
                      />
                      <span className="text-xs text-muted-foreground w-20 shrink-0">{row.date}</span>
                      <span className="flex-1 truncate">{row.description}</span>
                      <Select
                        value={row.categoryId}
                        onValueChange={(v) => updateCategory(i, v)}
                      >
                        <SelectTrigger className="w-[130px] h-7 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map(c => (
                            <SelectItem key={c.id} value={c.id}>
                              <div className="flex items-center gap-1">
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: c.color }} />
                                {c.name}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <span className="font-mono text-sm font-medium w-24 text-right">
                        {formatCurrency(row.amount)}
                      </span>
                      <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => removeRow(i)}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          {step === 'mapping' && (
            <>
              <Button variant="outline" onClick={() => setStep('upload')}>Voltar</Button>
              <Button onClick={handleMapping}>Mapear e Revisar</Button>
            </>
          )}
          {step === 'preview' && (
            <>
              <Button variant="outline" onClick={() => setStep('mapping')}>Voltar</Button>
              <Button onClick={handleSave} disabled={isSaving || selectedCount === 0}>
                {isSaving ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Importando...</>
                ) : (
                  <><Check className="w-4 h-4 mr-2" />Importar {selectedCount} transações</>
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
