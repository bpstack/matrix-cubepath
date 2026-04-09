import { toast as sonner } from 'sonner';
import { t, LangKey } from './i18n';
import { useUiStore } from '../stores/ui.store';

function lang() {
  return useUiStore.getState().language;
}

export const toast = {
  success: (message: string) => sonner.success(message),
  error: (message: string) => sonner.error(message),
  // i18n helpers
  ok: (key: LangKey) => sonner.success(t(key, lang())),
  fail: (key: LangKey = 'toastError') => sonner.error(t(key, lang())),
};
