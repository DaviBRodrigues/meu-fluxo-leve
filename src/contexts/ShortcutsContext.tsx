import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useHotkeys } from '@/hooks/useHotkeys';
import CommandPalette from '@/components/shared/CommandPalette';
import HotkeysHelpDialog from '@/components/shared/HotkeysHelpDialog';

interface ShortcutsContextValue {
  openCommandPalette: () => void;
  openHelp: () => void;
  setNewTransactionHandler: (fn: ((type: 'income' | 'expense') => void) | null) => void;
  toggleCompact: () => void;
}

const ShortcutsContext = createContext<ShortcutsContextValue | undefined>(undefined);

export function ShortcutsProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [newTransactionHandler, setNewTransactionHandlerState] = useState<
    ((type: 'income' | 'expense') => void) | null
  >(null);

  const setNewTransactionHandler = useCallback(
    (fn: ((type: 'income' | 'expense') => void) | null) => {
      setNewTransactionHandlerState(() => fn);
    },
    []
  );

  const toggleCompact = useCallback(() => {
    try {
      const current = localStorage.getItem('transaction-compact-view') === 'true';
      localStorage.setItem('transaction-compact-view', String(!current));
      // Notify listeners across tabs and within the same tab
      window.dispatchEvent(new StorageEvent('storage', { key: 'transaction-compact-view' }));
    } catch {}
  }, []);

  const triggerNew = (type: 'income' | 'expense') => {
    if (newTransactionHandler) {
      newTransactionHandler(type);
    } else {
      navigate('/transacoes', { state: { newType: type } });
    }
  };

  useHotkeys({
    'mod+k': () => setPaletteOpen(true),
    n: () => triggerNew('expense'),
    r: () => triggerNew('income'),
    d: () => triggerNew('expense'),
    c: () => toggleCompact(),
    '?': () => setHelpOpen(true),
    '/': (e) => {
      // Focus first search input on the page
      const input = document.querySelector<HTMLInputElement>(
        'input[placeholder*="Buscar" i], input[type="search"]'
      );
      if (input) {
        e.preventDefault();
        input.focus();
      }
    },
  });

  return (
    <ShortcutsContext.Provider
      value={{
        openCommandPalette: () => setPaletteOpen(true),
        openHelp: () => setHelpOpen(true),
        setNewTransactionHandler,
        toggleCompact,
      }}
    >
      {children}
      <CommandPalette isOpen={paletteOpen} onClose={() => setPaletteOpen(false)} />
      <HotkeysHelpDialog isOpen={helpOpen} onClose={() => setHelpOpen(false)} />
    </ShortcutsContext.Provider>
  );
}

export function useShortcuts() {
  const ctx = useContext(ShortcutsContext);
  if (!ctx) throw new Error('useShortcuts must be used within ShortcutsProvider');
  return ctx;
}
