import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import AppLayout from '@/components/layout/AppLayout';
import AccountCard from '@/components/accounts/AccountCard';
import AccountForm from '@/components/accounts/AccountForm';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAccounts } from '@/hooks/useAccounts';
import { formatCurrency } from '@/lib/format';
import { Wallet, Plus } from 'lucide-react';
import { Account } from '@/types/database';

export default function Accounts() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editAccount, setEditAccount] = useState<Account | null>(null);

  const { accounts, totalBalance, isLoading, createAccount, updateAccount, deleteAccount } = useAccounts();

  if (loading) return null;
  if (!user) {
    navigate('/auth');
    return null;
  }

  const handleEditAccount = (account: Account) => {
    setEditAccount(account);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditAccount(null);
  };

  const handleSubmit = (data: Omit<Account, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (editAccount) {
      updateAccount.mutate({ id: editAccount.id, ...data });
    } else {
      createAccount.mutate(data);
    }
    handleCloseForm();
  };

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Wallet className="w-7 h-7 text-primary" />
              Contas
            </h1>
            <p className="text-muted-foreground mt-1">Gerencie suas contas e carteiras</p>
          </div>
          <Button onClick={() => setIsFormOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Nova Conta
          </Button>
        </div>

        {/* Total Balance */}
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Saldo total de todas as contas</p>
                <p className="text-3xl font-bold">{formatCurrency(totalBalance)}</p>
              </div>
              <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center">
                <Wallet className="w-8 h-8 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Accounts Grid */}
        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <div className="h-2 bg-muted" />
                <CardContent className="p-4">
                  <div className="h-20 bg-muted rounded" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : accounts.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Wallet className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Nenhuma conta cadastrada</h3>
              <p className="text-muted-foreground mb-4">
                Adicione suas contas bancárias, cartões e carteiras para começar
              </p>
              <Button onClick={() => setIsFormOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Criar primeira conta
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {accounts.map((account) => (
              <AccountCard
                key={account.id}
                account={account}
                onEdit={handleEditAccount}
                onDelete={(id) => deleteAccount.mutate(id)}
              />
            ))}
          </div>
        )}

        {/* Form */}
        <AccountForm
          isOpen={isFormOpen}
          onClose={handleCloseForm}
          onSubmit={handleSubmit}
          isLoading={createAccount.isPending || updateAccount.isPending}
          editAccount={editAccount}
        />
      </div>
    </AppLayout>
  );
}