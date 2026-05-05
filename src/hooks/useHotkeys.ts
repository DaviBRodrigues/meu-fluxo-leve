import { useEffect } from 'react';

type HotkeyHandler = (e: KeyboardEvent) => void;

export interface HotkeyMap {
  [key: string]: HotkeyHandler;
}

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName.toLowerCase();
  if (tag === 'input' || tag === 'textarea' || tag === 'select') return true;
  if (target.isContentEditable) return true;
  return false;
}

/**
 * Registers global keyboard shortcuts.
 * Keys are case-insensitive. Use "mod+k" for Cmd/Ctrl+K.
 */
export function useHotkeys(map: HotkeyMap, enabled = true) {
  useEffect(() => {
    if (!enabled) return;

    const handler = (e: KeyboardEvent) => {
      const isMod = e.metaKey || e.ctrlKey;
      const key = e.key.toLowerCase();

      // mod+key combinations
      if (isMod) {
        const comboKey = `mod+${key}`;
        const fn = map[comboKey];
        if (fn) {
          e.preventDefault();
          fn(e);
          return;
        }
      }

      // Single-key shortcuts: ignore when typing
      if (isTypingTarget(e.target)) return;
      if (e.altKey || e.metaKey || e.ctrlKey) return;

      const fn = map[key];
      if (fn) {
        e.preventDefault();
        fn(e);
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [map, enabled]);
}
