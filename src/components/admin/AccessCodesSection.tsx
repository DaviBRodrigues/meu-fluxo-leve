import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAccessCodes, AccessCode } from '@/hooks/useAccessCodes';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { DeleteConfirmDialog } from '@/components/shared/DeleteConfirmDialog';
import {
  KeyRound,
  Plus,
  Copy,
  Trash2,
  RefreshCw,
  Loader2,
  Check,
} from 'lucide-react';
import { toast } from 'sonner';

export function AccessCodesSection() {
  const {
    accessCodes,
    isLoading,
    createAccessCode,
    updateAccessCode,
    deleteAccessCode,
    generateRandomCode,
  } = useAccessCodes();

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [deleteCodeId, setDeleteCodeId] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Form state
  const [newCode, setNewCode] = useState('');
  const [description, setDescription] = useState('');
  const [hasMaxUses, setHasMaxUses] = useState(false);
  const [maxUses, setMaxUses] = useState(1);
  const [hasExpiration, setHasExpiration] = useState(false);
  const [expirationDays, setExpirationDays] = useState(30);

  const handleGenerateCode = () => {
    setNewCode(generateRandomCode());
  };

  const handleCreateCode = async () => {
    if (!newCode.trim()) {
      toast.error('Digite ou gere um código');
      return;
    }

    let expiresAt: string | null = null;
    if (hasExpiration) {
      const date = new Date();
      date.setDate(date.getDate() + expirationDays);
      expiresAt = date.toISOString();
    }

    await createAccessCode.mutateAsync({
      code: newCode.toUpperCase().trim(),
      description: description.trim() || undefined,
      maxUses: hasMaxUses ? maxUses : null,
      expiresAt,
    });

    setShowCreateDialog(false);
    resetForm();
  };

  const resetForm = () => {
    setNewCode('');
    setDescription('');
    setHasMaxUses(false);
    setMaxUses(1);
    setHasExpiration(false);
    setExpirationDays(30);
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success('Código copiado!');
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleToggleActive = (accessCode: AccessCode) => {
    updateAccessCode.mutate({
      id: accessCode.id,
      isActive: !accessCode.is_active,
    });
  };

  const handleDeleteCode = async () => {
    if (deleteCodeId) {
      await deleteAccessCode.mutateAsync(deleteCodeId);
      setDeleteCodeId(null);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-10 text-center">
          <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <KeyRound className="h-5 w-5" />
                Códigos de Acesso
              </CardTitle>
              <CardDescription>
                Códigos necessários para novos usuários se cadastrarem
              </CardDescription>
            </div>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Código
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {accessCodes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <KeyRound className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum código de acesso criado.</p>
              <p className="text-sm">Crie um código para permitir novos cadastros.</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Usos</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {accessCodes.map((code) => {
                    const isExpired = code.expires_at && new Date(code.expires_at) < new Date();
                    const isMaxed = code.max_uses && code.current_uses >= code.max_uses;
                    const isUsable = code.is_active && !isExpired && !isMaxed;

                    return (
                      <TableRow key={code.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <code className="bg-muted px-2 py-1 rounded font-mono text-sm">
                              {code.code}
                            </code>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCopyCode(code.code)}
                              className="h-8 w-8 p-0"
                            >
                              {copiedCode === code.code ? (
                                <Check className="h-3 w-3 text-green-500" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {code.description || '—'}
                        </TableCell>
                        <TableCell>
                          {code.max_uses ? (
                            <span className={isMaxed ? 'text-destructive' : ''}>
                              {code.current_uses}/{code.max_uses}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">
                              {code.current_uses} (ilimitado)
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          {isExpired ? (
                            <Badge variant="destructive">Expirado</Badge>
                          ) : isMaxed ? (
                            <Badge variant="secondary">Esgotado</Badge>
                          ) : isUsable ? (
                            <Badge className="bg-green-500/10 text-green-500 border-green-500/20">
                              Ativo
                            </Badge>
                          ) : (
                            <Badge variant="outline">Inativo</Badge>
                          )}
                          {code.expires_at && !isExpired && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Expira em {format(new Date(code.expires_at), 'dd/MM/yyyy', { locale: ptBR })}
                            </p>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Switch
                              checked={code.is_active}
                              onCheckedChange={() => handleToggleActive(code)}
                              disabled={isExpired || isMaxed}
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeleteCodeId(code.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Code Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Código de Acesso</DialogTitle>
            <DialogDescription>
              Crie um código para permitir que novos usuários se cadastrem
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Código</Label>
              <div className="flex gap-2">
                <Input
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                  placeholder="Ex: BEMVINDO2024"
                  className="uppercase font-mono"
                  maxLength={20}
                />
                <Button variant="outline" onClick={handleGenerateCode} type="button">
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Descrição (opcional)</Label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ex: Código para equipe de vendas"
              />
            </div>

            <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Limite de Usos</Label>
                  <p className="text-sm text-muted-foreground">
                    Definir número máximo de usos
                  </p>
                </div>
                <Switch checked={hasMaxUses} onCheckedChange={setHasMaxUses} />
              </div>

              {hasMaxUses && (
                <Input
                  type="number"
                  min={1}
                  value={maxUses}
                  onChange={(e) => setMaxUses(Number(e.target.value))}
                />
              )}

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Data de Expiração</Label>
                  <p className="text-sm text-muted-foreground">
                    Código expira após período
                  </p>
                </div>
                <Switch checked={hasExpiration} onCheckedChange={setHasExpiration} />
              </div>

              {hasExpiration && (
                <div className="space-y-2">
                  <Input
                    type="number"
                    min={1}
                    max={365}
                    value={expirationDays}
                    onChange={(e) => setExpirationDays(Number(e.target.value))}
                  />
                  <p className="text-xs text-muted-foreground">
                    Expira em {format(
                      new Date(Date.now() + expirationDays * 24 * 60 * 60 * 1000),
                      "dd 'de' MMMM 'de' yyyy",
                      { locale: ptBR }
                    )}
                  </p>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateCode} disabled={createAccessCode.isPending}>
              {createAccessCode.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Criar Código'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <DeleteConfirmDialog
        isOpen={!!deleteCodeId}
        onClose={() => setDeleteCodeId(null)}
        onConfirm={handleDeleteCode}
        title="Excluir Código de Acesso"
        description="Tem certeza que deseja excluir este código? Usuários não poderão mais usá-lo para se cadastrar."
        affectsBalance={false}
        isLoading={deleteAccessCode.isPending}
      />
    </>
  );
}
