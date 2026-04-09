import { create } from 'zustand';

export type ToastType = 'error' | 'warn' | 'info' | 'success';

interface Toast {
  id: string;
  type: ToastType;
  message: string;
  ttl: number;
}

interface ToastState {
  toasts: Toast[];
  timeouts: Map<string, ReturnType<typeof setTimeout>>;
  addToast: (type: ToastType, message: string, ttl?: number) => void;
  removeToast: (id: string) => void;
}

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],
  timeouts: new Map(),
  addToast: (type, message, ttl) => {
    const id = Math.random().toString(36).substring(2, 9);
    const defaultTtl = type === 'error' ? 3000 : type === 'warn' ? 2500 : 2000;
    const timeout = setTimeout(() => {
      get().removeToast(id);
    }, ttl ?? defaultTtl);
    set((state) => ({
      toasts: [...state.toasts, { id, type, message, ttl: ttl ?? defaultTtl }],
      timeouts: new Map(state.timeouts).set(id, timeout),
    }));
  },
  removeToast: (id) => {
    const timeout = get().timeouts.get(id);
    if (timeout) {
      clearTimeout(timeout);
      const newTimeouts = new Map(get().timeouts);
      newTimeouts.delete(id);
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id),
        timeouts: newTimeouts,
      }));
    }
  },
}));
