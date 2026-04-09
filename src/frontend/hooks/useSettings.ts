import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast as sonner } from 'sonner';
import { apiFetch } from '../lib/api';
import { t } from '../lib/i18n';
import { useUiStore } from '../stores/ui.store';

interface GitHubStatus {
  configured: boolean;
  connected: boolean;
  username?: string;
}

export function useSettings() {
  return useQuery<Record<string, string>>({
    queryKey: ['settings'],
    queryFn: () => apiFetch('/settings'),
  });
}

export function useUpdateSetting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ key, value }: { key: string; value: string }) =>
      apiFetch(`/settings/${key}`, { method: 'PUT', body: JSON.stringify({ value }) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['settings'] });
      qc.invalidateQueries({ queryKey: ['github-status'] });
    },
  });
}

/**
 * Centralised language switch: updates store, persists to backend,
 * re-seeds demo DB if needed, and invalidates all queries so data refreshes
 * without a full page reload. Shows a toast during the operation.
 *
 * Returns a function that accepts an optional target language.
 * Without argument it toggles; with argument it switches to that language.
 */
export function useLanguageSwitch() {
  const qc = useQueryClient();
  const updateSetting = useUpdateSetting();
  const { language, setLanguage, isDemo, setSwitchingLanguage } = useUiStore();

  return useCallback(
    (target?: 'en' | 'es') => {
      const next = target ?? (language === 'en' ? 'es' : 'en');
      if (next === language) return;

      const toastId = sonner.loading(t('toastLangSwitching', next));
      if (isDemo) setSwitchingLanguage(true);
      setLanguage(next);

      updateSetting
        .mutateAsync({ key: 'language', value: next })
        .then(async () => {
          if (isDemo) await qc.invalidateQueries();
          setSwitchingLanguage(false);
          sonner.success(t('toastLangDone', next), { id: toastId });
        })
        .catch(() => {
          setSwitchingLanguage(false);
          setLanguage(language);
          sonner.error(t('toastError', language), { id: toastId });
        });
    },
    [language, isDemo, setLanguage, setSwitchingLanguage, updateSetting, qc],
  );
}

export function useGitHubStatus() {
  return useQuery<GitHubStatus>({
    queryKey: ['github-status'],
    queryFn: () => apiFetch('/settings/github-status'),
  });
}
