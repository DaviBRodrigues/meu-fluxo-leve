import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { formatCurrency } from '@/lib/format';
import { CreditCard, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InstallmentGroup {
  groupId: string;
  description: string;
  totalAmount: number;
  installmentAmount: number;
  totalCount: number;
  paidCount: number;
  categoryColor: string;
  categoryName: string;
}

export default function InstallmentsTracker() {
  const { user } = useAuth();

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

      // Group by installment_group_id
      const groups = new Map<string, InstallmentGroup>();
      const now = new Date();
      const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

      for (const t of data) {
        const gid = t.installment_group_id;
        if (!gid) continue;

        if (!groups.has(gid)) {
          // Extract base description (remove "(1/12)" suffix)
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
          });
        }

        const group = groups.get(gid)!;
        group.totalAmount += Number(t.amount);

        // Count installments that have already passed (date <= today)
        if (t.date <= today) {
          group.paidCount += 1;
        }
      }

      // Only return groups that are not fully paid
      return Array.from(groups.values()).filter(g => g.paidCount < g.totalCount);
    },
    enabled: !!user,
  });

  if (isLoading || installmentGroups.length === 0) return null;

  return (
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
                <span className="text-sm text-muted-foreground whitespace-nowrap ml-2">
                  {group.paidCount}/{group.totalCount}
                </span>
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
  );
}
