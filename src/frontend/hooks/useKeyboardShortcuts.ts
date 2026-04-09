import { useEffect, useCallback } from 'react';
import { useUiStore } from '../stores/ui.store';
import { useShortcuts, parseShortcutKey } from './useShortcuts';

export function useKeyboardShortcuts() {
  const { setActiveTab, toggleSidebar, openQuickCreate } = useUiStore();
  const { shortcuts } = useShortcuts();

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('[data-shortcut-recorder]')) return;
      const tag = target.tagName;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(tag)) return;

      for (const shortcut of shortcuts) {
        const parsed = parseShortcutKey(shortcut.key);
        if (!parsed) continue;

        const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
        const ctrlMatch = parsed.ctrl ? (isMac ? e.metaKey : e.ctrlKey) : !(isMac ? e.metaKey : e.ctrlKey);
        const altMatch = parsed.alt ? e.altKey : !e.altKey;
        const shiftMatch = parsed.shift ? e.shiftKey : !e.shiftKey;
        const keyMatch = e.key.toLowerCase() === parsed.key.toLowerCase();

        if (ctrlMatch && altMatch && shiftMatch && keyMatch) {
          e.preventDefault();

          switch (shortcut.action) {
            case 'overview':
            case 'projects':
            case 'tasks':
            case 'ideas':
            case 'settings':
              setActiveTab(shortcut.action);
              break;
            case 'quickTask':
              setActiveTab('tasks');
              openQuickCreate('task');
              break;
            case 'quickIdea':
              setActiveTab('ideas');
              openQuickCreate('idea');
              break;
            case 'toggleSidebar':
              toggleSidebar();
              break;
          }
          return;
        }
      }
    },
    [shortcuts, setActiveTab, toggleSidebar, openQuickCreate],
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}
