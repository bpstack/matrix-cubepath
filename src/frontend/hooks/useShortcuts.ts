import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../lib/api';

export type ShortcutAction =
  | 'overview'
  | 'projects'
  | 'tasks'
  | 'ideas'
  | 'passwords'
  | 'settings'
  | 'quickTask'
  | 'quickIdea'
  | 'toggleSidebar';

export interface Shortcut {
  key: string;
  action: ShortcutAction;
  label: string;
}

export const DEFAULT_SHORTCUTS: Shortcut[] = [
  { key: 'Alt+1', action: 'overview', label: 'Overview' },
  { key: 'Alt+2', action: 'projects', label: 'Projects' },
  { key: 'Alt+3', action: 'tasks', label: 'Tasks' },
  { key: 'Alt+4', action: 'ideas', label: 'Ideas' },
  { key: 'Alt+5', action: 'passwords', label: 'Passwords' },
  { key: 'Alt+,', action: 'settings', label: 'Settings' },
  { key: 'Alt+T', action: 'quickTask', label: 'Quick Task' },
  { key: 'Alt+I', action: 'quickIdea', label: 'Quick Idea' },
  { key: 'Alt+B', action: 'toggleSidebar', label: 'Toggle Sidebar' },
];

export function parseShortcutKey(
  shortcutKey: string,
): { ctrl: boolean; alt: boolean; shift: boolean; key: string } | null {
  const parts = shortcutKey.split('+').map((p) => p.trim());
  if (parts.length === 0) return null;

  const key = parts[parts.length - 1];
  if (!key) return null;

  const modifiers = parts.slice(0, -1).map((m) => m.toLowerCase());
  return {
    ctrl: modifiers.includes('ctrl') || modifiers.includes('cmd'),
    alt: modifiers.includes('alt'),
    shift: modifiers.includes('shift'),
    key,
  };
}

export function formatKeyCombo(e: KeyboardEvent): string | null {
  const key = e.key;
  // Ignore standalone modifier presses
  if (['Control', 'Alt', 'Shift', 'Meta'].includes(key)) return null;

  const parts: string[] = [];
  if (e.ctrlKey || e.metaKey) parts.push('Ctrl');
  if (e.altKey) parts.push('Alt');
  if (e.shiftKey) parts.push('Shift');

  // Need at least one modifier
  if (parts.length === 0) return null;

  // Normalize the key display
  let displayKey = key.length === 1 ? key.toUpperCase() : key;
  // Handle special keys
  if (displayKey === ' ') displayKey = 'Space';

  parts.push(displayKey);
  return parts.join('+');
}

const SHORTCUTS_KEY = 'shortcuts';

export function useShortcuts() {
  const qc = useQueryClient();

  const { data: shortcuts, isLoading } = useQuery<Shortcut[]>({
    queryKey: ['shortcuts'],
    queryFn: async () => {
      const settings = await apiFetch<Record<string, string>>('/settings');
      const stored = settings[SHORTCUTS_KEY];
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch {
          return DEFAULT_SHORTCUTS;
        }
      }
      return DEFAULT_SHORTCUTS;
    },
    staleTime: Infinity,
  });

  const updateShortcuts = useMutation({
    mutationFn: async (newShortcuts: Shortcut[]) => {
      await apiFetch(`/settings/${SHORTCUTS_KEY}`, {
        method: 'PUT',
        body: JSON.stringify({ value: JSON.stringify(newShortcuts) }),
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['shortcuts'] });
    },
  });

  const resetToDefaults = useMutation({
    mutationFn: async () => {
      await apiFetch(`/settings/${SHORTCUTS_KEY}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['shortcuts'] });
    },
  });

  return {
    shortcuts: shortcuts ?? DEFAULT_SHORTCUTS,
    isLoading,
    updateShortcuts,
    resetToDefaults,
  };
}
