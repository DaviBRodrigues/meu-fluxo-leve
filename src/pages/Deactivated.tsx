import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldX, Mail, LogOut } from 'lucide-react';

export default function Deactivated() {
  const { signOut } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader className="space-y-4">
          <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-2xl flex items-center justify-center">
            <ShieldX className="w-8 h-8 text-destructive" />
          </div>
          <CardTitle className="text-2xl font-bold text-destructive">
            Conta Desativada
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3 text-muted-foreground">
            <p>
              Sua conta foi <strong className="text-foreground">temporariamente desativada</strong> por um administrador do sistema.
            </p>
            <p>
              Enquanto sua conta estiver desativada, você não poderá acessar as funcionalidades do sistema.
            </p>
          </div>

          <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <div className="flex items-start gap-3">
              <Mail className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div className="text-left text-sm">
                <p className="font-medium text-amber-500">Precisa de ajuda?</p>
                <p className="text-muted-foreground mt-1">
                  Se você acredita que isso foi um engano ou deseja solicitar a reativação da sua conta, entre em contato com o suporte ou com o administrador do sistema.
                </p>
              </div>
            </div>
          </div>

          <Button
            variant="outline"
            className="w-full"
            onClick={() => signOut()}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sair da conta
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
