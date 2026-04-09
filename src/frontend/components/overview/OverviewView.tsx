import React, { useState } from 'react';
import { useMission } from '../../hooks/useMission';
import { useObjectives } from '../../hooks/useObjectives';
import { usePlans } from '../../hooks/usePlans';
import { useTasks } from '../../hooks/useTasks';
import { useUiStore } from '../../stores/ui.store';
import { useLanguageSwitch } from '../../hooks/useSettings';
import { t } from '../../lib/i18n';
import { SchemaViewMode, SchemaViewToggle } from './views/SchemaViewToggle';
import { TreeView } from './views/TreeView';
import { DashboardView } from './views/DashboardView';
import { RoadmapView } from './views/RoadmapView';
import { StrategicSchemaSetup } from './StrategicSchemaSetup';
import { SectionCard } from './primitives';
import {
  StatsCard,
  ActiveProjectsCard,
  RecentActivityCard,
  QuickCaptureCard,
  ObjectivesGlanceCard,
  FocusQueueCard,
  TaskDistributionCard,
  UpcomingDeadlinesCard,
  ScratchpadCard,
} from './DashboardCards';
import { ObjectivesChartCard, TaskPieCard, IdeasPieCard, WeeklyHeatmapCard } from './ChartCards';
import { OverviewSkeleton } from '../ui/Skeleton';

function StrategicSchemaActive() {
  const { data: missions } = useMission();
  const mission = missions?.[0];
  const { data: objectives } = useObjectives(mission?.id);
  const { data: allPlans } = usePlans();
  const { data: allTasks } = useTasks();

  const [schemaView, setSchemaView] = useState<SchemaViewMode>('tree');

  if (!mission) return null;

  if (schemaView === 'tree') {
    return <TreeView schemaView={schemaView} setSchemaView={setSchemaView} />;
  }

  const viewProps = {
    mission,
    objectives: objectives || [],
    allPlans: allPlans || [],
    allTasks: allTasks || [],
  };

  return (
    <div>
      <div className="flex justify-end mb-3">
        <SchemaViewToggle value={schemaView} onChange={setSchemaView} />
      </div>
      {schemaView === 'dashboard' && <DashboardView {...viewProps} />}
      {schemaView === 'roadmap' && <RoadmapView {...viewProps} />}
    </div>
  );
}

export function OverviewView() {
  const { language, switchingLanguage } = useUiStore();
  const switchLanguage = useLanguageSwitch();
  const { data: missions, isLoading } = useMission();
  const mission = missions?.[0];

  if (isLoading) return <div className="p-3 md:p-4 text-matrix-muted text-sm">{t('loading', language)}</div>;

  return (
    <div className="p-3 md:p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-medium text-gray-200">{t('overview', language)}</h1>
        <button
          onClick={() => switchLanguage()}
          disabled={switchingLanguage}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium text-matrix-muted hover:text-gray-200 bg-matrix-card hover:bg-matrix-hover border border-matrix-border transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title={language === 'en' ? 'Cambiar a español' : 'Switch to English'}
        >
          <svg
            className="w-3.5 h-3.5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M2 12h20" />
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
          </svg>
          <span>{language === 'en' ? 'ES' : 'EN'}</span>
        </button>
      </div>

      {switchingLanguage ? (
        <OverviewSkeleton />
      ) : (
        <>
          {/* Top row: Schema left, side cards right */}
          <div className="flex flex-col xl:flex-row gap-4">
            {/* Left: Strategic Schema + bottom cards */}
            <div className="flex-1 min-w-0 space-y-4">
              <SectionCard title={t('strategicSchema', language)} icon="◈">
                {mission ? <StrategicSchemaActive /> : <StrategicSchemaSetup />}
              </SectionCard>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <StatsCard language={language} />
                <ActiveProjectsCard language={language} />
                <RecentActivityCard language={language} />
                <QuickCaptureCard language={language} />
              </div>
              {/* Analytics Charts */}
              <ObjectivesChartCard language={language} />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <TaskPieCard language={language} />
                <IdeasPieCard language={language} />
              </div>
            </div>

            {/* Right column: visible on xl+ */}
            <div className="hidden xl:flex flex-col gap-4 w-80 shrink-0">
              <ObjectivesGlanceCard language={language} />
              <FocusQueueCard language={language} />
              <TaskDistributionCard language={language} />
              <WeeklyHeatmapCard language={language} />
              <UpcomingDeadlinesCard language={language} />
              <ScratchpadCard language={language} />
            </div>
          </div>

          {/* Show right-column cards below on smaller screens */}
          <div className="xl:hidden grid grid-cols-1 lg:grid-cols-2 gap-4">
            <ObjectivesGlanceCard language={language} />
            <FocusQueueCard language={language} />
            <TaskDistributionCard language={language} />
            <WeeklyHeatmapCard language={language} />
            <UpcomingDeadlinesCard language={language} />
            <ScratchpadCard language={language} />
          </div>
        </>
      )}
    </div>
  );
}
