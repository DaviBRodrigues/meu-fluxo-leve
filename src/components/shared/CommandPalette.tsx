import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from '@/components/ui/command';
import { useTransactions } from '@/hooks/useTransactions';
import { useAccounts } from '@/hooks/useAccounts';
import { useSavingsGoals } from '@/hooks/useSavingsGoals';
import { useCategories } from '@/hooks/useCategories';
import {
  ArrowUpCircle,
  ArrowDownCircle,
  Wallet,
  Target,
  Tag,
  LayoutDashboard,
  Settings,
  PiggyBank,
  TrendingUp,
  History,
  BarChart3,
  Receipt,
} from 'lucide-react';
import { formatCurrency } from '@/lib/format';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const { transactions } = useTransactions();
  const { accounts } = useAccounts();
  const { goals } = useSavingsGoals();
  const { categories } = useCategories();

  useEffect(() => {
    if (!isOpen) setSearch('');
  }, [isOpen]);

  const go = (path: string) => {
    onClose();
    navigate(path);
  };

  const matchedTransactions = useMemo(
    () =>
      search
        ? transactions
            .filter((t) =>
              [t.description, t.category?.name].some((s) =>
                s?.toLowerCase().includes(search.toLowerCase())
              )
            )
            .slice(0, 6)
        : [],
    [transactions, search]
  );

  const navItems = [
    { label: 'Dashboard', path: '/', icon: LayoutDashboard },
    { label: 'Transações', path: '/transacoes', icon: Receipt },
    { label: 'Contas', path: '/contas', icon: Wallet },
    { label: 'Investimentos', path: '/investimentos', icon: TrendingUp },
    { label: 'Orçamentos', path: '/orcamentos', icon: PiggyBank },
    { label: 'Metas', path: '/metas', icon: Target },
    { label: 'Relatórios', path: '/relatorios', icon: BarChart3 },
    { label: 'Histórico', path: '/historico', icon: History },
    { label: 'Configurações', path: '/configuracoes', icon: Settings },
  ];

  return (
    <CommandDialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <CommandInput
        placeholder="Buscar transações, contas, metas, páginas..."
        value={search}
        onValueChange={setSearch}
      />
      <CommandList>
        <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>

        <CommandGroup heading="Navegação">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <CommandItem key={item.path} onSelect={() => go(item.path)}>
                <Icon className="mr-2 h-4 w-4" />
                {item.label}
              </CommandItem>
            );
          })}
        </CommandGroup>

        {matchedTransactions.length > 0 && (
          <CommandGroup heading="Transações">
            {matchedTransactions.map((t) => (
              <CommandItem
                key={t.id}
                onSelect={() => go(`/transacoes?type=${t.type === 'income' ? 'income' : 'expense'}`)}
              >
                {t.type === 'income' ? (
                  <ArrowUpCircle className="mr-2 h-4 w-4 text-income" />
                ) : (
                  <ArrowDownCircle className="mr-2 h-4 w-4 text-expense" />
                )}
                <span className="flex-1 truncate">{t.description}</span>
                <span className="ml-2 text-xs text-muted-foreground">
                  {formatCurrency(Number(t.amount))}
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {accounts.length > 0 && (
          <CommandGroup heading="Contas">
            {accounts
              .filter((a) => !search || a.name.toLowerCase().includes(search.toLowerCase()))
              .slice(0, 5)
              .map((a) => (
                <CommandItem key={a.id} onSelect={() => go('/contas')}>
                  <Wallet className="mr-2 h-4 w-4" />
                  {a.name}
                </CommandItem>
              ))}
          </CommandGroup>
        )}

        {goals.length > 0 && (
          <CommandGroup heading="Metas">
            {goals
              .filter((g) => !search || g.name.toLowerCase().includes(search.toLowerCase()))
              .slice(0, 5)
              .map((g) => (
                <CommandItem key={g.id} onSelect={() => go('/metas')}>
                  <Target className="mr-2 h-4 w-4" />
                  {g.name}
                </CommandItem>
              ))}
          </CommandGroup>
        )}

        {categories.length > 0 && search && (
          <CommandGroup heading="Categorias">
            {categories
              .filter((c) => c.name.toLowerCase().includes(search.toLowerCase()))
              .slice(0, 5)
              .map((c) => (
                <CommandItem key={c.id} onSelect={() => go('/configuracoes')}>
                  <Tag className="mr-2 h-4 w-4" />
                  {c.name}
                </CommandItem>
              ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}
