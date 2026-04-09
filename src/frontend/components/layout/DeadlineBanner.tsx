import { useDeadlines } from '../../hooks/useDeadlines';
import { useSettings } from '../../hooks/useSettings';
import { useUiStore } from '../../stores/ui.store';

export function DeadlineBanner() {
  const { language, setActiveTab, deadlinesHidden, toggleDeadlinesHidden } = useUiStore();
  const { data, isLoading } = useDeadlines();
  const { data: settings } = useSettings();

  const enabled = settings?.['deadlineAlerts'] !== 'false';
  if (isLoading || !data || data.total === 0 || !enabled) return null;

  if (deadlinesHidden) {
    return (
      <button
        onClick={toggleDeadlinesHidden}
        className="w-full px-3 py-1 text-xs flex items-center justify-center gap-2 bg-matrix-bg border-b border-matrix-border text-matrix-muted hover:text-gray-300 transition-colors"
        title={language === 'es' ? 'Mostrar alertas de vencimiento' : 'Show deadline alerts'}
      >
        <span className="opacity-60">👁</span>
        <span className="opacity-60">
          {data.total} {language === 'es' ? 'vencimiento(s)' : 'deadline(s)'}
        </span>
      </button>
    );
  }

  const { overdue, dueToday, dueSoon } = data;
  const tasks = [...overdue, ...dueToday, ...dueSoon].slice(0, 3);
  const remaining = overdue.length + dueToday.length + dueSoon.length - tasks.length;

  return (
    <div
      className={`px-3 py-1.5 text-xs flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between ${
        overdue.length > 0 ? 'bg-red-600' : 'bg-amber-500'
      }`}
    >
      <div className="flex items-center gap-2 flex-1 min-w-0 cursor-pointer" onClick={() => setActiveTab('tasks')}>
        <span className="text-white">⚠</span>
        <div className="flex items-center gap-1.5 flex-1 min-w-0 overflow-hidden">
          {tasks.map((t) => (
            <span key={t.id} className="text-white truncate max-w-[150px] text-xs" title={t.title}>
              {t.title}
            </span>
          ))}
          {remaining > 0 && (
            <span className="text-white/80 text-xs">
              +{remaining} {language === 'es' ? 'más' : 'more'}
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
        <span className="text-white/80 whitespace-nowrap cursor-pointer" onClick={() => setActiveTab('tasks')}>
          {language === 'es' ? 'Ver tareas →' : 'View tasks →'}
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleDeadlinesHidden();
          }}
          className="text-white/60 hover:text-white ml-1 p-0.5 rounded hover:bg-white/10"
          title={language === 'es' ? 'Ocultar' : 'Hide'}
        >
          👁
        </button>
      </div>
    </div>
  );
}
