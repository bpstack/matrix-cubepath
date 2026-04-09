import React, { useState, useEffect, useRef } from 'react';
import { useProjects, Project } from '../../hooks/useProjects';
import { useStats } from '../../hooks/useStats';
import { useMission } from '../../hooks/useMission';
import { useObjectives } from '../../hooks/useObjectives';
import { useTasks, useUpdateTask } from '../../hooks/useTasks';
import { useCreateIdea } from '../../hooks/useIdeas';
import { useCreateTask } from '../../hooks/useTasks';
import { usePlans } from '../../hooks/usePlans';
import { useActivity } from '../../hooks/useActivity';
import { useUiStore } from '../../stores/ui.store';
import { t, LangKey } from '../../lib/i18n';
import { ProgressBar, SectionCard } from './primitives';
import { Dropdown } from '../ui/Dropdown';
import { ResizableTextarea } from '../ui/ResizableTextarea';
import { useNoteDates, useNote, useSaveNote } from '../../hooks/useNotes';

// --- StatsCard ---

export function StatsCard({ language }: { language: 'en' | 'es' }) {
  const { data: stats } = useStats();
  if (!stats) return null;
  const items = [
    {
      label: t('tasks' as LangKey, language),
      value: `${stats.completedTasks}/${stats.totalTasks}`,
      sub: stats.totalTasks > 0,
    },
    { label: t('activePlans' as LangKey, language), value: String(stats.activePlans) },
    { label: t('pendingIdeas' as LangKey, language), value: String(stats.pendingIdeas) },
    { label: t('completionRate' as LangKey, language), value: `${stats.completionRate}%` },
  ];
  return (
    <SectionCard title={t('globalStats' as LangKey, language)} icon="◪">
      <div className="grid grid-cols-2 gap-3">
        {items.map((item) => (
          <div key={item.label} className="text-center">
            <p className="text-lg font-semibold text-gray-200">{item.value}</p>
            <p className="text-[10px] text-matrix-muted">{item.label}</p>
          </div>
        ))}
      </div>
      {stats.totalTasks > 0 && (
        <div className="mt-3">
          <ProgressBar value={stats.completionRate} />
        </div>
      )}
    </SectionCard>
  );
}

// --- ActiveProjectsCard ---

export function ActiveProjectsCard({ language }: { language: 'en' | 'es' }) {
  const { data: allProjects } = useProjects();
  const { setActiveTab } = useUiStore();
  const active = (allProjects || []).filter((p: Project) => p.status === 'active').slice(0, 5);
  return (
    <SectionCard title={t('activeProjects' as LangKey, language)} icon="◫">
      {active.length === 0 ? (
        <p className="text-xs text-matrix-muted py-4 text-center">{t('noProjects' as LangKey, language)}</p>
      ) : (
        <div className="space-y-2">
          {active.map((p: Project) => (
            <button
              key={p.id}
              onClick={() => setActiveTab('projects')}
              className="w-full flex items-center gap-2 text-left hover:bg-white/[0.02] rounded px-1 py-1 transition-colors"
            >
              <span className="text-sm text-gray-300 flex-1 truncate">{p.name}</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full ${p.status === 'active' ? 'bg-green-500/10 text-green-400' : 'bg-matrix-border/50 text-matrix-muted'}`}
              >
                {p.status.charAt(0).toUpperCase() + p.status.slice(1)}
              </span>
              {p.scan && (
                <div className="w-12">
                  <ProgressBar value={p.scan.progressPercent} />
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </SectionCard>
  );
}

// --- RecentActivityCard ---

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

const activityIcons: Record<string, string> = {
  created: '+',
  completed: '✓',
  promoted: '↑',
  scanned: '⟲',
  deleted: '✕',
  decided: '⚖',
};

export function RecentActivityCard({ language }: { language: 'en' | 'es' }) {
  const { data: activity } = useActivity(10);
  return (
    <SectionCard title={t('recentActivity' as LangKey, language)} icon="⟲">
      {!activity || activity.length === 0 ? (
        <p className="text-xs text-matrix-muted py-4 text-center">{t('noActivity' as LangKey, language)}</p>
      ) : (
        <div className="space-y-1 max-h-48 overflow-y-auto pr-4">
          {activity.map((a) => (
            <div key={a.id} className="flex items-start gap-2 py-1 text-xs">
              <span className="text-matrix-accent shrink-0 w-3 text-center">{activityIcons[a.action] || '•'}</span>
              <span className="text-gray-400 flex-1 truncate">{a.description}</span>
              <span className="text-matrix-muted/50 shrink-0">{timeAgo(a.createdAt)}</span>
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  );
}

// --- QuickCaptureCard ---

export function QuickCaptureCard({ language }: { language: 'en' | 'es' }) {
  const [mode, setMode] = useState<'idea' | 'task'>('idea');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [planId, setPlanId] = useState<number | ''>('');
  const [saved, setSaved] = useState(false);

  const createIdea = useCreateIdea();
  const createTask = useCreateTask();
  const { data: plans } = usePlans();

  const isSaving = createIdea.isPending || createTask.isPending;

  const handleSave = () => {
    if (!title.trim() || isSaving) return;
    const onSuccess = () => {
      setTitle('');
      setDescription('');
      setPlanId('');
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    };
    if (mode === 'idea') {
      createIdea.mutate({ title: title.trim(), description: description.trim() || undefined }, { onSuccess });
    } else {
      if (!planId) return;
      createTask.mutate({ planId: Number(planId), title: title.trim() }, { onSuccess });
    }
  };

  const inputCls =
    'w-full bg-matrix-bg border border-matrix-border rounded px-2 py-1.5 text-sm text-gray-300 placeholder-gray-600 focus:outline-none focus:border-matrix-accent/60 transition-colors';

  return (
    <SectionCard title={t('quickCapture' as LangKey, language)} icon="✦">
      <div className="space-y-2">
        <div className="flex gap-1">
          {(['idea', 'task'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`text-xs px-3 py-1 rounded transition-colors ${mode === m ? 'bg-matrix-accent/10 text-matrix-accent' : 'text-matrix-muted hover:text-gray-300'}`}
            >
              {t(m as LangKey, language)}
            </button>
          ))}
        </div>
        {mode === 'task' && plans && (
          <Dropdown
            value={String(planId)}
            onChange={(val) => setPlanId(val ? Number(val) : '')}
            options={[
              { value: '', label: t('selectPlan' as LangKey, language) },
              ...plans.map((p) => ({ value: String(p.id), label: p.title })),
            ]}
          />
        )}
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={mode === 'idea' ? t('ideaTitle' as LangKey, language) : t('taskTitle' as LangKey, language)}
          className={inputCls}
          onKeyDown={(e) => e.key === 'Enter' && handleSave()}
        />
        {mode === 'idea' && (
          <ResizableTextarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t('descriptionOptional' as LangKey, language)}
            rows={2}
          />
        )}
        <div className="flex items-center gap-2">
          <button
            onClick={handleSave}
            disabled={!title.trim() || (mode === 'task' && !planId) || isSaving}
            className="text-xs px-3 py-1.5 bg-matrix-accent/10 text-matrix-accent rounded hover:bg-matrix-accent/20 transition-colors disabled:opacity-50"
          >
            {isSaving ? '...' : t('create' as LangKey, language)}
          </button>
          {saved && <span className="text-xs text-green-400">{t('saved' as LangKey, language)} ✓</span>}
          {(createIdea.isError || createTask.isError) && <span className="text-xs text-red-400">Error</span>}
        </div>
      </div>
    </SectionCard>
  );
}

// --- ObjectivesGlanceCard ---

export function ObjectivesGlanceCard({ language }: { language: 'en' | 'es' }) {
  const { data: missions } = useMission();
  const mission = missions?.[0];
  const { data: objectives } = useObjectives(mission?.id);

  return (
    <SectionCard title={language === 'es' ? 'Objetivos' : 'Objectives at a Glance'} icon="◎">
      {!objectives || objectives.length === 0 ? (
        <p className="text-xs text-matrix-muted py-4 text-center">
          {language === 'es' ? 'Sin objetivos' : 'No objectives yet'}
        </p>
      ) : (
        <div className="space-y-2.5">
          {objectives.map((obj) => (
            <div key={obj.id}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-300 truncate flex-1">{obj.title}</span>
                <span className="text-[10px] font-mono text-matrix-muted ml-2">{obj.progress}%</span>
              </div>
              <ProgressBar value={obj.progress} />
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  );
}

// --- FocusQueueCard ---

export function FocusQueueCard({ language }: { language: 'en' | 'es' }) {
  const { data: allTasks } = useTasks();
  const updateTask = useUpdateTask();

  const statusIcon: Record<string, string> = { pending: '○', in_progress: '◐', done: '●' };
  const statusColor: Record<string, string> = {
    pending: 'text-gray-500',
    in_progress: 'text-matrix-warning',
    done: 'text-matrix-success',
  };
  const nextStatus: Record<string, string> = { pending: 'in_progress', in_progress: 'done', done: 'pending' };
  const prioOrder: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 };
  const prioDot: Record<string, string> = {
    low: 'bg-gray-500',
    medium: 'bg-blue-400',
    high: 'bg-orange-400',
    urgent: 'bg-red-400',
  };

  const focusTasks = [...(allTasks || [])].sort((a, b) => {
    // done tasks go to the bottom
    if (a.status === 'done' && b.status !== 'done') return 1;
    if (a.status !== 'done' && b.status === 'done') return -1;
    return (prioOrder[a.priority] ?? 9) - (prioOrder[b.priority] ?? 9);
  });

  return (
    <SectionCard title={language === 'es' ? 'Cola de enfoque' : 'Focus Queue'} icon="▸">
      {focusTasks.length === 0 ? (
        <p className="text-xs text-matrix-muted py-4 text-center">{t('allClear' as LangKey, language)}</p>
      ) : (
        <div className="space-y-1 max-h-64 overflow-y-auto pr-4">
          {focusTasks.map((task) => (
            <div key={task.id} className="flex items-center gap-2 py-1 group">
              <button
                onClick={() => updateTask.mutate({ id: task.id, status: nextStatus[task.status] })}
                className={`text-xs ${statusColor[task.status]}`}
              >
                {statusIcon[task.status]}
              </button>
              <span
                className={`text-sm flex-1 truncate ${task.status === 'done' ? 'line-through text-gray-600' : 'text-gray-300'}`}
              >
                {task.title}
              </span>
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${prioDot[task.priority]}`} />
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  );
}

// --- TaskDistributionCard ---

export function TaskDistributionCard({ language }: { language: 'en' | 'es' }) {
  const { data: allTasks } = useTasks();

  const counts: Record<string, number> = { pending: 0, in_progress: 0, done: 0 };
  for (const t of allTasks || []) {
    counts[t.status] = (counts[t.status] || 0) + 1;
  }
  const total = Object.values(counts).reduce((s, v) => s + v, 0);

  const bars = [
    { key: 'done', label: language === 'es' ? 'Hecho' : 'Done', color: 'bg-green-500', count: counts.done },
    {
      key: 'in_progress',
      label: language === 'es' ? 'En progreso' : 'In Progress',
      color: 'bg-amber-500',
      count: counts.in_progress,
    },
    { key: 'pending', label: language === 'es' ? 'Pendiente' : 'Pending', color: 'bg-gray-500', count: counts.pending },
  ];

  return (
    <SectionCard title={language === 'es' ? 'Distribución de tareas' : 'Task Breakdown'} icon="◔">
      {total === 0 ? (
        <p className="text-xs text-matrix-muted py-4 text-center">{t('noTasks' as LangKey, language)}</p>
      ) : (
        <div className="space-y-2">
          {/* Stacked bar */}
          <div className="flex h-3 rounded-full overflow-hidden">
            {bars
              .filter((b) => b.count > 0)
              .map((b) => (
                <div key={b.key} className={`${b.color}/70`} style={{ width: `${(b.count / total) * 100}%` }} />
              ))}
          </div>
          {/* Legend */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            {bars.map((b) => (
              <div key={b.key} className="flex items-center gap-1.5 text-xs">
                <span className={`w-2 h-2 rounded-full ${b.color}/70`} />
                <span className="text-gray-400 flex-1">{b.label}</span>
                <span className="text-matrix-muted font-mono text-[10px]">{b.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </SectionCard>
  );
}

// --- UpcomingDeadlinesCard ---

export function UpcomingDeadlinesCard({ language }: { language: 'en' | 'es' }) {
  const { data: allTasks } = useTasks();

  const tasksWithDeadline = [...(allTasks || [])]
    .filter((t) => t.deadline && t.status !== 'done')
    .sort((a, b) => (a.deadline || '').localeCompare(b.deadline || ''))
    .slice(0, 5);

  const daysLeft = (d: string) => {
    const diff = Math.ceil((new Date(d).getTime() - Date.now()) / 86400000);
    return diff;
  };
  const daysColor = (d: number) =>
    d <= 1 ? 'text-red-400' : d <= 3 ? 'text-orange-400' : d <= 7 ? 'text-amber-400' : 'text-gray-500';

  // If no real deadlines, show mock data
  const mockDeadlines = [
    { title: 'API contracts finalization', deadline: '2026-03-12', dLeft: 3 },
    { title: 'Design review sprint 4', deadline: '2026-03-14', dLeft: 5 },
    { title: 'Staging deployment', deadline: '2026-03-16', dLeft: 7 },
    { title: 'Documentation update', deadline: '2026-03-20', dLeft: 11 },
  ];

  const hasReal = tasksWithDeadline.length > 0;
  const items = hasReal
    ? tasksWithDeadline.map((t) => ({ title: t.title, dLeft: daysLeft(t.deadline!) }))
    : mockDeadlines.map((m) => ({ title: m.title, dLeft: m.dLeft }));

  return (
    <SectionCard title={language === 'es' ? 'Próximos vencimientos' : 'Upcoming Deadlines'} icon="⏰">
      {!hasReal && (
        <p className="text-[10px] text-matrix-muted/50 mb-2 italic">{t('sampleData' as LangKey, language)}</p>
      )}
      <div className="space-y-1.5">
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            <span className={`${daysColor(item.dLeft)} font-mono text-[10px] w-7 text-right shrink-0`}>
              {item.dLeft <= 0 ? 'today' : `${item.dLeft}d`}
            </span>
            <span className="text-gray-400 flex-1 truncate">{item.title}</span>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

// --- DailyNotesCard ---

const WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

function formatDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function ScratchpadCard({ language }: { language: 'en' | 'es' }) {
  const today = formatDate(new Date());
  const [selectedDate, setSelectedDate] = useState(today);
  const [viewDate, setViewDate] = useState(new Date());
  const [draft, setDraft] = useState('');
  const [dirty, setDirty] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { data: dates } = useNoteDates();
  const { data: noteData } = useNote(selectedDate);
  const saveNote = useSaveNote();

  const datesSet = new Set(dates ?? []);

  // Load content from server when it arrives — only if the user hasn't started typing
  useEffect(() => {
    if (!dirty && noteData !== undefined) {
      setDraft(noteData.content);
    }
  }, [noteData, dirty]);

  // Reset dirty flag when date changes
  useEffect(() => {
    setDirty(false);
  }, [selectedDate]);

  const handleChange = (val: string) => {
    setDraft(val);
    setDirty(true);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      saveNote.mutate({ date: selectedDate, content: val });
      setDirty(false);
    }, 600);
  };

  const handleSave = () => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveNote.mutate({ date: selectedDate, content: draft });
    setDirty(false);
  };

  const getDays = () => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstDay = (new Date(year, month, 1).getDay() + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrev = new Date(year, month, 0).getDate();
    const days: { date: Date; current: boolean }[] = [];
    for (let i = firstDay - 1; i >= 0; i--)
      days.push({ date: new Date(year, month - 1, daysInPrev - i), current: false });
    for (let i = 1; i <= daysInMonth; i++) days.push({ date: new Date(year, month, i), current: true });
    const rem = 35 - days.length;
    for (let i = 1; i <= rem; i++) days.push({ date: new Date(year, month + 1, i), current: false });
    return days;
  };

  const label = new Date(selectedDate + 'T00:00:00').toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  return (
    <SectionCard title={t('dailyNotes', language)} icon="✏">
      {/* Calendar header */}
      <div className="flex items-center justify-between mb-1.5">
        <button
          onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))}
          className="p-0.5 text-gray-500 hover:text-gray-300 transition-colors"
        >
          ‹
        </button>
        <span className="text-[11px] text-gray-400">
          {MONTHS[viewDate.getMonth()]} {viewDate.getFullYear()}
        </span>
        <button
          onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))}
          className="p-0.5 text-gray-500 hover:text-gray-300 transition-colors"
        >
          ›
        </button>
      </div>

      {/* Weekday labels */}
      <div className="grid grid-cols-7 mb-0.5">
        {WEEKDAYS.map((d) => (
          <div key={d} className="text-[9px] text-center text-gray-600">
            {d}
          </div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 gap-y-0.5 mb-2">
        {getDays().map((day, i) => {
          const ds = formatDate(day.date);
          const isSelected = ds === selectedDate;
          const isToday = ds === today;
          const hasNote = datesSet.has(ds);
          return (
            <button
              key={i}
              disabled={!day.current}
              onClick={() => {
                if (!day.current || ds === selectedDate) return;
                // Flush pending save before switching
                if (saveTimer.current) {
                  clearTimeout(saveTimer.current);
                  if (dirty) saveNote.mutate({ date: selectedDate, content: draft });
                }
                setSelectedDate(ds);
              }}
              className={`relative text-[10px] py-0.5 rounded transition-colors
                ${!day.current ? 'text-gray-700 cursor-default' : ''}
                ${isSelected ? 'bg-matrix-accent text-white font-medium' : day.current ? 'text-gray-400 hover:bg-matrix-bg hover:text-gray-200' : ''}
                ${isToday && !isSelected ? 'ring-1 ring-matrix-accent/40' : ''}
              `}
            >
              {day.date.getDate()}
              {hasNote && !isSelected && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0.5 h-0.5 rounded-full bg-matrix-accent" />
              )}
            </button>
          );
        })}
      </div>

      {/* Note editor */}
      <div className="text-[10px] text-gray-500 mb-1">{label}</div>
      <ResizableTextarea
        value={draft}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={t('dailyNotesPlaceholder', language)}
        rows={4}
      />
      <div className="flex items-center justify-between mt-1">
        <p className="text-[10px] text-gray-600">
          {saveNote.isPending ? t('saving', language) : t('savedLower', language)}
        </p>
        <button
          onClick={handleSave}
          disabled={saveNote.isPending}
          className="text-[10px] px-2 py-0.5 bg-matrix-accent/10 text-matrix-accent rounded hover:bg-matrix-accent/20 transition-colors disabled:opacity-50"
        >
          {t('save', language)}
        </button>
      </div>
    </SectionCard>
  );
}
