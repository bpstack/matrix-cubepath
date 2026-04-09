import React from 'react';
import { Sidebar } from './Sidebar';
import { useUiStore } from '../../stores/ui.store';
import { t } from '../../lib/i18n';
import { OverviewView } from '../overview/OverviewView';
import { TaskBoard } from '../tasks/TaskBoard';
import { SettingsView } from '../settings/SettingsView';
import { ProjectsView } from '../projects/ProjectsView';
import { IdeasView } from '../ideas/IdeasView';
import { DocsView } from '../docs/DocsView';
import { RightPanel } from './RightPanel';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';
import { ToastContainer } from '../ui/ToastContainer';
import { DialogContainer } from '../ui/DialogContainer';
import { DeadlineBanner } from './DeadlineBanner';

export function AppShell() {
  const { activeTab, language, openSidebar } = useUiStore();

  useKeyboardShortcuts();

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewView />;
      case 'projects':
        return <ProjectsView />;
      case 'tasks':
        return <TaskBoard />;
      case 'ideas':
        return <IdeasView />;
      case 'settings':
        return <SettingsView />;
      case 'docs':
        return <DocsView />;
      default:
        return (
          <div className="flex items-center justify-center h-full text-matrix-muted">
            <div className="text-center">
              <h2 className="text-2xl font-semibold text-gray-300 mb-2 capitalize">{t(activeTab, language)}</h2>
              <p className="text-sm">{t('selectTab', language)}</p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="flex flex-col h-screen bg-matrix-bg text-gray-200">
      <DeadlineBanner />
      <div className="flex items-center justify-between px-3 py-2 bg-matrix-surface border-b border-matrix-border md:hidden">
        <button
          onClick={openSidebar}
          className="text-matrix-muted hover:text-matrix-accent transition-colors text-lg leading-none"
          aria-label="Open sidebar"
        >
          ☰
        </button>
        <span className="text-sm text-matrix-accent font-medium tracking-wide">Matrix</span>
        <div className="w-5" />
      </div>
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-auto">{renderContent()}</main>
        <RightPanel activeTab={activeTab} />
      </div>
      <ToastContainer />
      <DialogContainer />
    </div>
  );
}
