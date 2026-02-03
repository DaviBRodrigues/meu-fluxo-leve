import { useState } from 'react';
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
import { Button } from '@/components/ui/button';
import { AlertTriangle, Loader2 } from 'lucide-react';

interface DeleteConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
  itemName?: string;
  affectsBalance?: boolean;
  isLoading?: boolean;
}

export function DeleteConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirmar exclusão',
  description = 'Tem certeza que deseja remover este item?',
  itemName,
  affectsBalance = true,
  isLoading = false,
}: DeleteConfirmDialogProps) {
  const [step, setStep] = useState<1 | 2>(1);

  const handleClose = () => {
    setStep(1);
    onClose();
  };

  const handleFirstConfirm = () => {
    if (affectsBalance) {
      setStep(2);
    } else {
      onConfirm();
      handleClose();
    }
  };

  const handleSecondConfirm = () => {
    onConfirm();
    handleClose();
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={handleClose}>
      <AlertDialogContent>
        {step === 1 ? (
          <>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                {title}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {description}
                {itemName && (
                  <span className="block mt-2 font-medium text-foreground">
                    "{itemName}"
                  </span>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleFirstConfirm}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Sim, remover
              </AlertDialogAction>
            </AlertDialogFooter>
          </>
        ) : (
          <>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                Confirmação Final
              </AlertDialogTitle>
              <AlertDialogDescription className="space-y-2">
                <span className="block font-semibold text-foreground">
                  Esta ação atualizará o seu saldo atual.
                </span>
                <span className="block">
                  O registro permanecerá no histórico para conferência futura, 
                  marcado como "Excluído".
                </span>
                <span className="block font-medium text-destructive">
                  Confirmar exclusão definitiva?
                </span>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <Button variant="outline" onClick={handleClose}>
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={handleSecondConfirm}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Confirmar exclusão definitiva'
                )}
              </Button>
            </AlertDialogFooter>
          </>
        )}
      </AlertDialogContent>
    </AlertDialog>
  );
}
