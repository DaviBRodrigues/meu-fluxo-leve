import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { useAvatar } from '@/hooks/useAvatar';
import AppLayout from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useCategories } from '@/hooks/useCategories';
import { useBudgets } from '@/hooks/useBudgets';
import { useRecurringReminders } from '@/hooks/useRecurringReminders';
import { useAccounts } from '@/hooks/useAccounts';
import { formatCurrency, getMonthName } from '@/lib/format';
import { Settings, Tag, Bell, PiggyBank, Plus, Trash2, Check, Camera, User, Palette, Brain } from 'lucide-react';
import ThemeSection from '@/components/settings/ThemeSection';
import { TransactionType } from '@/types/database';
import { toast } from 'sonner';

export default function SettingsPage() {
  const { user, loading, signOut } = useAuth();
  const { profile } = useProfile();
  const { uploadAvatar, uploading } = useAvatar();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [isBudgetDialogOpen, setIsBudgetDialogOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryType, setNewCategoryType] = useState<TransactionType>('expense');
  const [newCategoryColor, setNewCategoryColor] = useState('#3B82F6');

  const [budgetCategoryId, setBudgetCategoryId] = useState('');
  const [budgetAmount, setBudgetAmount] = useState('');

  const { categories, expenseCategories, createCategory } = useCategories();
  const { budgets, createBudget, deleteBudget } = useBudgets(new Date().getMonth() + 1, new Date().getFullYear());
  const { reminders, dueReminders } = useRecurringReminders();
  const { accounts } = useAccounts();

  if (loading) return null;
  if (!user) {
    navigate('/auth');
    return null;
  }

  const colors = [
    '#3B82F6', '#22C55E', '#EF4444', '#F97316',
    '#8B5CF6', '#EC4899', '#14B8A6', '#EAB308',
  ];

  const handleCreateCategory = () => {
    if (!newCategoryName.trim()) {
      toast.error('Nome da categoria é obrigatório');
      return;
    }

    createCategory.mutate({
      name: newCategoryName,
      type: newCategoryType,
      color: newCategoryColor,
    });

    setNewCategoryName('');
    setIsCategoryDialogOpen(false);
  };

  const handleCreateBudget = () => {
    if (!budgetCategoryId || !budgetAmount) {
      toast.error('Preencha todos os campos');
      return;
    }

    const amount = parseFloat(budgetAmount.replace(/\./g, '').replace(',', '.'));
    if (amount <= 0) {
      toast.error('Valor deve ser maior que zero');
      return;
    }

    createBudget.mutate({
      category_id: budgetCategoryId,
      amount,
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
    });

    setBudgetCategoryId('');
    setBudgetAmount('');
    setIsBudgetDialogOpen(false);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const currentMonth = getMonthName(new Date().getMonth() + 1);

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in max-w-4xl">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Settings className="w-7 h-7 text-primary" />
            Configurações
          </h1>
          <p className="text-muted-foreground mt-1">Gerencie suas preferências</p>
        </div>

        <Tabs defaultValue="appearance" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="appearance">Aparência</TabsTrigger>
            <TabsTrigger value="budgets">Orçamentos</TabsTrigger>
            <TabsTrigger value="categories">Categorias</TabsTrigger>
            <TabsTrigger value="reminders">Lembretes</TabsTrigger>
          </TabsList>

          {/* Appearance Tab */}
          <TabsContent value="appearance" className="mt-6">
            <ThemeSection />
          </TabsContent>

          {/* Budgets Tab */}
          <TabsContent value="budgets" className="mt-6 space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <PiggyBank className="w-5 h-5" />
                      Orçamentos de {currentMonth}
                    </CardTitle>
                    <CardDescription>
                      Defina limites de gastos por categoria
                    </CardDescription>
                  </div>
                  <Button onClick={() => setIsBudgetDialogOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Novo
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {budgets.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <PiggyBank className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhum orçamento definido</p>
                    <p className="text-sm">Defina limites para controlar seus gastos</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {budgets.map((budget) => (
                      <div
                        key={budget.id}
                        className="flex items-center justify-between p-3 rounded-lg border"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: budget.category?.color }}
                          />
                          <span className="font-medium">{budget.category?.name}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-semibold">{formatCurrency(Number(budget.amount))}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            onClick={() => deleteBudget.mutate(budget.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Categories Tab */}
          <TabsContent value="categories" className="mt-6 space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Tag className="w-5 h-5" />
                      Categorias Personalizadas
                    </CardTitle>
                    <CardDescription>
                      Crie categorias além das padrão
                    </CardDescription>
                  </div>
                  <Button onClick={() => setIsCategoryDialogOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Nova
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Despesas</h4>
                    <div className="flex flex-wrap gap-2">
                      {categories
                        .filter((c) => c.type === 'expense')
                        .map((category) => (
                          <div
                            key={category.id}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm"
                            style={{ borderColor: category.color }}
                          >
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: category.color }}
                            />
                            {category.name}
                            {category.is_default && (
                              <span className="text-xs text-muted-foreground">(padrão)</span>
                            )}
                          </div>
                        ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Receitas</h4>
                    <div className="flex flex-wrap gap-2">
                      {categories
                        .filter((c) => c.type === 'income')
                        .map((category) => (
                          <div
                            key={category.id}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm"
                            style={{ borderColor: category.color }}
                          >
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: category.color }}
                            />
                            {category.name}
                            {category.is_default && (
                              <span className="text-xs text-muted-foreground">(padrão)</span>
                            )}
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reminders Tab */}
          <TabsContent value="reminders" className="mt-6 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                  Lembretes de Despesas Fixas
                </CardTitle>
                <CardDescription>
                  {dueReminders.length > 0
                    ? `${dueReminders.length} lembrete(s) pendente(s) este mês`
                    : 'Nenhum lembrete pendente'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {reminders.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Bell className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhum lembrete configurado</p>
                    <p className="text-sm">
                      Lembretes são criados ao marcar uma despesa como "fixa" com lembrete
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {reminders.map((reminder) => {
                      const isDue = dueReminders.some((r) => r.id === reminder.id);
                      return (
                        <div
                          key={reminder.id}
                          className={`flex items-center justify-between p-3 rounded-lg border ${
                            isDue ? 'border-warning bg-warning/5' : ''
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className="w-4 h-4 rounded-full"
                              style={{ backgroundColor: reminder.category?.color }}
                            />
                            <div>
                              <span className="font-medium">{reminder.description}</span>
                              <p className="text-sm text-muted-foreground">
                                Dia {reminder.day_of_month} • {reminder.account?.name}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-semibold text-expense">
                              {formatCurrency(Number(reminder.amount))}
                            </span>
                            {isDue && (
                              <span className="text-xs bg-warning text-warning-foreground px-2 py-0.5 rounded-full">
                                Pendente
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Profile Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Perfil
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-6">
              <div className="relative group">
                <Avatar className="w-20 h-20">
                  {profile?.avatar_url && <AvatarImage src={profile.avatar_url} alt="Avatar" />}
                  <AvatarFallback className="bg-primary/10 text-primary text-xl">
                    {profile?.full_name
                      ? profile.full_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
                      : user.email?.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Camera className="w-6 h-6 text-white" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) await uploadAvatar(file);
                  }}
                />
              </div>
              <div>
                <p className="font-medium">{profile?.full_name || 'Sem nome'}</p>
                <p className="text-sm text-muted-foreground">{user.email}</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  {uploading ? 'Enviando...' : 'Alterar foto'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Account Section */}
        <Card>
          <CardHeader>
            <CardTitle>Conta</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="font-medium">Email</p>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>
            </div>
            <div className="pt-4 border-t">
              <Button variant="destructive" onClick={handleSignOut}>
                Sair da conta
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Create Category Dialog */}
        <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Nova Categoria</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Nome</Label>
                <Input
                  placeholder="Ex: Assinaturas, Pet..."
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select
                  value={newCategoryType}
                  onValueChange={(v) => setNewCategoryType(v as TransactionType)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="expense">Despesa</SelectItem>
                    <SelectItem value="income">Receita</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Cor</Label>
                <div className="flex gap-2 flex-wrap">
                  {colors.map((color) => (
                    <button
                      key={color}
                      type="button"
                      className={`w-8 h-8 rounded-lg transition-all ${
                        newCategoryColor === color ? 'ring-2 ring-offset-2 ring-primary' : ''
                      }`}
                      style={{ backgroundColor: color }}
                      onClick={() => setNewCategoryColor(color)}
                    />
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCategoryDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateCategory}>Criar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Create Budget Dialog */}
        <Dialog open={isBudgetDialogOpen} onOpenChange={setIsBudgetDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Novo Orçamento</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Categoria</Label>
                <Select value={budgetCategoryId} onValueChange={setBudgetCategoryId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {expenseCategories
                      .filter((c) => !budgets.some((b) => b.category_id === c.id))
                      .map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: category.color }}
                            />
                            {category.name}
                          </div>
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Limite mensal (R$)</Label>
                <Input
                  placeholder="0,00"
                  value={budgetAmount}
                  onChange={(e) => setBudgetAmount(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsBudgetDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateBudget}>Criar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}