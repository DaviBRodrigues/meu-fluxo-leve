import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

interface HotkeysHelpDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const shortcuts: Array<{ keys: string[]; label: string }> = [
  { keys: ['N'], label: 'Nova transação (despesa)' },
  { keys: ['R'], label: 'Nova receita' },
  { keys: ['D'], label: 'Nova despesa' },
  { keys: ['/'], label: 'Focar busca' },
  { keys: ['C'], label: 'Alternar visualização compacta' },
  { keys: ['⌘', 'K'], label: 'Abrir busca global' },
  { keys: ['?'], label: 'Mostrar este painel' },
];

export default function HotkeysHelpDialog({ isOpen, onClose }: HotkeysHelpDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Atalhos de teclado</DialogTitle>
          <DialogDescription>
            Use estas teclas para navegar mais rápido pelo Equilibra.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2 mt-2">
          {shortcuts.map((s) => (
            <div key={s.label} className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{s.label}</span>
              <div className="flex gap-1">
                {s.keys.map((k) => (
                  <kbd
                    key={k}
                    className="px-2 py-0.5 rounded border border-border bg-muted text-foreground text-xs font-mono"
                  >
                    {k}
                  </kbd>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
