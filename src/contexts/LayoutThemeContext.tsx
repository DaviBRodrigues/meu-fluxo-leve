import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export type LayoutPreset = 'modern-glass' | 'professional-compact' | 'neumorphic-soft';

export interface LayoutThemeConfig {
  name: LayoutPreset;
  label: string;
  description: string;
  radius: string;
  fontFamily: string;
  numberFontFamily: string;
  containerPadding: string;
  containerPaddingLg: string;
  sidebarWidth: string;
  cardShadow: string;
  cardShadowDark: string;
  cardBorder: string;
  cardBg: string;
  cardBgDark: string;
  buttonShadow: string;
  glassEnabled: boolean;
}

export const LAYOUT_PRESETS: Record<LayoutPreset, LayoutThemeConfig> = {
  'modern-glass': {
    name: 'modern-glass',
    label: 'Modern Glass',
    description: 'Glassmorphism, bordas suaves, sombras elegantes',
    radius: '0.75rem',
    fontFamily: "'Inter', 'system-ui', sans-serif",
    numberFontFamily: "'Inter', 'system-ui', sans-serif",
    containerPadding: '1rem',
    containerPaddingLg: '2rem',
    sidebarWidth: '16rem',
    cardShadow: '0 1px 3px 0 rgba(0,0,0,0.06), 0 1px 2px -1px rgba(0,0,0,0.06)',
    cardShadowDark: '0 1px 3px 0 rgba(0,0,0,0.3), 0 1px 2px -1px rgba(0,0,0,0.3)',
    cardBorder: '1px solid hsl(var(--border))',
    cardBg: 'hsl(var(--card) / 0.8)',
    cardBgDark: 'hsl(var(--card) / 0.8)',
    buttonShadow: '0 1px 2px 0 rgba(0,0,0,0.05)',
    glassEnabled: true,
  },
  'professional-compact': {
    name: 'professional-compact',
    label: 'Professional Compact',
    description: 'Compacto, bordas retas, máxima densidade de dados',
    radius: '0.25rem',
    fontFamily: "'Inter', 'system-ui', sans-serif",
    numberFontFamily: "'JetBrains Mono', 'Fira Code', monospace",
    containerPadding: '0.75rem',
    containerPaddingLg: '1.25rem',
    sidebarWidth: '14rem',
    cardShadow: 'none',
    cardShadowDark: 'none',
    cardBorder: '1px solid hsl(var(--border))',
    cardBg: 'hsl(var(--card))',
    cardBgDark: 'hsl(var(--card))',
    buttonShadow: 'none',
    glassEnabled: false,
  },
  'neumorphic-soft': {
    name: 'neumorphic-soft',
    label: 'Neumorphic Soft',
    description: 'Profundidade, sombras internas/externas, visual 3D',
    radius: '1.25rem',
    fontFamily: "'Inter', 'system-ui', sans-serif",
    numberFontFamily: "'Inter', 'system-ui', sans-serif",
    containerPadding: '1.25rem',
    containerPaddingLg: '2.5rem',
    sidebarWidth: '17rem',
    cardShadow: '6px 6px 12px rgba(0,0,0,0.08), -6px -6px 12px rgba(255,255,255,0.8)',
    cardShadowDark: '6px 6px 12px rgba(0,0,0,0.4), -6px -6px 12px rgba(255,255,255,0.03)',
    cardBorder: 'none',
    cardBg: 'hsl(var(--card))',
    cardBgDark: 'hsl(var(--card))',
    buttonShadow: '3px 3px 6px rgba(0,0,0,0.08), -3px -3px 6px rgba(255,255,255,0.8)',
    glassEnabled: false,
  },
};

function applyLayoutPreset(preset: LayoutThemeConfig, isDark: boolean) {
  const root = document.documentElement;
  root.style.setProperty('--radius', preset.radius);
  root.style.setProperty('--font-family', preset.fontFamily);
  root.style.setProperty('--number-font-family', preset.numberFontFamily);
  root.style.setProperty('--container-padding', preset.containerPadding);
  root.style.setProperty('--container-padding-lg', preset.containerPaddingLg);
  root.style.setProperty('--sidebar-width', preset.sidebarWidth);
  root.style.setProperty('--card-shadow', isDark ? preset.cardShadowDark : preset.cardShadow);
  root.style.setProperty('--button-shadow', isDark ? 'none' : preset.buttonShadow);

  // Toggle data attribute for conditional styling
  root.setAttribute('data-layout', preset.name);
}

interface LayoutThemeContextType {
  layoutPreset: LayoutPreset;
  config: LayoutThemeConfig;
  setLayoutPreset: (preset: LayoutPreset) => void;
}

const LayoutThemeContext = createContext<LayoutThemeContextType | undefined>(undefined);

export function LayoutThemeProvider({ children }: { children: React.ReactNode }) {
  const [layoutPreset, setLayoutState] = useState<LayoutPreset>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('layout-preset') as LayoutPreset) || 'modern-glass';
    }
    return 'modern-glass';
  });

  const config = LAYOUT_PRESETS[layoutPreset];

  useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark');
    applyLayoutPreset(config, isDark);

    // Observe dark class changes to re-apply shadows
    const observer = new MutationObserver(() => {
      const nowDark = document.documentElement.classList.contains('dark');
      applyLayoutPreset(LAYOUT_PRESETS[layoutPreset], nowDark);
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    return () => observer.disconnect();
  }, [layoutPreset, config]);

  const setLayoutPreset = useCallback((preset: LayoutPreset) => {
    setLayoutState(preset);
    localStorage.setItem('layout-preset', preset);
  }, []);

  return (
    <LayoutThemeContext.Provider value={{ layoutPreset, config, setLayoutPreset }}>
      {children}
    </LayoutThemeContext.Provider>
  );
}

export function useLayoutTheme() {
  const ctx = useContext(LayoutThemeContext);
  if (!ctx) throw new Error('useLayoutTheme must be used within LayoutThemeProvider');
  return ctx;
}
