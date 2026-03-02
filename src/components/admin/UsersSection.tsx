import { useRef, useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { useAdminUsers, UserProfile } from '@/hooks/useAdminUsers';
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Users,
  Search,
  UserCog,
  Clock,
  Trash2,
  Crown,
  TestTube,
  Calendar,
  Loader2,
  UserPlus,
  AlertTriangle,
  Copy,
  Check,
  Eye,
  EyeOff,
  UserX,
  UserCheck,
  Mail,
} from 'lucide-react';
import { toast } from 'sonner';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

interface CreatedUserCredentials {
  email: string;
  password: string;
  fullName: string;
}

interface StoredCredentials {
  id: string;
  user_id: string;
  email: string;
  password: string;
  full_name: string | null;
  created_at: string;
}

export function UsersSection() {
  const { users, isLoading, updateProfile, toggleAdminRole, toggleUserActive } = useAdminUsers();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [deleteUser, setDeleteUser] = useState<UserProfile | null>(null);
  const [deleteStep, setDeleteStep] = useState<1 | 2>(1);
  const isDeleteStepTransitioningRef = useRef(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showCredentialsDialog, setShowCredentialsDialog] = useState(false);
  const [createdCredentials, setCreatedCredentials] = useState<CreatedUserCredentials | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [viewingCredentials, setViewingCredentials] = useState<StoredCredentials | null>(null);
  const [showStoredPasswordId, setShowStoredPasswordId] = useState<string | null>(null);
  
  // Admin role confirmation state
  const [adminRoleConfirm, setAdminRoleConfirm] = useState<{ user: UserProfile; makeAdmin: boolean } | null>(null);
  // Deactivation confirmation state
  const [toggleActiveConfirm, setToggleActiveConfirm] = useState<{ user: UserProfile; newIsActive: boolean } | null>(null);

  // Fetch stored credentials for test users
  const { data: storedCredentials = [] } = useQuery({
    queryKey: ['test_user_credentials'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('test_user_credentials')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as StoredCredentials[];
    },
  });

  // Edit form state
  const [isTestUser, setIsTestUser] = useState(false);
  const [autoExpire, setAutoExpire] = useState(false);
  const [expirationDays, setExpirationDays] = useState<number>(30);

  // Create user form state
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newFullName, setNewFullName] = useState('');
  const [newIsTestUser, setNewIsTestUser] = useState(true);
  const [newAutoExpire, setNewAutoExpire] = useState(true);
  const [newExpirationDays, setNewExpirationDays] = useState(30);

  // Create user mutation
  const createUser = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('admin-create-user', {
        body: {
          email: newEmail,
          password: newPassword,
          fullName: newFullName,
          isTestUser: newIsTestUser,
          expirationDays: newAutoExpire ? newExpirationDays : null,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: async (data) => {
      // Save credentials to database
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('test_user_credentials').insert({
          user_id: data.user.id,
          email: newEmail,
          password: newPassword,
          full_name: newFullName || null,
          created_by: user.id,
        });
      }
      
      queryClient.invalidateQueries({ queryKey: ['admin_users'] });
      queryClient.invalidateQueries({ queryKey: ['test_user_credentials'] });
      toast.success('Usuário criado com sucesso!');
      
      // Save credentials to show
      setCreatedCredentials({
        email: newEmail,
        password: newPassword,
        fullName: newFullName,
      });
      
      setShowCreateDialog(false);
      setShowCredentialsDialog(true);
      resetCreateForm();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao criar usuário');
    },
  });

  // Delete user mutation (complete deletion)
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { data, error } = await supabase.functions.invoke('admin-delete-user', {
        body: { userId },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin_users'] });
      queryClient.invalidateQueries({ queryKey: ['test_user_credentials'] });
      toast.success('Usuário excluído permanentemente!');
      setDeleteUser(null);
      setDeleteStep(1);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao excluir usuário');
    },
  });

  const resetCreateForm = () => {
    setNewEmail('');
    setNewPassword('');
    setNewFullName('');
    setNewIsTestUser(true);
    setNewAutoExpire(true);
    setNewExpirationDays(30);
  };

  const filteredUsers = users.filter(
    (u) =>
      u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase()) ||
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

  const handleInitiateDelete = (user: UserProfile) => {
    setDeleteUser(user);
    setDeleteStep(1);
    isDeleteStepTransitioningRef.current = false;
  };

  const handleConfirmFirstStep = () => {
    // Radix closes the dialog immediately; we must prevent the onOpenChange(close)
    // from treating this as a cancel.
    isDeleteStepTransitioningRef.current = true;
    setDeleteStep(2);
  };

  const handleConfirmDelete = async () => {
    if (deleteUser) {
      await deleteUserMutation.mutateAsync(deleteUser.user_id);
    }
  };

  const handleCancelDelete = () => {
    setDeleteUser(null);
    setDeleteStep(1);
    isDeleteStepTransitioningRef.current = false;
  };

  const handleCreateUser = () => {
    if (!newEmail || !newPassword) {
      toast.error('Email e senha são obrigatórios');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('Senha deve ter pelo menos 6 caracteres');
      return;
    }
    createUser.mutate();
  };

  const handleCopy = (value: string, field: string) => {
    navigator.clipboard.writeText(value);
    setCopiedField(field);
    toast.success('Copiado!');
    setTimeout(() => setCopiedField(null), 2000);
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
            <div className="flex gap-2">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar usuário..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button onClick={() => setShowCreateDialog(true)}>
                <UserPlus className="h-4 w-4 mr-2" />
                Criar
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Último Acesso</TableHead>
                  <TableHead>Status</TableHead>
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
                        <span className="text-xs text-muted-foreground">
                          Criado em {format(new Date(user.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <Mail className="h-3 w-3 text-muted-foreground" />
                        <span className="truncate max-w-[200px]">{user.email || '—'}</span>
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
                      {user.last_sign_in_at ? (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {format(new Date(user.last_sign_in_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">Nunca</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={user.is_active !== false}
                          onCheckedChange={(checked) => {
                            setToggleActiveConfirm({ user, newIsActive: checked });
                          }}
                          disabled={toggleUserActive.isPending}
                        />
                        <span className={cn(
                          'text-sm font-medium',
                          user.is_active !== false ? 'text-emerald-500' : 'text-muted-foreground'
                        )}>
                          {user.is_active !== false ? 'Ativo' : 'Inativo'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {/* Show credentials button - only if credentials exist */}
                        {storedCredentials.find((c) => c.user_id === user.user_id) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const creds = storedCredentials.find((c) => c.user_id === user.user_id);
                              if (creds) setViewingCredentials(creds);
                            }}
                            title="Ver credenciais"
                            className="text-green-600 hover:text-green-600"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const isCurrentlyAdmin = user.roles?.includes('admin');
                            setAdminRoleConfirm({ user, makeAdmin: !isCurrentlyAdmin });
                          }}
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
                        {/* Removed old toggle active button - now using Switch in Status column */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditUser(user)}
                        >
                          <UserCog className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleInitiateDelete(user)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
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

      {/* Create User Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar Usuário de Teste</DialogTitle>
            <DialogDescription>
              Crie um novo usuário com email e senha definidos por você
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nome completo</Label>
              <Input
                value={newFullName}
                onChange={(e) => setNewFullName(e.target.value)}
                placeholder="Nome do usuário"
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="text"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="email@qualquerprovedor.com"
              />
            </div>
            <div className="space-y-2">
              <Label>Senha</Label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
              />
            </div>

            <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Usuário de Teste</Label>
                  <p className="text-sm text-muted-foreground">
                    Marcar como conta de teste
                  </p>
                </div>
                <Switch checked={newIsTestUser} onCheckedChange={setNewIsTestUser} />
              </div>

              {newIsTestUser && (
                <>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Expiração Automática</Label>
                      <p className="text-sm text-muted-foreground">
                        Excluir automaticamente após período
                      </p>
                    </div>
                    <Switch checked={newAutoExpire} onCheckedChange={setNewAutoExpire} />
                  </div>

                  {newAutoExpire && (
                    <div className="space-y-2">
                      <Label>Dias até expiração</Label>
                      <Input
                        type="number"
                        min={1}
                        max={365}
                        value={newExpirationDays}
                        onChange={(e) => setNewExpirationDays(Number(e.target.value))}
                      />
                      <p className="text-xs text-muted-foreground">
                        O usuário será excluído em{' '}
                        {format(
                          new Date(Date.now() + newExpirationDays * 24 * 60 * 60 * 1000),
                          "dd 'de' MMMM 'de' yyyy",
                          { locale: ptBR }
                        )}
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateUser} disabled={createUser.isPending}>
              {createUser.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Criar Usuário'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Credentials Dialog - Shows after user creation */}
      <Dialog open={showCredentialsDialog} onOpenChange={setShowCredentialsDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-600">
              <Check className="h-5 w-5" />
              Usuário Criado com Sucesso!
            </DialogTitle>
            <DialogDescription>
              Guarde as credenciais abaixo. A senha não poderá ser visualizada novamente.
            </DialogDescription>
          </DialogHeader>

          {createdCredentials && (
            <div className="space-y-4 py-4">
              <div className="p-4 bg-muted rounded-lg space-y-4">
                {createdCredentials.fullName && (
                  <div>
                    <Label className="text-muted-foreground text-xs">Nome</Label>
                    <p className="font-medium">{createdCredentials.fullName}</p>
                  </div>
                )}
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-muted-foreground text-xs">Email</Label>
                    <p className="font-mono text-sm">{createdCredentials.email}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopy(createdCredentials.email, 'email')}
                  >
                    {copiedField === 'email' ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-muted-foreground text-xs">Senha</Label>
                    <p className="font-mono text-sm">
                      {showPassword ? createdCredentials.password : '••••••••'}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopy(createdCredentials.password, 'password')}
                    >
                      {copiedField === 'password' ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              <p className="text-xs text-amber-600 bg-amber-500/10 p-3 rounded-lg">
                ⚠️ Anote estas credenciais! A senha não será exibida novamente após fechar esta janela.
              </p>
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => {
              setShowCredentialsDialog(false);
              setCreatedCredentials(null);
              setShowPassword(false);
            }}>
              Entendi, Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Usuário de Teste</Label>
                <p className="text-sm text-muted-foreground">
                  Marcar como conta de teste
                </p>
              </div>
              <Switch checked={isTestUser} onCheckedChange={setIsTestUser} />
            </div>

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

      {/* Delete Confirmation - Step 1 */}
      <AlertDialog
        open={!!deleteUser && deleteStep === 1}
        onOpenChange={(open) => {
          // Only cancel when the user closes THIS step.
          // When moving to step 2, step 1 closes because deleteStep changes.
          if (!open && !isDeleteStepTransitioningRef.current) handleCancelDelete();
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Excluir Usuário
            </AlertDialogTitle>
            <AlertDialogDescription>
              Você está prestes a excluir o usuário{' '}
              <strong>{deleteUser?.full_name || deleteUser?.user_id}</strong>.
              {deleteUser?.roles?.includes('admin') && (
                <span className="block mt-2 text-amber-500 font-medium">
                  ⚠️ Este usuário é um ADMINISTRADOR!
                </span>
              )}
              <br />
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelDelete}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmFirstStep} className="bg-destructive hover:bg-destructive/90">
              Continuar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation - Step 2 */}
      <AlertDialog
        open={!!deleteUser && deleteStep === 2}
        onOpenChange={(open) => {
          if (!open) handleCancelDelete();
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Confirmar Exclusão Permanente
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div>
                <strong className="text-destructive">ATENÇÃO!</strong> Você está prestes a excluir PERMANENTEMENTE:
                <br /><br />
                <strong>{deleteUser?.full_name || 'Sem nome'}</strong>
                <br />
                <span className="text-xs">{deleteUser?.user_id}</span>
                <br /><br />
                O usuário será deslogado imediatamente e perderá todo acesso ao sistema.
                <strong className="block mt-2">Todos os dados serão perdidos para sempre.</strong>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelDelete}>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmDelete} 
              className="bg-destructive hover:bg-destructive/90"
              disabled={deleteUserMutation.isPending}
            >
              {deleteUserMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Excluir Permanentemente'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* View Stored Credentials Dialog */}
      <Dialog open={!!viewingCredentials} onOpenChange={() => {
        setViewingCredentials(null);
        setShowStoredPasswordId(null);
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-green-600" />
              Credenciais do Usuário
            </DialogTitle>
            <DialogDescription>
              Credenciais salvas para este usuário de teste
            </DialogDescription>
          </DialogHeader>

          {viewingCredentials && (
            <div className="space-y-4 py-4">
              <div className="p-4 bg-muted rounded-lg space-y-4">
                {viewingCredentials.full_name && (
                  <div>
                    <Label className="text-muted-foreground text-xs">Nome</Label>
                    <p className="font-medium">{viewingCredentials.full_name}</p>
                  </div>
                )}
                
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <Label className="text-muted-foreground text-xs">Email</Label>
                    <p className="font-mono text-sm break-all">{viewingCredentials.email}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopy(viewingCredentials.email, 'stored-email')}
                  >
                    {copiedField === 'stored-email' ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <Label className="text-muted-foreground text-xs">Senha</Label>
                    <p className="font-mono text-sm">
                      {showStoredPasswordId === viewingCredentials.id 
                        ? viewingCredentials.password 
                        : '••••••••'}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowStoredPasswordId(
                        showStoredPasswordId === viewingCredentials.id ? null : viewingCredentials.id
                      )}
                    >
                      {showStoredPasswordId === viewingCredentials.id ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopy(viewingCredentials.password, 'stored-password')}
                    >
                      {copiedField === 'stored-password' ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="pt-2 border-t">
                  <Label className="text-muted-foreground text-xs">Criado em</Label>
                  <p className="text-sm">
                    {format(new Date(viewingCredentials.created_at), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                  </p>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => {
              setViewingCredentials(null);
              setShowStoredPasswordId(null);
            }}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Toggle Active Confirmation Dialog */}
      <AlertDialog
        open={!!toggleActiveConfirm}
        onOpenChange={(open) => {
          if (!open) setToggleActiveConfirm(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              {toggleActiveConfirm?.newIsActive ? (
                <>
                  <UserCheck className="h-5 w-5 text-emerald-500" />
                  Reativar Usuário
                </>
              ) : (
                <>
                  <UserX className="h-5 w-5 text-destructive" />
                  Desativar Usuário
                </>
              )}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {toggleActiveConfirm?.newIsActive ? (
                <>
                  Deseja <strong>reativar</strong> o usuário{' '}
                  <strong>{toggleActiveConfirm?.user.full_name || toggleActiveConfirm?.user.email || 'sem nome'}</strong>?
                  <br /><br />
                  O usuário poderá acessar o sistema novamente normalmente.
                </>
              ) : (
                <>
                  Deseja <strong>desativar temporariamente</strong> o usuário{' '}
                  <strong>{toggleActiveConfirm?.user.full_name || toggleActiveConfirm?.user.email || 'sem nome'}</strong>?
                  <br /><br />
                  O usuário será desconectado e verá uma mensagem informando que sua conta foi desativada. 
                  Os dados serão mantidos e a conta poderá ser reativada a qualquer momento.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setToggleActiveConfirm(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (toggleActiveConfirm) {
                  toggleUserActive.mutate({
                    userId: toggleActiveConfirm.user.user_id,
                    isActive: toggleActiveConfirm.newIsActive,
                  });
                  setToggleActiveConfirm(null);
                }
              }}
              className={toggleActiveConfirm?.newIsActive ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-destructive hover:bg-destructive/90'}
            >
              {toggleActiveConfirm?.newIsActive ? 'Sim, Reativar' : 'Sim, Desativar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Admin Role Confirmation Dialog */}
      <AlertDialog
        open={!!adminRoleConfirm}
        onOpenChange={(open) => {
          if (!open) setAdminRoleConfirm(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-amber-500" />
              {adminRoleConfirm?.makeAdmin ? 'Tornar Administrador' : 'Remover Administrador'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {adminRoleConfirm?.makeAdmin ? (
                <>
                  Você está prestes a conceder permissões de <strong>administrador</strong> ao usuário{' '}
                  <strong>{adminRoleConfirm?.user.full_name || adminRoleConfirm?.user.user_id}</strong>.
                  <br /><br />
                  Administradores podem gerenciar todos os usuários, alterar permissões e acessar o painel administrativo.
                </>
              ) : (
                <>
                  Você está prestes a <strong>remover</strong> as permissões de administrador do usuário{' '}
                  <strong>{adminRoleConfirm?.user.full_name || adminRoleConfirm?.user.user_id}</strong>.
                  <br /><br />
                  O usuário perderá acesso ao painel administrativo e não poderá mais gerenciar outros usuários.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setAdminRoleConfirm(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (adminRoleConfirm) {
                  toggleAdminRole.mutate({
                    userId: adminRoleConfirm.user.user_id,
                    makeAdmin: adminRoleConfirm.makeAdmin,
                  });
                  setAdminRoleConfirm(null);
                }
              }}
              className={adminRoleConfirm?.makeAdmin ? 'bg-amber-600 hover:bg-amber-700' : 'bg-destructive hover:bg-destructive/90'}
            >
              {adminRoleConfirm?.makeAdmin ? 'Sim, Tornar Admin' : 'Sim, Remover Admin'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
