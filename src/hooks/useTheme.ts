import { useState, useEffect, useCallback } from 'react';

export type ThemeAccent = {
  name: string;
  label: string;
  hue: number;
  saturation: number;
};

export const PRESET_ACCENTS: ThemeAccent[] = [
  { name: 'green', label: 'Verde', hue: 142, saturation: 76 },
  { name: 'blue', label: 'Azul', hue: 221, saturation: 83 },
  { name: 'purple', label: 'Roxo', hue: 262, saturation: 83 },
  { name: 'orange', label: 'Laranja', hue: 25, saturation: 95 },
  { name: 'pink', label: 'Rosa', hue: 330, saturation: 81 },
  { name: 'teal', label: 'Turquesa', hue: 173, saturation: 80 },
  { name: 'red', label: 'Vermelho', hue: 0, saturation: 84 },
  { name: 'yellow', label: 'Amarelo', hue: 48, saturation: 96 },
];

function applyAccentColor(hue: number, saturation: number, isDark: boolean) {
  const root = document.documentElement;
  const lightness = isDark ? 42 : 36;
  
  root.style.setProperty('--primary', `${hue} ${saturation}% ${lightness}%`);
  root.style.setProperty('--ring', `${hue} ${saturation}% ${lightness}%`);
  root.style.setProperty('--sidebar-primary', `${hue} ${saturation}% ${lightness}%`);
  root.style.setProperty('--sidebar-ring', `${hue} ${saturation}% ${lightness}%`);
  root.style.setProperty('--chart-1', `${hue} ${saturation}% ${lightness}%`);
  root.style.setProperty('--success', `${hue} ${saturation}% ${lightness}%`);
  root.style.setProperty('--income', `${hue} ${saturation}% ${lightness}%`);
}

function clearAccentColor() {
  const root = document.documentElement;
  const props = ['--primary', '--ring', '--sidebar-primary', '--sidebar-ring', '--chart-1', '--success', '--income'];
  props.forEach(p => root.style.removeProperty(p));
}

export function useTheme() {
  const [theme, setThemeState] = useState<'dark' | 'light'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('theme') as 'dark' | 'light') || 'dark';
    }
    return 'dark';
  });

  const [accent, setAccentState] = useState<{ hue: number; saturation: number; name: string }>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('theme-accent');
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    return { hue: 142, saturation: 76, name: 'green' };
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
    // Re-apply accent after theme change
    applyAccentColor(accent.hue, accent.saturation, theme === 'dark');
  }, [theme, accent]);

  const toggleTheme = useCallback(() => {
    setThemeState(prev => prev === 'dark' ? 'light' : 'dark');
  }, []);

  const setTheme = useCallback((t: 'dark' | 'light') => setThemeState(t), []);

  const setAccent = useCallback((hue: number, saturation: number, name: string) => {
    const value = { hue, saturation, name };
    setAccentState(value);
    localStorage.setItem('theme-accent', JSON.stringify(value));
  }, []);

  const setPresetAccent = useCallback((preset: ThemeAccent) => {
    setAccent(preset.hue, preset.saturation, preset.name);
  }, [setAccent]);

  const setCustomAccent = useCallback((hue: number) => {
    setAccent(hue, 76, 'custom');
  }, [setAccent]);

  const resetAccent = useCallback(() => {
    const defaultAccent = PRESET_ACCENTS[0];
    setAccent(defaultAccent.hue, defaultAccent.saturation, defaultAccent.name);
    clearAccentColor();
  }, [setAccent]);

  return { theme, toggleTheme, setTheme, accent, setPresetAccent, setCustomAccent, resetAccent };
}
