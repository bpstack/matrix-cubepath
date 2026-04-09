import { create } from 'zustand';

// ── Types ─────────────────────────────────────────────────────────────────────

interface ConfirmOptions {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
}

interface PromptOptions {
  title: string;
  description?: string;
  placeholder?: string;
  defaultValue?: string;
  confirmLabel?: string;
  cancelLabel?: string;
}

interface ConfirmState {
  type: 'confirm';
  options: ConfirmOptions;
  resolve: (value: boolean) => void;
}

interface PromptState {
  type: 'prompt';
  options: PromptOptions;
  resolve: (value: string | null) => void;
}

type DialogState = ConfirmState | PromptState | null;

interface DialogStore {
  dialog: DialogState;
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  prompt: (options: PromptOptions) => Promise<string | null>;
  _resolve: (value: boolean | string | null) => void;
  _close: () => void;
}

// ── Store ─────────────────────────────────────────────────────────────────────

export const useDialogStore = create<DialogStore>((set, get) => ({
  dialog: null,

  confirm: (options) =>
    new Promise<boolean>((resolve) => {
      set({ dialog: { type: 'confirm', options, resolve } });
    }),

  prompt: (options) =>
    new Promise<string | null>((resolve) => {
      set({ dialog: { type: 'prompt', options, resolve } });
    }),

  _resolve: (value) => {
    const { dialog } = get();
    if (!dialog) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (dialog.resolve as (v: any) => void)(value);
    set({ dialog: null });
  },

  _close: () => {
    const { dialog } = get();
    if (!dialog) return;
    if (dialog.type === 'confirm') {
      dialog.resolve(false);
    } else {
      dialog.resolve(null);
    }
    set({ dialog: null });
  },
}));
