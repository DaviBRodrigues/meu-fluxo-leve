import React from 'react';
import { Button } from '@/components/ui/button';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <div className="text-center space-y-4">
            <h2 className="text-xl font-bold text-foreground">Algo deu errado</h2>
            <p className="text-muted-foreground">Ocorreu um erro inesperado.</p>
            <Button onClick={() => {
              this.setState({ hasError: false });
              window.location.href = '/';
            }}>
              Voltar ao início
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
