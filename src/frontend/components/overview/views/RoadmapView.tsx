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
  progressColorText,
  ProgressBar,
  ProgressRing,
  DeleteConfirmButton,
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

export function RoadmapView({ mission, objectives, allPlans, allTasks }: ViewProps) {
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const createObjective = useCreateObjective();
  const updateObjective = useUpdateObjective();
  const deleteObjective = useDeleteObjective();
  const createPlan = useCreatePlan();
  const updatePlan = useUpdatePlan();
  const deletePlan = useDeletePlan();
  const createTask = useCreateTask();
  const { language } = useUiStore();
  const [expandedPlan, setExpandedPlan] = useState<number | null>(null);
  const [editing, setEditing] = useState<string | null>(null);

  return (
    <div className="space-y-2">
      {/* Mission root node */}
      <div className="flex items-center gap-3 bg-gradient-to-r from-matrix-accent/10 to-transparent rounded-lg px-4 py-3 border border-matrix-accent/20">
        <ProgressRing value={mission.progress} size={40} stroke={3} />
        <div className="flex-1 min-w-0">
          <p className="text-[10px] text-matrix-accent uppercase tracking-wider font-semibold">Mission</p>
          <p className="text-sm text-gray-200 font-medium uppercase">{mission.title}</p>
        </div>
      </div>

      {/* Objectives tree */}
      <div className="ml-2">
        {objectives.map((obj, objIdx) => {
          const objKey = `obj-${obj.id}`;
          const objPlans = allPlans.filter((p) => p.objectiveId === obj.id);
          const isLast = objIdx === objectives.length - 1;
          return (
            <div key={obj.id} className="relative">
              {/* Vertical connector line */}
              <div className={`absolute left-3 top-0 w-px bg-matrix-border/40 ${isLast ? 'h-6' : 'h-full'}`} />

              {/* Objective node */}
              <div className="flex items-start gap-0 ml-0">
                {/* Horizontal branch */}
                <div className="flex items-center shrink-0 mt-4">
                  <div className="w-3 h-px bg-matrix-border/40" />
                  <div
                    className={`w-2.5 h-2.5 rounded-full border-2 shrink-0 ${
                      obj.progress >= 100
                        ? 'bg-green-500 border-green-500'
                        : obj.progress > 0
                          ? 'bg-amber-500 border-amber-500'
                          : 'bg-matrix-bg border-matrix-border'
                    }`}
                  />
                  <div className="w-2 h-px bg-matrix-border/40" />
                </div>

                <div className="flex-1 min-w-0 pb-2">
                  <div className="bg-matrix-bg border border-matrix-border/40 rounded-lg px-3 py-2.5 hover:border-matrix-accent/20 transition-colors group">
                    <div className="flex items-center gap-2">
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
                        <span className="text-sm text-gray-200 font-medium flex-1">{obj.title}</span>
                      )}
                      {editing !== objKey && (
                        <>
                          <span className={`text-xs font-mono ${progressColorText(obj.progress)}`}>
                            {obj.progress}%
                          </span>
                          <ActionButtons
                            onEdit={() => setEditing(objKey)}
                            onConfirmDelete={() => deleteObjective.mutate({ id: obj.id, action: 'cascade' })}
                            confirmMessage={t('deleteObjectiveConfirm' as LangKey, language)}
                          />
                        </>
                      )}
                    </div>
                    <ProgressBar value={obj.progress} className="mt-1.5" height="h-1.5" bg="bg-white/[0.05]" />

                    {/* Plans inside objective */}
                    <div className="mt-2.5 ml-1 space-y-1">
                      {objPlans.map((plan, planIdx) => {
                        const planKey = `plan-${plan.id}`;
                        const pTasks = allTasks.filter((tk) => tk.planId === plan.id);
                        const isExpanded = expandedPlan === plan.id;
                        const isLastPlan = planIdx === objPlans.length - 1;
                        return (
                          <div key={plan.id} className="relative">
                            <div
                              className="group/plan flex items-center gap-2 py-1.5 px-2 rounded cursor-pointer hover:bg-white/[0.03] transition-colors"
                              onClick={() => {
                                if (editing !== planKey) setExpandedPlan(isExpanded ? null : plan.id);
                              }}
                            >
                              <div className="flex items-center shrink-0">
                                <span className="text-matrix-muted/30 text-[10px]">{isLastPlan ? '└' : '├'}</span>
                              </div>
                              <div
                                className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                  plan.progress >= 100
                                    ? 'bg-green-500'
                                    : plan.progress > 0
                                      ? 'bg-amber-500'
                                      : 'bg-gray-600'
                                }`}
                              />
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
                                <span className="text-sm text-gray-400 flex-1 truncate">{plan.title}</span>
                              )}
                              {editing !== planKey && (
                                <>
                                  <div className="w-16 shrink-0">
                                    <ProgressBar value={plan.progress} height="h-1.5" bg="bg-white/[0.05]" />
                                  </div>
                                  <span className="text-[10px] font-mono text-matrix-muted w-7 text-right">
                                    {plan.progress}%
                                  </span>
                                  <span className="inline-flex items-center gap-1 opacity-0 group-hover/plan:opacity-100 transition-opacity">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setEditing(planKey);
                                      }}
                                      className="text-[10px] text-matrix-muted/50 hover:text-matrix-accent transition-colors"
                                    >
                                      ✎
                                    </button>
                                    <DeleteConfirmButton
                                      onConfirm={() => deletePlan.mutate({ id: plan.id, action: 'cascade' })}
                                      confirmMessage={t('deletePlanConfirm' as LangKey, language)}
                                    />
                                  </span>
                                  <span
                                    className={`text-[10px] text-matrix-muted transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                                  >
                                    ▸
                                  </span>
                                </>
                              )}
                            </div>

                            {/* Tasks expand */}
                            {isExpanded && (
                              <div className="ml-8 mb-1 space-y-px">
                                {plan.description && (
                                  <p className="text-xs text-matrix-muted/70 whitespace-pre-wrap py-1 px-1.5 mb-1 border-l border-matrix-border/30">
                                    {plan.description}
                                  </p>
                                )}
                                {pTasks.map((task) => {
                                  const taskKey = `task-${task.id}`;
                                  return (
                                    <div
                                      key={task.id}
                                      className="flex items-center gap-2 py-1 px-2 rounded hover:bg-white/[0.02] group/task"
                                    >
                                      <button
                                        onClick={() =>
                                          updateTask.mutate({ id: task.id, status: nextStatus[task.status] })
                                        }
                                        className={`text-xs ${statusColor[task.status]}`}
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
                                          className={`text-xs flex-1 ${task.status === 'done' ? 'line-through text-gray-600' : 'text-gray-400'}`}
                                        >
                                          {task.title}
                                        </span>
                                      )}
                                      <span className={`text-[9px] ${priorityColor[task.priority]}`}>
                                        {task.priority}
                                      </span>
                                      {editing !== taskKey && (
                                        <span className="inline-flex items-center gap-1 opacity-0 group-hover/task:opacity-100 transition-opacity">
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setEditing(taskKey);
                                            }}
                                            className="text-[10px] text-matrix-muted/50 hover:text-matrix-accent transition-colors"
                                          >
                                            ✎
                                          </button>
                                          <DeleteConfirmButton
                                            onConfirm={() => deleteTask.mutate(task.id)}
                                            confirmMessage={t('deleteTaskConfirm' as LangKey, language)}
                                          />
                                        </span>
                                      )}
                                    </div>
                                  );
                                })}
                                <InlineAdd
                                  label="task"
                                  placeholder={t('taskPlaceholder' as LangKey, language)}
                                  onAdd={(title) => createTask.mutate({ planId: plan.id, title })}
                                />
                              </div>
                            )}
                          </div>
                        );
                      })}
                      <InlineAdd
                        label="plan"
                        placeholder={t('planPlaceholder' as LangKey, language)}
                        onAdd={(title) => createPlan.mutate({ objectiveId: obj.id, title })}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* + objective at the bottom of the tree */}
        <div className="relative">
          <div className="absolute left-3 top-0 w-px bg-matrix-border/40 h-4" />
          <div className="flex items-center ml-0 mt-0">
            <div className="flex items-center shrink-0">
              <div className="w-3 h-px bg-matrix-border/40" />
              <div className="w-2 h-px" />
              <div className="w-2 h-px" />
            </div>
            <div className="ml-2">
              <InlineAddObjective missionId={mission.id} onCreate={(data) => createObjective.mutate(data)} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
