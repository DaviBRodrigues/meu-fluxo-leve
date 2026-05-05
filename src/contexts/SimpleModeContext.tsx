import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface SimpleModeContextValue {
  simpleMode: boolean;
  toggleSimpleMode: () => void;
  setSimpleMode: (v: boolean) => void;
}

const SimpleModeContext = createContext<SimpleModeContextValue | undefined>(undefined);

const STORAGE_KEY = 'simple-mode';

export function SimpleModeProvider({ children }: { children: ReactNode }) {
  const [simpleMode, setSimpleModeState] = useState<boolean>(() => {
    try { return localStorage.getItem(STORAGE_KEY) === 'true'; } catch { return false; }
  });

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, String(simpleMode)); } catch {}
  }, [simpleMode]);

  return (
    <SimpleModeContext.Provider
      value={{
        simpleMode,
        toggleSimpleMode: () => setSimpleModeState((v) => !v),
        setSimpleMode: setSimpleModeState,
      }}
    >
      {children}
    </SimpleModeContext.Provider>
  );
}

export function useSimpleMode() {
  const ctx = useContext(SimpleModeContext);
  if (!ctx) throw new Error('useSimpleMode must be used within SimpleModeProvider');
  return ctx;
}
