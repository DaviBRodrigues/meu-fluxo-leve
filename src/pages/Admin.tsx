import { motion } from 'framer-motion';
import { Navigate } from 'react-router-dom';
import AppLayout from '@/components/layout/AppLayout';
import { useUserRoles } from '@/hooks/useUserRoles';
import { UsersSection } from '@/components/admin/UsersSection';
import { AccessCodesSection } from '@/components/admin/AccessCodesSection';
import { Shield, Loader2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function Admin() {
  const { isAdmin, isLoading: isLoadingRoles } = useUserRoles();

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
              Gerencie usuários, permissões e códigos de acesso
            </p>
          </div>
        </div>

        {/* Tabs for different sections */}
        <Tabs defaultValue="users" className="space-y-6">
          <TabsList>
            <TabsTrigger value="users">Usuários</TabsTrigger>
            <TabsTrigger value="access-codes">Códigos de Acesso</TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-6">
            <UsersSection />
          </TabsContent>

          <TabsContent value="access-codes" className="space-y-6">
            <AccessCodesSection />
          </TabsContent>
        </Tabs>
      </motion.div>
    </AppLayout>
  );
}
