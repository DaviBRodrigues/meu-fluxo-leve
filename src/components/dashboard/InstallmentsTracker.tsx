import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { DeleteConfirmDialog } from '@/components/shared/DeleteConfirmDialog';
import { formatCurrency } from '@/lib/format';
import { CreditCard, Trash2, CheckCircle } from 'lucide-react';
import { useTransactions } from '@/hooks/useTransactions';
import { toast } from 'sonner';

interface InstallmentGroup {
  groupId: string;
  description: string;
  totalAmount: number;
  installmentAmount: number;
  totalCount: number;
  paidCount: number;
  categoryColor: string;
  categoryName: string;
  nextInstallmentId: string | null;
  nextInstallmentDate: string | null;
  accountId: string;
}

export default function InstallmentsTracker() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { deleteInstallmentGroup } = useTransactions();
  const [groupToDelete, setGroupToDelete] = useState<InstallmentGroup | null>(null);
  const [payingId, setPayingId] = useState<string | null>(null);

  const { data: installmentGroups = [], isLoading } = useQuery({
    queryKey: ['installment-groups', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transactions')
        .select('*, category:categories(*)')
        .eq('user_id', user!.id)
        .eq('is_installment', true)
        .order('date', { ascending: true });

      if (error) throw error;

      const groups = new Map<string, InstallmentGroup>();
      const now = new Date();
      const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

      for (const t of data) {
        const gid = t.installment_group_id;
        if (!gid) continue;

        if (!groups.has(gid)) {
          const baseDesc = t.description.replace(/\s*\(\d+\/\d+\)$/, '');
          groups.set(gid, {
            groupId: gid,
            description: baseDesc,
            totalAmount: 0,
            installmentAmount: Number(t.amount),
            totalCount: t.installment_count || 0,
            paidCount: 0,
            categoryColor: (t.category as any)?.color || '#6B7280',
            categoryName: (t.category as any)?.name || 'Sem categoria',
            nextInstallmentId: null,
            nextInstallmentDate: null,
            accountId: t.account_id,
          });
        }

        const group = groups.get(gid)!;
        group.totalAmount += Number(t.amount);

        if (t.date <= today) {
          group.paidCount += 1;
        } else if (!group.nextInstallmentId || t.date < group.nextInstallmentDate!) {
          group.nextInstallmentId = t.id;
          group.nextInstallmentDate = t.date;
        }
      }

      return Array.from(groups.values()).filter(g => g.paidCount < g.totalCount);
    },
    enabled: !!user,
  });

  const handlePayNextInstallment = async (group: InstallmentGroup) => {
    if (!group.nextInstallmentId) return;
    setPayingId(group.groupId);

    try {
      // Update the installment date to today so it counts as paid
      const now = new Date();
      const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

      const { error: updateError } = await supabase
        .from('transactions')
        .update({ date: today })
        .eq('id', group.nextInstallmentId);

      if (updateError) throw updateError;

      // Update account balance (deduct the installment)
      const { data: account } = await supabase
        .from('accounts')
        .select('balance')
        .eq('id', group.accountId)
        .single();

      if (account) {
        await supabase
          .from('accounts')
          .update({ balance: Number(account.balance) - group.installmentAmount })
          .eq('id', group.accountId);
      }

      queryClient.invalidateQueries({ queryKey: ['installment-groups'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      toast.success(`Parcela ${group.paidCount + 1}/${group.totalCount} registrada!`);
    } catch {
      toast.error('Erro ao registrar parcela');
    } finally {
      setPayingId(null);
    }
  };

  const handleDeleteGroup = () => {
    if (!groupToDelete) return;
    deleteInstallmentGroup.mutate(groupToDelete.groupId, {
      onSettled: () => setGroupToDelete(null),
    });
  };

  if (isLoading || installmentGroups.length === 0) return null;

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-primary" />
            Parcelamentos Ativos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {installmentGroups.map((group) => {
            const progress = (group.paidCount / group.totalCount) * 100;
            const remaining = group.totalCount - group.paidCount;
            const remainingAmount = remaining * group.installmentAmount;

            return (
              <div key={group.groupId} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: group.categoryColor }}
                    />
                    <span className="font-medium text-sm truncate">{group.description}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-sm text-muted-foreground whitespace-nowrap">
                      {group.paidCount}/{group.totalCount}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-primary hover:text-primary"
                      onClick={() => handlePayNextInstallment(group)}
                      disabled={payingId === group.groupId || !group.nextInstallmentId}
                      title="Registrar próxima parcela"
                    >
                      <CheckCircle className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={() => setGroupToDelete(group)}
                      title="Excluir parcelamento"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <Progress value={progress} className="h-2" />
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>
                    {formatCurrency(group.installmentAmount)}/mês
                  </span>
                  <span>
                    Faltam {remaining} parcela{remaining !== 1 ? 's' : ''} ({formatCurrency(remainingAmount)})
                  </span>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <DeleteConfirmDialog
        isOpen={!!groupToDelete}
        onClose={() => setGroupToDelete(null)}
        onConfirm={handleDeleteGroup}
        title="Excluir parcelamento"
        description="Tem certeza que deseja excluir todas as parcelas deste parcelamento?"
        itemName={groupToDelete?.description}
        affectsBalance={true}
        isLoading={deleteInstallmentGroup.isPending}
      />
    </>
  );
}
