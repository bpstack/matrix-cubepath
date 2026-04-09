import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis } from 'recharts';
import { useMission } from '../../hooks/useMission';
import { useObjectives, Objective } from '../../hooks/useObjectives';
import { useTasks } from '../../hooks/useTasks';
import { useIdeas } from '../../hooks/useIdeas';
import { useActivity } from '../../hooks/useActivity';
import { t, LangKey } from '../../lib/i18n';
import { SectionCard } from './primitives';

// --- Shared chart tooltip ---

interface ChartTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: { name: string; value?: number; progress?: number } }>;
}

const ChartTooltip = ({ active, payload }: ChartTooltipProps) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-matrix-surface border border-matrix-border rounded px-2 py-1 text-xs">
      <p className="text-gray-300">
        {d.name}: {d.value ?? d.progress}%
      </p>
    </div>
  );
};

// --- ObjectivesChartCard ---

function barColor(value: number): string {
  if (value <= 33) return '#ef4444';
  if (value <= 66) return '#f59e0b';
  return '#27a35a';
}

export function ObjectivesChartCard({ language }: { language: 'en' | 'es' }) {
  const { data: missions } = useMission();
  const mission = missions?.[0];
  const { data: objectives } = useObjectives(mission?.id);

  const objData = (objectives || []).map((o: Objective) => ({
    name: o.title.length > 25 ? o.title.slice(0, 25) + '…' : o.title,
    progress: o.progress ?? 0,
  }));

  return (
    <SectionCard title={t('objectivesProgress' as LangKey, language)} icon="◪">
      {objData.length === 0 ? (
        <p className="text-xs text-matrix-muted py-4 text-center">
          {language === 'es' ? 'Sin objetivos' : 'No objectives yet'}
        </p>
      ) : (
        <ResponsiveContainer width="100%" height={objData.length * 50 + 20}>
          <BarChart data={objData} layout="vertical" margin={{ left: 10, right: 20, top: 5, bottom: 5 }}>
            <XAxis type="number" domain={[0, 100]} tick={{ fill: '#6b7280', fontSize: 10 }} />
            <YAxis type="category" dataKey="name" width={140} tick={{ fill: '#9ca3af', fontSize: 11 }} />
            <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgb(var(--matrix-border) / 0.25)' }} />
            <Bar dataKey="progress" radius={[0, 4, 4, 0]} barSize={20}>
              {objData.map((entry, i) => (
                <Cell key={i} fill={barColor(entry.progress)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </SectionCard>
  );
}

// --- WeeklyHeatmapCard ---

export function WeeklyHeatmapCard({ language }: { language: 'en' | 'es' }) {
  const { data: activity } = useActivity(50);

  // Build heatmap from real activity data (last 4 weeks)
  const now = Date.now();
  const dayLabels = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
  const weeks = 4;
  const grid: number[][] = Array.from({ length: weeks }, () => Array(7).fill(0));

  for (const a of activity || []) {
    const actDate = new Date(a.createdAt);
    const diff = Math.floor((now - actDate.getTime()) / 86400000);
    if (diff >= 0 && diff < weeks * 7) {
      const weekIdx = Math.floor(diff / 7);
      const dayIdx = actDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
      // Convert to Monday-based (L=0, M=1, X=2, J=3, V=4, S=5, D=6)
      const mondayIdx = dayIdx === 0 ? 6 : dayIdx - 1;
      if (weekIdx < weeks && mondayIdx >= 0) grid[weeks - 1 - weekIdx][mondayIdx]++;
    }
  }

  // If no real data, use mock heatmap
  const hasData = (activity || []).length > 0;
  const mockGrid = [
    [1, 3, 2, 0, 4, 1, 0],
    [2, 1, 5, 3, 2, 0, 0],
    [0, 4, 3, 2, 1, 3, 1],
    [3, 2, 1, 4, 5, 2, 0],
  ];
  const displayGrid = hasData ? grid : mockGrid;

  const maxVal = Math.max(...displayGrid.flat(), 1);
  const cellColor = (v: number) => {
    if (v === 0) return 'bg-matrix-border/30';
    const intensity = v / maxVal;
    if (intensity <= 0.33) return 'bg-matrix-accent/20';
    if (intensity <= 0.66) return 'bg-matrix-accent/50';
    return 'bg-matrix-accent/80';
  };

  return (
    <SectionCard title={language === 'es' ? 'Actividad semanal' : 'Activity Heatmap'} icon="▦">
      {!hasData && (
        <p className="text-[10px] text-matrix-muted/50 mb-2 italic">{t('sampleData' as LangKey, language)}</p>
      )}
      <div className="space-y-1">
        {displayGrid.map((week, wi) => (
          <div key={wi} className="flex gap-1">
            {week.map((val, di) => (
              <div
                key={di}
                className={`flex-1 h-4 rounded-sm ${cellColor(val)} transition-colors`}
                title={`${val} actions`}
              />
            ))}
          </div>
        ))}
        <div className="flex gap-1 mt-0.5">
          {dayLabels.map((d, i) => (
            <span key={i} className="flex-1 text-center text-[9px] text-matrix-muted">
              {d}
            </span>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-1.5 mt-2 justify-end">
        <span className="text-[9px] text-matrix-muted">{language === 'es' ? 'Menos' : 'Less'}</span>
        {[0, 0.25, 0.5, 0.8].map((v, i) => (
          <div
            key={i}
            className={`w-3 h-3 rounded-sm ${v === 0 ? 'bg-matrix-border/30' : v <= 0.33 ? 'bg-matrix-accent/20' : v <= 0.66 ? 'bg-matrix-accent/50' : 'bg-matrix-accent/80'}`}
          />
        ))}
        <span className="text-[9px] text-matrix-muted">{language === 'es' ? 'Más' : 'More'}</span>
      </div>
    </SectionCard>
  );
}

// --- TaskPieCard ---

const TASK_COLORS: Record<string, string> = {
  pending: '#6b7280',
  in_progress: '#f59e0b',
  done: '#27a35a',
};

export function TaskPieCard({ language }: { language: 'en' | 'es' }) {
  const { data: allTasks } = useTasks();
  const taskCounts: Record<string, number> = { pending: 0, in_progress: 0, done: 0 };
  for (const task of allTasks || []) {
    taskCounts[task.status] = (taskCounts[task.status] || 0) + 1;
  }
  const taskData = Object.entries(taskCounts)
    .filter(([, v]) => v > 0)
    .map(([status, value]) => ({ name: status, value }));

  return (
    <SectionCard title={t('taskDistribution' as LangKey, language)} icon="◔">
      {taskData.length === 0 ? (
        <p className="text-xs text-matrix-muted py-4 text-center">{t('noTasks' as LangKey, language)}</p>
      ) : (
        <div>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={taskData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={35}
                outerRadius={60}
                paddingAngle={2}
              >
                {taskData.map((entry, i) => (
                  <Cell key={i} fill={TASK_COLORS[entry.name] || '#6b7280'} />
                ))}
              </Pie>
              <Tooltip content={<ChartTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-3 justify-center mt-1">
            {taskData.map((d) => (
              <div key={d.name} className="flex items-center gap-1.5 text-xs">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: TASK_COLORS[d.name] }} />
                <span className="text-matrix-muted">
                  {d.name} ({d.value})
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </SectionCard>
  );
}

// --- IdeasPieCard ---

const IDEA_COLORS: Record<string, string> = {
  pending: '#6b7280',
  evaluating: '#3b82f6',
  approved: '#27a35a',
  rejected: '#ef4444',
  promoted: '#a855f7',
};

export function IdeasPieCard({ language }: { language: 'en' | 'es' }) {
  const { data: allIdeas } = useIdeas();
  const ideaCounts: Record<string, number> = {};
  for (const idea of allIdeas || []) {
    ideaCounts[idea.status] = (ideaCounts[idea.status] || 0) + 1;
  }
  const ideaData = Object.entries(ideaCounts)
    .filter(([, v]) => v > 0)
    .map(([status, value]) => ({ name: status, value }));

  return (
    <SectionCard title={t('ideasPipeline' as LangKey, language)} icon="✦">
      {ideaData.length === 0 ? (
        <p className="text-xs text-matrix-muted py-4 text-center">{language === 'es' ? 'Sin ideas' : 'No ideas yet'}</p>
      ) : (
        <div>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={ideaData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={35}
                outerRadius={60}
                paddingAngle={2}
              >
                {ideaData.map((entry, i) => (
                  <Cell key={i} fill={IDEA_COLORS[entry.name] || '#6b7280'} />
                ))}
              </Pie>
              <Tooltip content={<ChartTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-3 justify-center mt-1">
            {ideaData.map((d) => (
              <div key={d.name} className="flex items-center gap-1.5 text-xs">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: IDEA_COLORS[d.name] }} />
                <span className="text-matrix-muted">
                  {d.name} ({d.value})
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </SectionCard>
  );
}
