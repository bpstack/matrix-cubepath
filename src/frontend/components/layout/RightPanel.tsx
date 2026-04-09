import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSystemStatus, useWakeService } from '../../hooks/useSystemStatus';
import { Tab, useUiStore } from '../../stores/ui.store';
import { usePomodoroStore } from '../../stores/pomodoro.store';
import { t, LangKey } from '../../lib/i18n';
import { useDailyQuote } from '../../hooks/useDailyQuote';
import { useDevFeed } from '../../hooks/useDevFeed';
import { useActivityMetrics } from '../../hooks/useActivityMetrics';
import { useTopScoredIdeas, useIdeaFunnel } from '../../hooks/useIdeasPipeline';
import { useDeadlines } from '../../hooks/useDeadlines';

/* ── Shared card wrapper ── */
function PanelCard({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <div className="bg-matrix-surface border border-matrix-border rounded-md p-3">
      <div className="flex items-center gap-1.5 mb-2 pb-1.5 border-b border-matrix-border/40">
        <span className="text-xs text-matrix-muted">{icon}</span>
        <h3 className="text-xs font-medium text-gray-400">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function MiniBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className="w-full bg-matrix-border/50 rounded-full h-1">
      <div className={`${color} h-1 rounded-full transition-all duration-300`} style={{ width: `${pct}%` }} />
    </div>
  );
}

/* ── Static mock data (widgets without real backend yet) ── */
const MOCK_TECH_RADAR = [
  { name: 'React 18', ring: 'Adopt' },
  { name: 'Drizzle ORM', ring: 'Adopt' },
  { name: 'Bun runtime', ring: 'Trial' },
  { name: 'tRPC', ring: 'Assess' },
  { name: 'Tauri', ring: 'Hold' },
  { name: 'Effect-TS', ring: 'Assess' },
];

const MOCK_DEPS_HEALTH = [
  { name: 'electron', current: '40.0.0', status: 'minor' },
  { name: 'react', current: '18.3.1', status: 'major' },
  { name: 'drizzle-orm', current: '0.38.0', status: 'patch' },
  { name: 'tailwindcss', current: '3.4.17', status: 'ok' },
  { name: 'recharts', current: '3.8.0', status: 'ok' },
  { name: 'zod', current: '3.24.2', status: 'patch' },
];

const SHORTCUT_KEYS: { keys: string; actionKey: LangKey }[] = [
  { keys: 'Ctrl+1–5', actionKey: 'switchTab' },
  { keys: 'Ctrl+,', actionKey: 'settings' },
  { keys: 'Ctrl+T', actionKey: 'quickTask' },
  { keys: 'Ctrl+I', actionKey: 'quickIdea' },
  { keys: 'Ctrl+B', actionKey: 'toggleSidebar' },
];

/* ── Helpers ── */
const ringColor: Record<string, string> = {
  Adopt: 'bg-green-500/10 text-green-400',
  Trial: 'bg-blue-500/10 text-blue-400',
  Assess: 'bg-amber-500/10 text-amber-400',
  Hold: 'bg-red-500/10 text-red-400',
};
const depStatusColor: Record<string, string> = {
  ok: 'text-green-400',
  patch: 'text-blue-400',
  minor: 'text-amber-400',
  major: 'text-red-400',
};
const depStatusIcon: Record<string, string> = {
  ok: '✓',
  patch: '↑',
  minor: '↑',
  major: '⚠',
};

/* ── Pomodoro ── */
const POMODORO_FOCUS = 25 * 60;
const POMODORO_BREAK = 5 * 60;

function todayKey() {
  return new Date().toISOString().split('T')[0];
}

function loadSession() {
  try {
    const raw = localStorage.getItem('pomodoro_session');
    if (!raw) return null;
    const p = JSON.parse(raw);
    if (p.date !== todayKey()) return null;
    return p as { date: string; count: number; focusMinutes: number };
  } catch {
    return null;
  }
}

function saveSession(count: number, focusMinutes: number) {
  localStorage.setItem('pomodoro_session', JSON.stringify({ date: todayKey(), count, focusMinutes }));
}

function DailyFocus() {
  const session = loadSession();
  const { language } = useUiStore();
  const { setFocusActive, tasksCompletedInSession, resetSessionTasks } = usePomodoroStore();
  const [phase, setPhase] = useState<'idle' | 'focus' | 'break'>('idle');
  const [timeLeft, setTimeLeft] = useState(POMODORO_FOCUS);
  const [count, setCount] = useState(session?.count ?? 0);
  const [focusMinutes, setFocusMinutes] = useState(session?.focusMinutes ?? 0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pomodorosGoal = 8;

  useEffect(() => {
    setFocusActive(phase === 'focus');
  }, [phase, setFocusActive]);

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (phase === 'idle') return;
    clearTimer();
    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev > 1) return prev - 1;
        clearTimer();
        if (phase === 'focus') {
          setCount((c) => {
            const nc = c + 1;
            setFocusMinutes((m) => {
              saveSession(nc, m + 25);
              return m + 25;
            });
            return nc;
          });
          setPhase('break');
          setTimeLeft(POMODORO_BREAK);
        } else {
          setPhase('idle');
          setTimeLeft(POMODORO_FOCUS);
        }
        return 0;
      });
    }, 1000);
    return clearTimer;
  }, [phase, clearTimer]);

  const toggle = () => {
    if (phase === 'idle') {
      setTimeLeft(POMODORO_FOCUS);
      setPhase('focus');
    } else {
      clearTimer();
      setPhase('idle');
      setTimeLeft(POMODORO_FOCUS);
    }
  };
  const skipBreak = () => {
    clearTimer();
    setPhase('idle');
    setTimeLeft(POMODORO_FOCUS);
  };
  const resetDay = () => {
    clearTimer();
    setPhase('idle');
    setTimeLeft(POMODORO_FOCUS);
    setCount(0);
    setFocusMinutes(0);
    saveSession(0, 0);
    resetSessionTasks();
  };

  const mins = Math.floor(timeLeft / 60)
    .toString()
    .padStart(2, '0');
  const secs = (timeLeft % 60).toString().padStart(2, '0');
  const phaseColor = phase === 'focus' ? 'text-matrix-accent' : phase === 'break' ? 'text-green-400' : 'text-gray-400';

  return (
    <PanelCard title={t('dailyFocus', language)} icon="◉">
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <div>
            <span className={`text-2xl font-mono font-bold ${phaseColor}`}>
              {mins}:{secs}
            </span>
            <span className={`text-[10px] ml-2 ${phaseColor}`}>
              {phase === 'focus'
                ? t('focus', language)
                : phase === 'break'
                  ? t('break', language)
                  : t('ready', language)}
            </span>
          </div>
          <div className="flex gap-1">
            <button
              onClick={toggle}
              className={`text-xs px-2 py-1 rounded transition-colors ${
                phase === 'focus'
                  ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
                  : 'bg-matrix-accent/10 text-matrix-accent hover:bg-matrix-accent/20'
              }`}
            >
              {phase === 'focus' ? '⏸' : '▶'}
            </button>
            {phase === 'break' && (
              <button
                onClick={skipBreak}
                className="text-xs px-2 py-1 rounded bg-matrix-border/30 text-matrix-muted hover:text-gray-300 transition-colors"
              >
                {t('skip', language)}
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <div className="flex gap-0.5 flex-1">
            {Array.from({ length: pomodorosGoal }).map((_, i) => (
              <div
                key={i}
                className={`h-2.5 flex-1 rounded-sm transition-colors ${i < count ? 'bg-matrix-accent' : 'bg-matrix-border/50'}`}
              />
            ))}
          </div>
          <span className="text-[10px] text-matrix-muted shrink-0">
            {count}/{pomodorosGoal}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="text-sm font-semibold text-gray-200">{focusMinutes}m</p>
            <p className="text-[10px] text-matrix-muted">{t('focusToday', language)}</p>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-200">{count * 5}m</p>
            <p className="text-[10px] text-matrix-muted">{t('breakEarned', language)}</p>
          </div>
          <div>
            <p className={`text-sm font-semibold ${tasksCompletedInSession > 0 ? 'text-green-400' : 'text-gray-200'}`}>
              {tasksCompletedInSession}
            </p>
            <p className="text-[10px] text-matrix-muted">{t('tasksDone', language)}</p>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <button
            onClick={resetDay}
            className="text-[10px] text-matrix-muted/40 hover:text-matrix-muted transition-colors"
          >
            {t('resetDay', language)}
          </button>
          {phase === 'focus' && (
            <span className="text-[10px] text-green-400/70 animate-pulse">● {t('focusActive', language)}</span>
          )}
        </div>
      </div>
    </PanelCard>
  );
}

/* ── Upcoming Deadlines (real) ── */
function UpcomingDeadlines() {
  const { language } = useUiStore();
  const { data } = useDeadlines();
  const all = data ? [...(data.overdue || []), ...(data.dueToday || []), ...(data.dueSoon || [])].slice(0, 5) : [];
  const priorityColor: Record<string, string> = {
    low: 'text-gray-500',
    medium: 'text-blue-400',
    high: 'text-orange-400',
    urgent: 'text-red-400',
  };

  return (
    <PanelCard title={t('upcomingDeadlines', language)} icon="⏰">
      {all.length === 0 ? (
        <p className="text-[10px] text-matrix-muted">{t('noUpcomingDeadlines', language)}</p>
      ) : (
        <div className="space-y-1.5">
          {all.map((d) => {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const taskDay = new Date(d.deadline + 'T00:00:00');
            const daysLeft = Math.round((taskDay.getTime() - today.getTime()) / 86400000);
            const label =
              daysLeft < 0
                ? `${Math.abs(daysLeft)} ${t('dLate', language)}`
                : daysLeft === 0
                  ? t('dToday', language)
                  : `${daysLeft}d`;
            const color = daysLeft <= 0 ? 'text-red-400' : daysLeft <= 7 ? 'text-amber-400' : 'text-gray-500';
            return (
              <div key={d.id} className="flex items-center gap-2 text-xs">
                <span className={`font-mono text-[10px] shrink-0 ${color}`}>{label}</span>
                <span className="text-gray-400 flex-1 truncate">{d.title}</span>
                <span className={`text-[10px] shrink-0 ${priorityColor[d.priority] || 'text-gray-500'}`}>
                  {t(d.priority as LangKey, language)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </PanelCard>
  );
}

/* ── Productivity Streak (real) ── */
function ProductivityStreak() {
  const { language } = useUiStore();
  const { data, isLoading, isError } = useActivityMetrics();
  const dayLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  if (isLoading) {
    return (
      <PanelCard title={t('productivity', language)} icon="🔥">
        <div className="animate-pulse space-y-2">
          <div className="h-8 bg-matrix-border/50 rounded" />
          <div className="h-12 bg-matrix-border/50 rounded" />
        </div>
      </PanelCard>
    );
  }
  if (isError || !data) {
    return (
      <PanelCard title={t('productivity', language)} icon="🔥">
        <p className="text-[10px] text-matrix-muted">{t('noDataYet', language)}</p>
      </PanelCard>
    );
  }

  const { streak } = data;
  const maxVal = Math.max(...streak.weekData, 1);

  return (
    <PanelCard title={t('productivity', language)} icon="🔥">
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2 text-center">
          <div>
            <p className="text-lg font-bold text-matrix-accent">{streak.current}</p>
            <p className="text-[10px] text-matrix-muted">{t('dayStreak', language)}</p>
          </div>
          <div>
            <p className="text-lg font-bold text-gray-300">{streak.longest}</p>
            <p className="text-[10px] text-matrix-muted">{t('bestStreak', language)}</p>
          </div>
        </div>
        <div>
          <div className="flex items-end gap-1 h-12">
            {streak.weekData.map((v, i) => (
              <div key={i} className="flex-1 flex flex-col items-center">
                <div
                  className="w-full rounded-t-sm bg-matrix-accent/70 transition-all"
                  style={{ height: `${(v / maxVal) * 100}%`, minHeight: v > 0 ? '2px' : '0' }}
                />
              </div>
            ))}
          </div>
          <div className="flex gap-1 mt-0.5">
            {dayLabels.map((d, i) => (
              <span key={i} className="flex-1 text-center text-[9px] text-matrix-muted">
                {d}
              </span>
            ))}
          </div>
        </div>
        <div className="flex justify-between text-[10px] text-matrix-muted">
          <span>
            {streak.tasksThisWeek} {t('tasksThisWeek', language)}
          </span>
          <span>
            ~{streak.avgPerDay}
            {t('perDay', language)}
          </span>
        </div>
      </div>
    </PanelCard>
  );
}

/* ── Weekly Burndown (real) ── */
function TaskBurndown() {
  const { language } = useUiStore();
  const { data, isLoading, isError } = useActivityMetrics();

  if (isLoading) {
    return (
      <PanelCard title={t('weeklyBurndown', language)} icon="📉">
        <div className="animate-pulse space-y-1.5">
          {Array(5)
            .fill(0)
            .map((_, i) => (
              <div key={i} className="h-3 bg-matrix-border/50 rounded" />
            ))}
        </div>
      </PanelCard>
    );
  }
  if (isError || !data) {
    return (
      <PanelCard title={t('weeklyBurndown', language)} icon="📉">
        <p className="text-[10px] text-matrix-muted">{t('noDataYet', language)}</p>
      </PanelCard>
    );
  }

  const realDays = data.burndown.filter((d) => d.remaining !== null);
  const maxRemaining = Math.max(...realDays.map((d) => d.remaining as number), 1);

  return (
    <PanelCard title={t('weeklyBurndown', language)} icon="📉">
      <div className="space-y-1.5">
        {data.burndown.map((d, i) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            <span className="text-[10px] text-matrix-muted w-6 shrink-0">{d.day}</span>
            {d.remaining !== null ? (
              <>
                <div className="flex-1">
                  <MiniBar value={d.remaining} max={maxRemaining} color="bg-amber-500/70" />
                </div>
                <span className="text-[10px] text-gray-500 w-5 text-right">{d.remaining}</span>
                <span className="text-[10px] text-green-400/70 w-6 text-right">+{d.completed}</span>
              </>
            ) : (
              <span className="text-[10px] text-matrix-muted/30 flex-1">—</span>
            )}
          </div>
        ))}
      </div>
    </PanelCard>
  );
}

/* ── Weekly Trends (real) ── */
function WeeklyTrends() {
  const { language } = useUiStore();
  const { data, isLoading, isError } = useActivityMetrics();

  if (isLoading) {
    return (
      <PanelCard title={t('weeklyTrends', language)} icon="📈">
        <div className="animate-pulse h-16 bg-matrix-border/50 rounded" />
      </PanelCard>
    );
  }
  if (isError || !data) {
    return (
      <PanelCard title={t('weeklyTrends', language)} icon="📈">
        <p className="text-[10px] text-matrix-muted">{t('noDataYet', language)}</p>
      </PanelCard>
    );
  }

  const maxVal = Math.max(...data.weeklyTrends.flatMap((d) => [d.completed ?? 0, d.created ?? 0]), 1);

  return (
    <PanelCard title={t('weeklyTrends', language)} icon="📈">
      <div className="space-y-2">
        <div className="flex items-end gap-1 h-14">
          {data.weeklyTrends.map((d, i) => (
            <div key={i} className="flex-1 flex items-end gap-px h-full">
              {d.completed !== null ? (
                <>
                  <div
                    className="flex-1 bg-matrix-accent/60 rounded-t-sm"
                    style={{ height: `${(d.completed / maxVal) * 100}%`, minHeight: d.completed > 0 ? '2px' : '0' }}
                    title={`Done: ${d.completed}`}
                  />
                  <div
                    className="flex-1 bg-blue-400/40 rounded-t-sm"
                    style={{
                      height: `${((d.created ?? 0) / maxVal) * 100}%`,
                      minHeight: (d.created ?? 0) > 0 ? '2px' : '0',
                    }}
                    title={`Created: ${d.created}`}
                  />
                </>
              ) : (
                <div className="flex-1 bg-matrix-border/20 rounded-t-sm" style={{ height: '2px' }} />
              )}
            </div>
          ))}
        </div>
        <div className="flex gap-1">
          {data.weeklyTrends.map((d, i) => (
            <span key={i} className="flex-1 text-center text-[9px] text-matrix-muted">
              {d.day.charAt(0)}
            </span>
          ))}
        </div>
        <div className="flex gap-3 text-[10px] text-matrix-muted">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-sm bg-matrix-accent/60 inline-block" /> {t('completed', language)}
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-sm bg-blue-400/40 inline-block" /> {t('created', language)}
          </span>
        </div>
      </div>
    </PanelCard>
  );
}

/* ── Key Metrics (real) ── */
function KeyMetrics() {
  const { language } = useUiStore();
  const { data, isLoading, isError } = useActivityMetrics();

  if (isLoading) {
    return (
      <PanelCard title={t('keyMetrics', language)} icon="◈">
        <div className="animate-pulse space-y-2">
          {Array(4)
            .fill(0)
            .map((_, i) => (
              <div key={i} className="h-6 bg-matrix-border/50 rounded" />
            ))}
        </div>
      </PanelCard>
    );
  }
  if (isError || !data) {
    return (
      <PanelCard title={t('keyMetrics', language)} icon="◈">
        <p className="text-[10px] text-matrix-muted">{t('noDataYet', language)}</p>
      </PanelCard>
    );
  }

  const { keyMetrics: km } = data;
  const metrics = [
    { label: t('velocity', language), value: `${km.velocity}`, sub: t('tasksThisWeekSub', language) },
    { label: t('wip', language), value: `${km.wip}`, sub: t('inProgressNow', language) },
    { label: t('throughput', language), value: `${km.throughput}`, sub: t('tasksPerDay30d', language) },
    {
      label: t('cycleTime', language),
      value: km.cycleTimeDays != null ? `${km.cycleTimeDays}d` : '—',
      sub: t('avgDaysToDone', language),
    },
  ];

  return (
    <PanelCard title={t('keyMetrics', language)} icon="◈">
      <div className="space-y-2">
        {metrics.map((m, i) => (
          <div key={i} className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400">{m.label}</p>
              <p className="text-[10px] text-matrix-muted">{m.sub}</p>
            </div>
            <span className="text-sm font-semibold text-matrix-accent font-mono">{m.value}</span>
          </div>
        ))}
      </div>
    </PanelCard>
  );
}

/* ── Top Scored Ideas (real) ── */
function TopScoredIdeas() {
  const { language } = useUiStore();
  const { data, isLoading } = useTopScoredIdeas();
  const statusBadge: Record<string, string> = {
    approved: 'bg-green-500/10 text-green-400',
    evaluating: 'bg-blue-500/10 text-blue-400',
    pending: 'bg-gray-500/10 text-gray-400',
    promoted: 'bg-purple-500/10 text-purple-400',
    rejected: 'bg-red-500/10 text-red-400',
  };

  return (
    <PanelCard title={t('topScoredIdeas', language)} icon="💡">
      {isLoading ? (
        <div className="animate-pulse space-y-1.5">
          {Array(4)
            .fill(0)
            .map((_, i) => (
              <div key={i} className="h-4 bg-matrix-border/50 rounded" />
            ))}
        </div>
      ) : !data || data.length === 0 ? (
        <p className="text-[10px] text-matrix-muted">{t('noEvaluatedIdeas', language)}</p>
      ) : (
        <div className="space-y-1.5">
          {data.map((idea) => (
            <div key={idea.id} className="flex items-center gap-2 text-xs">
              <span className="text-matrix-accent font-mono text-[10px] w-8 text-right shrink-0">
                {idea.totalScore.toFixed(1)}
              </span>
              <span className="text-gray-400 flex-1 truncate">{idea.title}</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full ${statusBadge[idea.status] || statusBadge.pending}`}
              >
                {idea.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </PanelCard>
  );
}

/* ── Idea Funnel (real) ── */
function IdeaFunnelWidget() {
  const { language } = useUiStore();
  const { data, isLoading } = useIdeaFunnel();

  const total = data ? data.pending + data.evaluating + data.approved + data.promoted + data.rejected : 0;
  const stages = data
    ? [
        { label: t('total', language), count: total, color: 'bg-gray-500' },
        { label: t('evaluating', language), count: data.evaluating, color: 'bg-blue-500' },
        { label: t('approved', language), count: data.approved, color: 'bg-green-500' },
        { label: t('promoted', language), count: data.promoted, color: 'bg-purple-500' },
      ]
    : [];

  const maxCount = Math.max(...stages.map((s) => s.count), 1);

  return (
    <PanelCard title={t('ideaFunnel', language)} icon="🔽">
      {isLoading ? (
        <div className="animate-pulse space-y-2">
          {Array(4)
            .fill(0)
            .map((_, i) => (
              <div key={i} className="h-4 bg-matrix-border/50 rounded" />
            ))}
        </div>
      ) : !data ? (
        <p className="text-[10px] text-matrix-muted">{t('noData', language)}</p>
      ) : (
        <div className="space-y-2">
          {stages.map((s, i) => (
            <div key={i}>
              <div className="flex justify-between text-[10px] mb-0.5">
                <span className="text-gray-400">{s.label}</span>
                <span className="text-matrix-muted">{s.count}</span>
              </div>
              <div className="w-full bg-matrix-border/50 rounded-full h-1.5">
                <div
                  className={`${s.color}/70 h-1.5 rounded-full transition-all`}
                  style={{ width: `${(s.count / maxCount) * 100}%` }}
                />
              </div>
            </div>
          ))}
          <p className="text-[10px] text-matrix-muted pt-0.5">
            {data.rejected} {t('rejected', language)} · {data.pending} {t('pending', language)}
          </p>
        </div>
      )}
    </PanelCard>
  );
}

/* ── Motivational Quote ── */
function MotivationalQuote() {
  const { quote, isLoading, refresh } = useDailyQuote();

  if (isLoading) {
    return (
      <PanelCard title="Daily Thought" icon="✧">
        <div className="animate-pulse space-y-2">
          <div className="h-3 bg-matrix-border/50 rounded w-full" />
          <div className="h-3 bg-matrix-border/50 rounded w-4/5" />
        </div>
      </PanelCard>
    );
  }
  if (!quote) return null;

  return (
    <PanelCard title="Daily Thought" icon="✧">
      <div className="flex items-start justify-between gap-2">
        <blockquote className="text-xs text-gray-400 italic leading-relaxed flex-1">"{quote.quote}"</blockquote>
        <button
          onClick={refresh}
          className="text-matrix-muted hover:text-matrix-accent text-xs opacity-40 hover:opacity-100 transition-opacity"
          title="New quote"
        >
          ↻
        </button>
      </div>
      <p className="text-[10px] text-matrix-muted mt-1.5 text-right">— {quote.author}</p>
    </PanelCard>
  );
}

/* ── Dev Feed ── */
function DevFeed() {
  const { hnStories, trendingRepos, isLoading, error } = useDevFeed();

  if (isLoading) {
    return (
      <PanelCard title="Dev Feed" icon="⚡">
        <div className="animate-pulse space-y-1.5">
          <div className="h-2 bg-matrix-border/50 rounded w-4/5" />
          <div className="h-2 bg-matrix-border/50 rounded w-3/5" />
        </div>
      </PanelCard>
    );
  }
  if (error && hnStories.length === 0 && trendingRepos.length === 0) {
    return (
      <PanelCard title="Dev Feed" icon="⚡">
        <p className="text-xs text-matrix-muted">Unable to load feed</p>
      </PanelCard>
    );
  }

  return (
    <PanelCard title="Dev Feed" icon="⚡">
      <div className="space-y-3">
        {hnStories.length > 0 && (
          <div>
            <p className="text-[10px] text-matrix-muted mb-1.5">Hacker News</p>
            <div className="space-y-1.5">
              {hnStories.slice(0, 5).map((story) => (
                <button
                  key={story.id}
                  onClick={() => window.open(story.url, '_blank', 'noopener,noreferrer')}
                  className="block text-xs text-gray-400 hover:text-matrix-accent transition-colors text-left w-full truncate"
                >
                  - {story.title}
                </button>
              ))}
            </div>
          </div>
        )}
        {trendingRepos.length > 0 && (
          <div className="pt-2 border-t border-matrix-border/30">
            <p className="text-[10px] text-matrix-muted mb-1.5">GitHub Trending</p>
            <div className="space-y-1.5">
              {trendingRepos.slice(0, 4).map((repo) => (
                <button
                  key={repo.id}
                  onClick={() => window.open(repo.html_url, '_blank', 'noopener,noreferrer')}
                  className="block text-xs text-gray-400 hover:text-matrix-accent transition-colors text-left w-full truncate"
                >
                  - <span className="text-matrix-accent">★</span> {repo.name}
                  {repo.language && <span className="text-matrix-muted text-[10px] ml-1">{repo.language}</span>}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </PanelCard>
  );
}

/* ── Static widgets ── */
function TechRadar() {
  const { language } = useUiStore();
  return (
    <PanelCard title={t('techRadar', language)} icon="📡">
      <div className="space-y-1.5">
        {MOCK_TECH_RADAR.map((tech, i) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            <span className="text-gray-300 flex-1 truncate">{tech.name}</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${ringColor[tech.ring]}`}>{tech.ring}</span>
          </div>
        ))}
      </div>
    </PanelCard>
  );
}

function DependenciesHealth() {
  const { language } = useUiStore();
  return (
    <PanelCard title={t('dependencies', language)} icon="📦">
      <div className="space-y-1.5">
        {MOCK_DEPS_HEALTH.map((dep, i) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            <span className={`${depStatusColor[dep.status]} text-[10px] w-3 text-center shrink-0`}>
              {depStatusIcon[dep.status]}
            </span>
            <span className="text-gray-400 flex-1 truncate">{dep.name}</span>
            <span className="text-[10px] font-mono text-matrix-muted">{dep.current}</span>
          </div>
        ))}
      </div>
    </PanelCard>
  );
}

const statusDot: Record<string, string> = {
  online: 'bg-green-400',
  sleeping: 'bg-amber-400',
  offline: 'bg-red-400',
  not_configured: 'bg-gray-500',
};

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return `${d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} ${d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}`;
}

const DEMO_RENDER = [
  { name: 'API Backend', url: 'https://api.demo.onrender.com', status: 'online' as const, responseTime: 234 },
  { name: 'Worker', url: 'https://worker.demo.onrender.com', status: 'sleeping' as const, responseTime: null },
  { name: 'Scheduler', url: 'https://scheduler.demo.onrender.com', status: 'online' as const, responseTime: 412 },
];

const DEMO_DATABASES = [
  { name: 'PostgreSQL', type: 'postgres', status: 'online' as const },
  { name: 'MySQL Analytics', type: 'mysql', status: 'online' as const },
  { name: 'MongoDB Dev', type: 'mongodb', status: 'offline' as const },
];

function SystemStatus() {
  const { language, isDemo } = useUiStore();
  const { data, isLoading } = useSystemStatus();
  const wakeService = useWakeService();
  const [wakingUrl, setWakingUrl] = useState<string | null>(null);
  const [showInfoModal, setShowInfoModal] = useState(false);

  const renderServices = isDemo ? DEMO_RENDER : (data?.render ?? []);
  const dbServices = isDemo ? DEMO_DATABASES : (data?.databases ?? []);
  const vaultLocked = isDemo ? false : (data?.vaultLocked ?? false);

  const handleWake = (url: string) => {
    setWakingUrl(url);
    wakeService.mutate(url, { onSettled: () => setWakingUrl(null) });
  };

  return (
    <>
      <PanelCard title={t('systemStatus', language)} icon="⚙">
        {isLoading && !isDemo ? (
          <p className="text-[11px] text-matrix-muted">{t('loading', language)}</p>
        ) : (
          <div className="space-y-2">
            {/* API */}
            <div className="flex items-center gap-2 text-xs">
              <span className="w-1.5 h-1.5 rounded-full shrink-0 bg-green-400" />
              <span className="text-gray-400 flex-1">{t('apiServer', language)}</span>
              <span className="text-[10px] text-matrix-muted">{t('online', language)}</span>
            </div>

            {/* Vault locked */}
            {vaultLocked && (
              <p className="text-[10px] text-matrix-muted italic">{t('vaultRequiredForServices', language)}</p>
            )}

            {/* External Services header with info icon */}
            {(renderServices.length > 0 || dbServices.length > 0) && (
              <div className="border-t border-matrix-border/30 pt-1.5 flex items-center justify-between">
                <p className="text-[10px] text-matrix-muted uppercase tracking-wider">
                  {t('externalServices', language)}
                </p>
                <button
                  onClick={() => setShowInfoModal(true)}
                  className="w-4 h-4 flex items-center justify-center rounded-full border border-matrix-border/60 text-[9px] text-matrix-muted hover:text-gray-300 hover:border-matrix-muted/60 transition-colors shrink-0"
                  title={t('externalServicesInfoTitle', language)}
                >
                  i
                </button>
              </div>
            )}

            {/* Render Backends */}
            {renderServices.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-[10px] text-matrix-muted/70 uppercase tracking-wider">
                  {t('renderBackends', language)}
                </p>
                {renderServices.map((svc, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <span
                      className={`w-1.5 h-1.5 rounded-full shrink-0 ${statusDot[svc.status]}`}
                      title={svc.responseTime != null ? `${svc.responseTime}ms` : undefined}
                    />
                    <span className="text-gray-400 flex-1 truncate">{svc.name}</span>
                    {svc.status !== 'online' ? (
                      isDemo ? (
                        <span className="text-[10px] text-amber-400">{t('sleeping', language)}</span>
                      ) : (
                        <button
                          onClick={() => handleWake(svc.url)}
                          disabled={wakingUrl === svc.url}
                          className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 transition-colors disabled:opacity-50"
                        >
                          {wakingUrl === svc.url ? t('waking', language) : t('wake', language)}
                        </button>
                      )
                    ) : (
                      <span className="text-[10px] text-green-400">
                        {t('online', language)}
                        {svc.responseTime != null ? ` ${svc.responseTime}ms` : ''}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Databases */}
            {dbServices.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-[10px] text-matrix-muted/70 uppercase tracking-wider">
                  {t('aivenDatabases', language)}
                </p>
                {dbServices.map((db, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${statusDot[db.status]}`} />
                    <span className="text-gray-400 flex-1 truncate">{db.name}</span>
                    <span className={`text-[10px] ${db.status === 'online' ? 'text-green-400' : 'text-red-400'}`}>
                      {t(db.status as 'online' | 'offline', language)}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Checked at */}
            {(data?.checkedAt || isDemo) && (
              <div className="border-t border-matrix-border/30 pt-1.5 text-[10px] text-matrix-muted text-right">
                {t('checkedAt', language)}: {isDemo ? fmtDate(new Date().toISOString()) : fmtDate(data?.checkedAt)}
              </div>
            )}
          </div>
        )}
      </PanelCard>

      {/* Info Modal */}
      {showInfoModal && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
          onClick={() => setShowInfoModal(false)}
        >
          <div
            className="bg-matrix-surface border border-matrix-border rounded-xl p-5 w-full max-w-sm shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-200">{t('externalServices', language)}</h3>
              <button
                onClick={() => setShowInfoModal(false)}
                className="text-matrix-muted hover:text-gray-300 transition-colors text-sm"
              >
                ✕
              </button>
            </div>
            <div className="space-y-3 text-xs text-gray-400 leading-relaxed">
              <p>{t('externalServicesInfoDesc', language)}</p>
              <div>
                <p className="font-medium text-gray-300 mb-1">{t('renderBackends', language)}</p>
                <p>{t('externalServicesRenderDesc', language)}</p>
              </div>
              <div>
                <p className="font-medium text-gray-300 mb-1">{t('aivenDatabases', language)}</p>
                <p>{t('externalServicesDbDesc', language)}</p>
              </div>
              <p className="text-matrix-muted border-t border-matrix-border/40 pt-2 text-[10px]">
                {t('externalServicesHowTo', language)}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function ShortcutsHelp() {
  const { language } = useUiStore();
  return (
    <PanelCard title={t('keyboardShortcuts', language)} icon="⌨">
      <div className="space-y-1.5">
        {SHORTCUT_KEYS.map((s, i) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            <kbd className="text-[10px] bg-matrix-bg border border-matrix-border rounded px-1.5 py-0.5 font-mono text-matrix-muted shrink-0">
              {s.keys}
            </kbd>
            <span className="text-gray-400">{t(s.actionKey, language)}</span>
          </div>
        ))}
      </div>
    </PanelCard>
  );
}

/* ── Panel config per tab ── */
const PANEL_CONFIG: Record<Tab, React.FC[]> = {
  overview: [DailyFocus, UpcomingDeadlines, ProductivityStreak, MotivationalQuote, DevFeed],
  tasks: [KeyMetrics, TaskBurndown, WeeklyTrends, ProductivityStreak],
  projects: [TechRadar, DependenciesHealth, SystemStatus],
  ideas: [IdeaFunnelWidget, TopScoredIdeas, MotivationalQuote],
  docs: [ShortcutsHelp, MotivationalQuote],
  settings: [ShortcutsHelp, SystemStatus, MotivationalQuote],
};

export function RightPanel({ activeTab }: { activeTab: Tab }) {
  const widgets = PANEL_CONFIG[activeTab] || PANEL_CONFIG.overview;
  return (
    <aside className="hidden xl:flex flex-col w-72 shrink-0 border-l border-matrix-border bg-matrix-surface/50 overflow-y-auto">
      <div className="p-3 space-y-3">
        {widgets.map((Widget, i) => (
          <Widget key={i} />
        ))}
      </div>
    </aside>
  );
}
