import { useState } from 'react';
import logo from '@/assets/logo.jpg';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRoles } from '@/hooks/useUserRoles';
import { useProfile } from '@/hooks/useProfile';
import { useTheme } from '@/hooks/useTheme';
import { usePrivacy } from '@/contexts/PrivacyContext';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  LayoutDashboard,
  Receipt,
  Wallet,
  Target,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  Bell,
  PiggyBank,
  TrendingUp,
  History,
  Shield,
  Sun,
  Moon,
  HelpCircle,
  Eye,
  EyeOff,
  Search,
  Keyboard,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRecurringReminders } from '@/hooks/useRecurringReminders';
import { useLayoutTheme } from '@/contexts/LayoutThemeContext';
import { useSimpleMode } from '@/contexts/SimpleModeContext';
import { useShortcuts } from '@/contexts/ShortcutsContext';
import TutorialDialog from '@/components/tutorial/TutorialDialog';

const baseNavItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard, advanced: false },
  { href: '/transacoes', label: 'Transações', icon: Receipt, advanced: false },
  { href: '/contas', label: 'Contas', icon: Wallet, advanced: false },
  { href: '/investimentos', label: 'Investimentos', icon: TrendingUp, advanced: true },
  { href: '/orcamentos', label: 'Orçamentos', icon: PiggyBank, advanced: false },
  { href: '/metas', label: 'Metas', icon: Target, advanced: true },
  { href: '/relatorios', label: 'Relatórios', icon: BarChart3, advanced: true },
  { href: '/historico', label: 'Histórico', icon: History, advanced: false },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, signOut } = useAuth();
  const { isAdmin } = useUserRoles();
  const { profile } = useProfile();
  const { theme, toggleTheme } = useTheme();
  const { isPrivate, togglePrivacy } = usePrivacy();
  const location = useLocation();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);
  const { dueReminders } = useRecurringReminders();
  const { config } = useLayoutTheme();

  // Add admin link if user is admin
  const navItems = isAdmin
    ? [...baseNavItems, { href: '/admin', label: 'Admin', icon: Shield }]
    : baseNavItems;

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/auth');
    } catch (error) {
      console.error('Sign out error:', error);
      window.location.href = '/auth';
    }
  };

  const NavLinks = () => (
    <>
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = location.pathname === item.href;
        return (
          <Link
            key={item.href}
            to={item.href}
            onClick={() => setIsOpen(false)}
            className={cn(
              'flex items-center gap-3 px-4 py-3 rounded-lg transition-all relative',
              isActive
                ? 'text-primary bg-primary/5 font-semibold before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:w-1 before:h-6 before:bg-primary before:rounded-r-full'
                : 'text-muted-foreground hover:bg-accent hover:text-foreground'
            )}
          >
            <Icon className="w-5 h-5" />
            <span className="font-medium">{item.label}</span>
          </Link>
        );
      })}
    </>
  );

  const avatarUrl = profile?.avatar_url;
  const displayName = profile?.full_name || user?.email;
  const initials = profile?.full_name
    ? profile.full_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
    : user?.email?.slice(0, 2).toUpperCase() || 'U';

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "hidden lg:fixed lg:inset-y-0 lg:flex lg:flex-col border-r border-border",
          config.glassEnabled ? 'bg-card/80 backdrop-blur-sm' : 'bg-card'
        )}
        style={{ width: 'var(--sidebar-width)' }}
      >
        <div className="flex items-center gap-3 px-6 py-5 border-b border-border">
          <img src={logo} alt="Equilibra" className="w-10 h-10 rounded-xl" />
          <span className="text-lg font-bold">Equilibra</span>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-2">
          <NavLinks />
        </nav>
        <div className="p-4 border-t border-border space-y-2">
          <Button variant="ghost" className="w-full justify-start gap-3" onClick={() => setIsTutorialOpen(true)}>
            <HelpCircle className="w-4 h-4" />
            <span className="text-sm">Ver Tutorial</span>
          </Button>
          <Button variant="ghost" className="w-full justify-start gap-3" onClick={toggleTheme}>
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            <span className="text-sm">{theme === 'dark' ? 'Tema Claro' : 'Tema Escuro'}</span>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="w-full justify-start gap-3">
                <Avatar className="w-8 h-8">
                  {avatarUrl && <AvatarImage src={avatarUrl} alt="Avatar" />}
                  <AvatarFallback className="bg-primary/10 text-primary text-sm">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <span className="truncate text-sm">{displayName}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuItem onClick={() => navigate('/configuracoes')}>
                <Settings className="w-4 h-4 mr-2" />
                Configurações
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                <LogOut className="w-4 h-4 mr-2" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="lg:hidden sticky top-0 z-50 flex items-center justify-between px-4 py-3 border-b border-border bg-card/95 backdrop-blur">
        <div className="flex items-center gap-3">
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <div className="flex items-center gap-3 px-6 py-5 border-b border-border">
                <img src={logo} alt="Equilibra" className="w-10 h-10 rounded-xl" />
                <span className="text-lg font-bold">Equilibra</span>
              </div>
              <nav className="px-4 py-6 space-y-2">
                <NavLinks />
              </nav>
            </SheetContent>
          </Sheet>
          <span className="font-semibold">Equilibra</span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={togglePrivacy}>
            {isPrivate ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </Button>
          <Button variant="ghost" size="icon" onClick={toggleTheme}>
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </Button>
          {dueReminders.length > 0 && (
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full" />
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <Avatar className="w-8 h-8">
                  {avatarUrl && <AvatarImage src={avatarUrl} alt="Avatar" />}
                  <AvatarFallback className="bg-primary/10 text-primary text-sm">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setIsTutorialOpen(true)}>
                <HelpCircle className="w-4 h-4 mr-2" />
                Ver Tutorial
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/configuracoes')}>
                <Settings className="w-4 h-4 mr-2" />
                Configurações
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                <LogOut className="w-4 h-4 mr-2" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ paddingLeft: undefined }} className="lg:pl-[var(--sidebar-width)]">
        <div className="p-[var(--container-padding)] lg:p-[var(--container-padding-lg)]">{children}</div>
      </main>

      <TutorialDialog isOpen={isTutorialOpen} onClose={() => setIsTutorialOpen(false)} />
    </div>
  );
}