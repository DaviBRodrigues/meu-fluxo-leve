import { useState } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Navigate } from 'react-router-dom';
import AppLayout from '@/components/layout/AppLayout';
import { useUserRoles } from '@/hooks/useUserRoles';
import { useAdminUsers, UserProfile } from '@/hooks/useAdminUsers';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
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
import { SkeletonCard } from '@/components/shared/SkeletonCard';
import {
  Shield,
  Users,
  Search,
  UserCog,
  Clock,
  Trash2,
  Crown,
  TestTube,
  Calendar,
  Loader2,
} from 'lucide-react';

export default function Admin() {
  const { isAdmin, isLoading: isLoadingRoles } = useUserRoles();
  const { users, isLoading, updateProfile, toggleAdminRole, deleteTestUser } = useAdminUsers();
  const [search, setSearch] = useState('');
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  
  // Edit form state
  const [isTestUser, setIsTestUser] = useState(false);
  const [autoExpire, setAutoExpire] = useState(false);
  const [expirationDays, setExpirationDays] = useState<number>(30);

  // If still loading roles, show loading
  if (isLoadingRoles) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  // If not admin, redirect
  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  const filteredUsers = users.filter(
    (u) =>
      u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      u.user_id.toLowerCase().includes(search.toLowerCase())
  );

  const handleEditUser = (user: UserProfile) => {
    setEditingUser(user);
    setIsTestUser(user.is_test_user);
    setAutoExpire(!!user.test_expiration_days);
    setExpirationDays(user.test_expiration_days || 30);
  };

  const handleSaveUser = async () => {
    if (!editingUser) return;

    await updateProfile.mutateAsync({
      userId: editingUser.user_id,
      isTestUser,
      expirationDays: autoExpire ? expirationDays : null,
    });

    setEditingUser(null);
  };

  const handleToggleAdmin = async (user: UserProfile) => {
    const isCurrentlyAdmin = user.roles?.includes('admin');
    await toggleAdminRole.mutateAsync({
      userId: user.user_id,
      makeAdmin: !isCurrentlyAdmin,
    });
  };

  const handleDeleteTestUser = async () => {
    if (deleteUserId) {
      await deleteTestUser.mutateAsync(deleteUserId);
      setDeleteUserId(null);
    }
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <SkeletonCard variant="list" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Shield className="h-7 w-7 text-primary" />
              Painel Administrativo
            </h1>
            <p className="text-muted-foreground mt-1">
              Gerencie usuários, permissões e contas de teste
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-xl">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{users.length}</p>
                  <p className="text-sm text-muted-foreground">Total de Usuários</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-amber-500/10 rounded-xl">
                  <Crown className="h-6 w-6 text-amber-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {users.filter((u) => u.roles?.includes('admin')).length}
                  </p>
                  <p className="text-sm text-muted-foreground">Administradores</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-500/10 rounded-xl">
                  <TestTube className="h-6 w-6 text-purple-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {users.filter((u) => u.is_test_user).length}
                  </p>
                  <p className="text-sm text-muted-foreground">Usuários de Teste</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Users Table */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle>Usuários</CardTitle>
                <CardDescription>Gerencie permissões e configurações dos usuários</CardDescription>
              </div>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar usuário..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Criado em</TableHead>
                    <TableHead>Expira em</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {user.full_name || 'Sem nome'}
                          </span>
                          <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                            {user.user_id}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {user.roles?.includes('admin') && (
                            <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20">
                              <Crown className="h-3 w-3 mr-1" />
                              Admin
                            </Badge>
                          )}
                          {user.is_test_user && (
                            <Badge variant="secondary" className="bg-purple-500/10 text-purple-500">
                              <TestTube className="h-3 w-3 mr-1" />
                              Teste
                            </Badge>
                          )}
                          {!user.roles?.includes('admin') && !user.is_test_user && (
                            <Badge variant="outline">Usuário</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(user.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                        </div>
                      </TableCell>
                      <TableCell>
                        {user.test_expires_at ? (
                          <div className="flex items-center gap-1 text-sm">
                            <Clock className="h-3 w-3 text-amber-500" />
                            {format(new Date(user.test_expires_at), 'dd/MM/yyyy', { locale: ptBR })}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleAdmin(user)}
                            title={user.roles?.includes('admin') ? 'Remover admin' : 'Tornar admin'}
                          >
                            <Crown
                              className={`h-4 w-4 ${
                                user.roles?.includes('admin')
                                  ? 'text-amber-500'
                                  : 'text-muted-foreground'
                              }`}
                            />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditUser(user)}
                          >
                            <UserCog className="h-4 w-4" />
                          </Button>
                          {user.is_test_user && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeleteUserId(user.user_id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {filteredUsers.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum usuário encontrado.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Edit User Dialog */}
        <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Usuário</DialogTitle>
              <DialogDescription>
                Configure as opções do usuário {editingUser?.full_name || editingUser?.user_id}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Test User Toggle */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Usuário de Teste</Label>
                  <p className="text-sm text-muted-foreground">
                    Marcar como conta de teste
                  </p>
                </div>
                <Switch checked={isTestUser} onCheckedChange={setIsTestUser} />
              </div>

              {/* Auto Expiration */}
              {isTestUser && (
                <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Expiração Automática</Label>
                      <p className="text-sm text-muted-foreground">
                        Excluir automaticamente após período
                      </p>
                    </div>
                    <Switch checked={autoExpire} onCheckedChange={setAutoExpire} />
                  </div>

                  {autoExpire && (
                    <div className="space-y-2">
                      <Label>Dias até expiração</Label>
                      <Input
                        type="number"
                        min={1}
                        max={365}
                        value={expirationDays}
                        onChange={(e) => setExpirationDays(Number(e.target.value))}
                      />
                      <p className="text-xs text-muted-foreground">
                        O usuário será excluído em{' '}
                        {format(
                          new Date(Date.now() + expirationDays * 24 * 60 * 60 * 1000),
                          "dd 'de' MMMM 'de' yyyy",
                          { locale: ptBR }
                        )}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingUser(null)}>
                Cancelar
              </Button>
              <Button onClick={handleSaveUser} disabled={updateProfile.isPending}>
                {updateProfile.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Salvar'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <DeleteConfirmDialog
          isOpen={!!deleteUserId}
          onClose={() => setDeleteUserId(null)}
          onConfirm={handleDeleteTestUser}
          title="Excluir Usuário de Teste"
          description="Esta ação excluirá permanentemente o usuário de teste e todos os seus dados."
          affectsBalance={false}
          isLoading={deleteTestUser.isPending}
        />
      </motion.div>
    </AppLayout>
  );
}
