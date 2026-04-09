import React, { useState } from 'react';
import { Objective, useCreateObjective, useUpdateObjective, useDeleteObjective } from '../../../hooks/useObjectives';
import { Plan, useCreatePlan, useUpdatePlan, useDeletePlan } from '../../../hooks/usePlans';
import { Task, useUpdateTask, useCreateTask, useDeleteTask } from '../../../hooks/useTasks';
import { useUiStore } from '../../../stores/ui.store';
import { t, LangKey } from '../../../lib/i18n';
import {
  statusIcon,
  statusColor,
  priorityColor,
  nextStatus,
  ProgressBar,
  ProgressRing,
  ActionButtons,
} from '../primitives';
import { InlineEdit, InlineAdd, InlineAddObjective } from '../inline-forms';

interface Mission {
  id: number;
  title: string;
  description?: string | null;
  progress: number;
}

interface ViewProps {
  mission: Mission;
  objectives: Objective[];
  allPlans: Plan[];
  allTasks: Task[];
}

export function DashboardView({ mission, objectives, allPlans, allTasks }: ViewProps) {
  const { language } = useUiStore();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const createObjective = useCreateObjective();
  const updateObjective = useUpdateObjective();
  const deleteObjective = useDeleteObjective();
  const createPlan = useCreatePlan();
  const updatePlan = useUpdatePlan();
  const deletePlan = useDeletePlan();
  const createTask = useCreateTask();
  const [selectedObj, setSelectedObj] = useState<number | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<number | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [expandedDesc, setExpandedDesc] = useState<Set<string>>(new Set());
  const toggleDesc = (key: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedDesc((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const totalTasks = allTasks.length;
  const doneTasks = allTasks.filter((tk) => tk.status === 'done').length;
  const inProgressTasks = allTasks.filter((tk) => tk.status === 'in_progress').length;

  const selectedObjective = objectives.find((o) => o.id === selectedObj);
  const objPlans = allPlans.filter((p) => p.objectiveId === selectedObj);
  const selectedPlanObj = allPlans.find((p) => p.id === selectedPlan);
  const planTasks = allTasks.filter((tk) => tk.planId === selectedPlan);

  return (
    <div className="space-y-4">
      {/* Mission Header */}
      <div className="bg-gradient-to-r from-matrix-accent/5 to-transparent border border-matrix-border/50 rounded-lg p-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <ProgressRing value={mission.progress} size={64} stroke={5} />
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-gray-200 uppercase tracking-wide">Mission</h3>
              <p className="text-base text-gray-100 mt-0.5 truncate uppercase">{mission.title}</p>
              {mission.description && (
                <p className="text-xs text-matrix-muted mt-1 line-clamp-2">{mission.description}</p>
              )}
            </div>
          </div>
          <div className="flex gap-4 text-center sm:ml-auto shrink-0">
            <div>
              <p className="text-lg font-bold text-gray-200">
                {doneTasks}/{totalTasks}
              </p>
              <p className="text-[10px] text-matrix-muted uppercase">{t('tasks' as LangKey, language)}</p>
            </div>
            <div>
              <p className="text-lg font-bold text-amber-400">{inProgressTasks}</p>
              <p className="text-[10px] text-matrix-muted uppercase">Active</p>
            </div>
            <div>
              <p className="text-lg font-bold text-gray-200">{objectives.length}</p>
              <p className="text-[10px] text-matrix-muted uppercase">Objectives</p>
            </div>
          </div>
        </div>
        <ProgressBar value={mission.progress} className="mt-3" height="h-2" bg="bg-white/[0.05]" />
      </div>

      {/* Breadcrumb */}
      {(selectedObj || selectedPlan) && (
        <div className="flex items-center gap-1.5 text-xs text-matrix-muted">
          <button
            onClick={() => {
              setSelectedObj(null);
              setSelectedPlan(null);
            }}
            className="hover:text-matrix-accent transition-colors"
          >
            Objectives
          </button>
          {selectedObj && (
            <>
              <span>/</span>
              <button
                onClick={() => setSelectedPlan(null)}
                className={`hover:text-matrix-accent transition-colors ${!selectedPlan ? 'text-gray-300' : ''}`}
              >
                {selectedObjective?.title}
              </button>
            </>
          )}
          {selectedPlan && (
            <>
              <span>/</span>
              <span className="text-gray-300">{selectedPlanObj?.title}</span>
            </>
          )}
        </div>
      )}

      {/* Level: Objectives */}
      {!selectedObj && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {objectives.map((obj) => {
              const objKey = `obj-${obj.id}`;
              const objPlanCount = allPlans.filter((p) => p.objectiveId === obj.id).length;
              const objTaskCount = allTasks.filter((tk) =>
                allPlans.some((p) => p.objectiveId === obj.id && p.id === tk.planId),
              ).length;
              const objDone = allTasks.filter(
                (tk) => tk.status === 'done' && allPlans.some((p) => p.objectiveId === obj.id && p.id === tk.planId),
              ).length;
              const objDescKey = `obj-desc-${obj.id}`;
              const isObjDescExpanded = expandedDesc.has(objDescKey);
              return (
                <div
                  key={obj.id}
                  onClick={() => {
                    if (editing !== objKey) setSelectedObj(obj.id);
                  }}
                  className="bg-matrix-bg border border-matrix-border/50 rounded-lg p-4 text-left hover:border-matrix-accent/30 hover:bg-matrix-accent/[0.02] transition-all group cursor-pointer"
                >
                  <div className="flex items-start gap-3">
                    <ProgressRing value={obj.progress} size={44} stroke={3} />
                    <div className="flex-1 min-w-0">
                      {editing === objKey ? (
                        <InlineEdit
                          value={obj.title}
                          onSave={(title) => {
                            updateObjective.mutate({ id: obj.id, title });
                            setEditing(null);
                          }}
                          onCancel={() => setEditing(null)}
                        />
                      ) : (
                        <h4 className="text-sm font-medium text-gray-200 group-hover:text-matrix-accent transition-colors">
                          {obj.title}
                        </h4>
                      )}
                      {isObjDescExpanded && obj.description && editing !== objKey && (
                        <p className="text-xs text-matrix-muted mt-1.5 whitespace-pre-wrap border-l border-matrix-border/40 pl-2">
                          {obj.description}
                        </p>
                      )}
                      <div className="flex gap-3 mt-2 text-[10px] text-matrix-muted">
                        <span>{objPlanCount} plans</span>
                        <span>
                          {objDone}/{objTaskCount} tasks
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {obj.description && editing !== objKey && (
                        <button
                          onClick={(e) => toggleDesc(objDescKey, e)}
                          className={`text-xs text-matrix-muted hover:text-matrix-accent transition-all leading-none ${isObjDescExpanded ? 'rotate-90' : ''}`}
                          title="Ver descripción"
                        >
                          ▸
                        </button>
                      )}
                      <ActionButtons
                        onEdit={() => setEditing(objKey)}
                        onConfirmDelete={() => deleteObjective.mutate({ id: obj.id, action: 'cascade' })}
                        confirmMessage={t('deleteObjectiveConfirm' as LangKey, language)}
                      />
                    </div>
                  </div>
                  <ProgressBar value={obj.progress} className="mt-3" height="h-1.5" bg="bg-white/[0.05]" />
                </div>
              );
            })}
          </div>
          <InlineAddObjective missionId={mission.id} onCreate={(data) => createObjective.mutate(data)} />
        </>
      )}

      {/* Level: Plans for selected objective */}
      {selectedObj && !selectedPlan && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {objPlans.map((plan) => {
              const planKey = `plan-${plan.id}`;
              const pTasks = allTasks.filter((tk) => tk.planId === plan.id);
              const pDone = pTasks.filter((tk) => tk.status === 'done').length;
              const planDescKey = `plan-desc-${plan.id}`;
              const isDescExpanded = expandedDesc.has(planDescKey);
              return (
                <div
                  key={plan.id}
                  onClick={() => {
                    if (editing !== planKey) setSelectedPlan(plan.id);
                  }}
                  className="bg-matrix-bg border border-matrix-border/50 rounded-lg p-4 text-left hover:border-matrix-accent/30 hover:bg-matrix-accent/[0.02] transition-all group cursor-pointer"
                >
                  <div className="flex items-start gap-3">
                    <ProgressRing value={plan.progress} size={40} stroke={3} />
                    <div className="flex-1 min-w-0">
                      {editing === planKey ? (
                        <InlineEdit
                          value={plan.title}
                          onSave={(title) => {
                            updatePlan.mutate({ id: plan.id, title });
                            setEditing(null);
                          }}
                          onCancel={() => setEditing(null)}
                        />
                      ) : (
                        <h4 className="text-sm font-medium text-gray-200 group-hover:text-matrix-accent transition-colors">
                          {plan.title}
                        </h4>
                      )}
                      {isDescExpanded && plan.description && editing !== planKey && (
                        <p className="text-xs text-matrix-muted mt-1.5 whitespace-pre-wrap border-l border-matrix-border/40 pl-2">
                          {plan.description}
                        </p>
                      )}
                      <div className="flex gap-3 mt-1.5 text-[10px] text-matrix-muted">
                        <span>
                          {pDone}/{pTasks.length} tasks
                        </span>
                        {plan.deadline && <span className="text-amber-400/70">⏰ {plan.deadline}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {plan.description && editing !== planKey && (
                        <button
                          onClick={(e) => toggleDesc(planDescKey, e)}
                          className={`text-xs text-matrix-muted hover:text-matrix-accent transition-all leading-none ${isDescExpanded ? 'rotate-90' : ''}`}
                          title="Ver descripción"
                        >
                          ▸
                        </button>
                      )}
                      <ActionButtons
                        onEdit={() => setEditing(planKey)}
                        onConfirmDelete={() => deletePlan.mutate({ id: plan.id, action: 'cascade' })}
                        confirmMessage={t('deletePlanConfirm' as LangKey, language)}
                      />
                    </div>
                  </div>
                  <ProgressBar value={plan.progress} className="mt-3" height="h-1.5" bg="bg-white/[0.05]" />
                </div>
              );
            })}
          </div>
          {objPlans.length === 0 && (
            <p className="text-xs text-matrix-muted text-center py-4">No plans in this objective yet</p>
          )}
          <InlineAdd
            label="plan"
            placeholder={t('planTitle' as LangKey, language)}
            onAdd={(title) => createPlan.mutate({ objectiveId: selectedObj, title })}
          />
        </>
      )}

      {/* Level: Tasks for selected plan */}
      {selectedPlan && (
        <div className="bg-matrix-bg border border-matrix-border/50 rounded-lg p-4">
          <div className="flex items-center gap-3 mb-3 pb-2 border-b border-matrix-border/30">
            <ProgressRing value={selectedPlanObj?.progress ?? 0} size={36} stroke={3} />
            <div>
              <h4 className="text-sm font-medium text-gray-200">{selectedPlanObj?.title}</h4>
              <p className="text-[10px] text-matrix-muted">
                {planTasks.filter((tk) => tk.status === 'done').length}/{planTasks.length} completed
              </p>
            </div>
          </div>
          <div className="space-y-1">
            {planTasks.map((task) => {
              const taskKey = `task-${task.id}`;
              return (
                <div key={task.id} className="flex items-center gap-2 py-1.5 px-2 rounded hover:bg-white/[0.02] group">
                  <button
                    onClick={() => updateTask.mutate({ id: task.id, status: nextStatus[task.status] })}
                    className={`text-sm ${statusColor[task.status]} hover:scale-110 transition-transform`}
                  >
                    {statusIcon[task.status]}
                  </button>
                  {editing === taskKey ? (
                    <InlineEdit
                      value={task.title}
                      onSave={(title) => {
                        updateTask.mutate({ id: task.id, title });
                        setEditing(null);
                      }}
                      onCancel={() => setEditing(null)}
                    />
                  ) : (
                    <span
                      className={`text-sm flex-1 ${task.status === 'done' ? 'line-through text-gray-600' : 'text-gray-300'}`}
                    >
                      {task.title}
                    </span>
                  )}
                  <span className={`text-[10px] ${priorityColor[task.priority]}`}>{task.priority}</span>
                  {editing !== taskKey && (
                    <ActionButtons
                      onEdit={() => setEditing(taskKey)}
                      onConfirmDelete={() => deleteTask.mutate(task.id)}
                      confirmMessage={t('deleteTaskConfirm' as LangKey, language)}
                    />
                  )}
                </div>
              );
            })}
            {planTasks.length === 0 && <p className="text-xs text-matrix-muted text-center py-4">No tasks yet</p>}
          </div>
          <InlineAdd
            label="task"
            placeholder={t('taskTitle' as LangKey, language)}
            onAdd={(title) => createTask.mutate({ planId: selectedPlan, title })}
          />
        </div>
      )}
    </div>
  );
}
