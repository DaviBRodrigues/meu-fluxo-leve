import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import AppLayout from '@/components/layout/AppLayout';
import ImportTransactions from '@/components/transactions/ImportTransactions';
import { Upload } from 'lucide-react';

export default function Import() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  if (loading) return null;
  if (!user) {
    navigate('/auth');
    return null;
  }

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in max-w-4xl">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Upload className="w-7 h-7 text-primary" />
            Importar Transações
          </h1>
          <p className="text-muted-foreground mt-1">
            Importe transações em massa a partir de um arquivo CSV
          </p>
        </div>

        <ImportTransactions />
      </div>
    </AppLayout>
  );
}
