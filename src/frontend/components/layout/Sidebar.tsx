import React, { Fragment } from 'react';
import { useUiStore, Tab } from '../../stores/ui.store';
import { t } from '../../lib/i18n';
import { useDeadlines } from '../../hooks/useDeadlines';
import { useSettings } from '../../hooks/useSettings';

const tabs: { key: Tab; icon: string }[] = [
  { key: 'overview', icon: '◈' },
  { key: 'projects', icon: '◫' },
  { key: 'tasks', icon: '☰' },
  { key: 'ideas', icon: '✦' },
  { key: 'docs', icon: '📄' },
  { key: 'settings', icon: '⚙' },
];

export function Sidebar() {
  const {
    activeTab,
    setActiveTab,
    sidebarCollapsed,
    sidebarOpen,
    toggleSidebar,
    closeSidebar,
    language,
    deadlinesHidden,
    docsIsDirty,
    setDocsIsDirty,
  } = useUiStore();
  const { data: deadlines } = useDeadlines();
  const { data: settings } = useSettings();

  const enabled = settings?.['deadlineAlerts'] !== 'false';
  const showLabels = !sidebarCollapsed || sidebarOpen;

  const handleTabClick = (tab: Tab) => {
    if (activeTab === 'docs' && docsIsDirty && tab !== 'docs') {
      const confirmed = window.confirm(
        language === 'es'
          ? '¿Tienes cambios sin guardar en Docs. ¿Salir igualmente?'
          : 'You have unsaved changes in Docs. Leave anyway?',
      );
      if (!confirmed) return;
      setDocsIsDirty(false);
    }
    setActiveTab(tab);
    closeSidebar();
  };

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' });
    closeSidebar();
    window.location.href = '/';
  }

  return (
    <>
      {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={closeSidebar} />}
      <aside
        className={[
          'bg-matrix-surface border-r border-matrix-border transition-all',
          'fixed inset-y-0 left-0 z-50 w-48 md:static md:z-auto',
          sidebarOpen ? 'flex flex-col' : 'hidden md:flex md:flex-col',
          sidebarCollapsed ? 'md:w-12' : 'md:w-48',
        ].join(' ')}
      >
        <div className="flex items-center justify-between h-10 px-3 border-b border-matrix-border">
          {showLabels && <span className="text-matrix-accent font-semibold text-sm tracking-wide">MATRIX</span>}
          <div className="flex items-center gap-2">
            <button
              onClick={closeSidebar}
              className="text-matrix-muted hover:text-gray-300 transition-colors text-sm md:hidden"
              aria-label="Close sidebar"
            >
              ✕
            </button>
            <button
              onClick={toggleSidebar}
              className="hidden md:block text-matrix-muted hover:text-gray-300 transition-colors text-xs"
            >
              {sidebarCollapsed ? '→' : '←'}
            </button>
          </div>
        </div>
        <nav className="flex-1 py-1">
          {tabs.map(({ key, icon }) => {
            const isActive = activeTab === key;
            const showBadge = key === 'tasks' && enabled && !deadlinesHidden && deadlines && deadlines.total > 0;
            return (
              <Fragment key={key}>
                <button
                  onClick={() => handleTabClick(key)}
                  className={`w-full flex items-center gap-2.5 px-3 py-1.5 text-sm transition-colors relative ${
                    isActive
                      ? 'bg-matrix-accent/10 text-matrix-accent'
                      : 'text-matrix-muted hover:text-matrix-accent hover:bg-matrix-accent/5'
                  }`}
                >
                  <span className="text-sm">{icon}</span>
                  {showLabels && <span className="text-sm">{t(key, language)}</span>}
                  {showBadge && (
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                      {deadlines.total > 9 ? '9+' : deadlines.total}
                    </span>
                  )}
                </button>
                {key === 'settings' && (
                  <>
                    <div className="border-t border-matrix-border mx-0 my-1" />
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-3 py-1.5 text-sm text-matrix-muted hover:text-red-400 hover:bg-red-400/5 transition-colors"
                      title={t('logout', language)}
                    >
                      <span className="text-sm">⏻</span>
                      {showLabels && <span>{t('logout', language)}</span>}
                    </button>
                  </>
                )}
              </Fragment>
            );
          })}
        </nav>
        {showLabels && (
          <div className="px-3 pb-3 pt-1 border-t border-matrix-border/40 mt-1">
            <a
              href="https://stackbp.es"
              target="_blank"
              rel="noopener noreferrer"
              className="block text-[10px] font-mono text-matrix-muted/60 hover:text-matrix-accent dark:hover:text-matrix-accent hover:text-purple-500 tracking-widest uppercase transition-colors duration-200 text-center py-1"
            >
              by stackbp.es
            </a>
          </div>
        )}
      </aside>
    </>
  );
}
