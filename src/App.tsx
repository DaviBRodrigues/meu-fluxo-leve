import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { useTheme } from "@/hooks/useTheme";
import { LayoutThemeProvider } from "@/contexts/LayoutThemeContext";
import Dashboard from "./pages/Dashboard";
import Auth from "./pages/Auth";
import Deactivated from "./pages/Deactivated";
import Income from "./pages/Income";
import Expenses from "./pages/Expenses";
import Accounts from "./pages/Accounts";
import Budgets from "./pages/Budgets";
import Goals from "./pages/Goals";
import Investments from "./pages/Investments";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import History from "./pages/History";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, isDeactivated } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (isDeactivated) {
    return <Deactivated />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/auth" element={<Auth />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/receitas"
        element={
          <ProtectedRoute>
            <Income />
          </ProtectedRoute>
        }
      />
      <Route
        path="/despesas"
        element={
          <ProtectedRoute>
            <Expenses />
          </ProtectedRoute>
        }
      />
      <Route
        path="/contas"
        element={
          <ProtectedRoute>
            <Accounts />
          </ProtectedRoute>
        }
      />
      <Route
        path="/investimentos"
        element={
          <ProtectedRoute>
            <Investments />
          </ProtectedRoute>
        }
      />
      <Route
        path="/orcamentos"
        element={
          <ProtectedRoute>
            <Budgets />
          </ProtectedRoute>
        }
      />
      <Route
        path="/metas"
        element={
          <ProtectedRoute>
            <Goals />
          </ProtectedRoute>
        }
      />
      <Route
        path="/relatorios"
        element={
          <ProtectedRoute>
            <Reports />
          </ProtectedRoute>
        }
      />
      <Route
        path="/configuracoes"
        element={
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
        }
      />
      <Route
        path="/historico"
        element={
          <ProtectedRoute>
            <History />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <Admin />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

function ThemedApp() {
  useTheme(); // Applies theme class to document
  return (
    <LayoutThemeProvider>
      <AppRoutes />
    </LayoutThemeProvider>
  );
}

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <ThemedApp />
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
