import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

export type GlobalPeriod = 'today' | 'week' | 'month' | 'all';

interface FiltersContextValue {
  period: GlobalPeriod;
  setPeriod: (p: GlobalPeriod) => void;
}

const FiltersContext = createContext<FiltersContextValue | undefined>(undefined);

const STORAGE_KEY = 'global-period-filter';

export function FiltersProvider({ children }: { children: ReactNode }) {
  const [period, setPeriodState] = useState<GlobalPeriod>(() => {
    try {
      const v = localStorage.getItem(STORAGE_KEY) as GlobalPeriod | null;
      return v || 'all';
    } catch {
      return 'all';
    }
  });

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, period); } catch {}
  }, [period]);

  return (
    <FiltersContext.Provider value={{ period, setPeriod: setPeriodState }}>
      {children}
    </FiltersContext.Provider>
  );
}

export function useFilters() {
  const ctx = useContext(FiltersContext);
  if (!ctx) throw new Error('useFilters must be used within FiltersProvider');
  return ctx;
}
