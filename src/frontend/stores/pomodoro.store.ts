import { create } from 'zustand';

interface PomodoroState {
  isFocusActive: boolean;
  tasksCompletedInSession: number;
  setFocusActive: (active: boolean) => void;
  incrementFocusTasks: () => void;
  resetSessionTasks: () => void;
}

export const usePomodoroStore = create<PomodoroState>((set) => ({
  isFocusActive: false,
  tasksCompletedInSession: 0,
  setFocusActive: (active) => set({ isFocusActive: active }),
  incrementFocusTasks: () => set((s) => ({ tasksCompletedInSession: s.tasksCompletedInSession + 1 })),
  resetSessionTasks: () => set({ tasksCompletedInSession: 0 }),
}));
