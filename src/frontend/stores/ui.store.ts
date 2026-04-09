import { create } from 'zustand';

export type Tab = 'overview' | 'projects' | 'tasks' | 'ideas' | 'docs' | 'settings';
export type Theme = 'dark' | 'light';

interface UiState {
  activeTab: Tab;
  sidebarCollapsed: boolean;
  sidebarOpen: boolean;
  language: 'en' | 'es';
  theme: Theme;
  quickCreateModal: { type: 'task' | 'idea' | null };
  deadlinesHidden: boolean;
  isDemo: boolean;
  switchingLanguage: boolean;
  docsSelectedFileId: number | null;
  docsIsDirty: boolean;
  setActiveTab: (tab: Tab) => void;
  toggleSidebar: () => void;
  openSidebar: () => void;
  closeSidebar: () => void;
  setLanguage: (lang: 'en' | 'es') => void;
  setTheme: (theme: Theme) => void;
  openQuickCreate: (type: 'task' | 'idea') => void;
  closeQuickCreate: () => void;
  toggleDeadlinesHidden: () => void;
  setIsDemo: (isDemo: boolean) => void;
  setSwitchingLanguage: (v: boolean) => void;
  setDocsSelectedFileId: (id: number | null) => void;
  setDocsIsDirty: (dirty: boolean) => void;
}

export const useUiStore = create<UiState>((set) => ({
  activeTab: 'overview',
  sidebarCollapsed: false,
  sidebarOpen: false,
  language: 'es',
  theme: 'dark',
  quickCreateModal: { type: null },
  deadlinesHidden: false,
  isDemo: false,
  switchingLanguage: false,
  docsSelectedFileId: null,
  docsIsDirty: false,
  setActiveTab: (tab) => set({ activeTab: tab }),
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  openSidebar: () => set({ sidebarOpen: true }),
  closeSidebar: () => set({ sidebarOpen: false }),
  setLanguage: (language) => set({ language }),
  setTheme: (theme) => set({ theme }),
  openQuickCreate: (type) => set({ quickCreateModal: { type } }),
  closeQuickCreate: () => set({ quickCreateModal: { type: null } }),
  toggleDeadlinesHidden: () => set((s) => ({ deadlinesHidden: !s.deadlinesHidden })),
  setIsDemo: (isDemo) => set({ isDemo }),
  setSwitchingLanguage: (switchingLanguage) => set({ switchingLanguage }),
  setDocsSelectedFileId: (docsSelectedFileId) => set({ docsSelectedFileId }),
  setDocsIsDirty: (docsIsDirty) => set({ docsIsDirty }),
}));
