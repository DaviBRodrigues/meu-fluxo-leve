import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface PrivacyContextType {
  isPrivate: boolean;
  togglePrivacy: () => void;
}

const PrivacyContext = createContext<PrivacyContextType>({ isPrivate: false, togglePrivacy: () => {} });

export function PrivacyProvider({ children }: { children: ReactNode }) {
  const [isPrivate, setIsPrivate] = useState(() => {
    return localStorage.getItem('privacy-mode') === 'true';
  });

  useEffect(() => {
    localStorage.setItem('privacy-mode', String(isPrivate));
  }, [isPrivate]);

  const togglePrivacy = () => setIsPrivate(prev => !prev);

  return (
    <PrivacyContext.Provider value={{ isPrivate, togglePrivacy }}>
      {children}
    </PrivacyContext.Provider>
  );
}

export const usePrivacy = () => useContext(PrivacyContext);
