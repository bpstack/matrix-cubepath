import React, { useState } from 'react';
import { useMission, useUpdateMission } from '../../../hooks/useMission';
import {
  useObjectives,
  useCreateObjective,
  useUpdateObjective,
  useDeleteObjective,
} from '../../../hooks/useObjectives';
import { usePlans, useCreatePlan, useUpdatePlan, useDeletePlan } from '../../../hooks/usePlans';
import { useTasks, useCreateTask, useUpdateTask, useDeleteTask } from '../../../hooks/useTasks';
import { useUiStore } from '../../../stores/ui.store';
import { t, LangKey } from '../../../lib/i18n';
import { ProgressBar, ActionButtons } from '../primitives';
import { InlineEdit } from '../inline-forms';
import { SchemaViewToggle, SchemaViewMode } from './SchemaViewToggle';
import { ResizableTextarea } from '../../../components/ui/ResizableTextarea';

export function TreeView({
  schemaView,
  setSchemaView,
}: {
  schemaView: SchemaViewMode;
  setSchemaView: (m: SchemaViewMode) => void;
}) {
  const { language } = useUiStore();
  const { data: missions } = useMission();
  const updateMission = useUpdateMission();
  const mission = missions?.[0];
  const { data: objectives } = useObjectives(mission?.id);
  const createObjective = useCreateObjective();
  const updateObjective = useUpdateObjective();
  const deleteObjective = useDeleteObjective();

  const [expandedObj, setExpandedObj] = useState<number | null>(null);
  const { data: plans } = usePlans(expandedObj ?? undefined);
  const createPlan = useCreatePlan();
  const updatePlan = useUpdatePlan();
  const deletePlan = useDeletePlan();

  const [expandedPlan, setExpandedPlan] = useState<number | null>(null);
  const { data: planTasks } = useTasks(expandedPlan ? { planId: expandedPlan } : undefined);
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();

  const [editing, setEditing] = useState<string | null>(null);
  const [editDrafts, setEditDrafts] = useState<Record<string, { title?: string; description?: string }>>({});
  const [addingObj, setAddingObj] = useState(false);
  const [newObjTitle, setNewObjTitle] = useState('');
  const [newObjDesc, setNewObjDesc] = useState('');
  const [addingPlan, setAddingPlan] = useState(false);
  const [newPlanTitle, setNewPlanTitle] = useState('');
  const [newPlanDesc, setNewPlanDesc] = useState('');
  const [addingTask, setAddingTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');

  const statusIcon: Record<string, string> = { pending: '○', in_progress: '◐', done: '●' };
  const statusColor: Record<string, string> = {
    pending: 'text-gray-500',
    in_progress: 'text-matrix-warning',
    done: 'text-matrix-success',
  };
  const priorityColor: Record<string, string> = {
    low: 'text-gray-500',
    medium: 'text-blue-400',
    high: 'text-orange-400',
    urgent: 'text-red-400',
  };
  const nextStatus: Record<string, string> = { pending: 'in_progress', in_progress: 'done', done: 'pending' };

  if (!mission) return null;

  return (
    <div>
      <div className="flex justify-end mb-3">
        <SchemaViewToggle value={schemaView} onChange={setSchemaView} />
      </div>
      {/* Mission */}
      <div className="group flex items-center justify-between mb-1 border-l-2 border-matrix-accent pl-2">
        {editing === 'mission' ? (
          <div className="flex-1 space-y-1">
            <InlineEdit
              value={mission.title}
              onSave={(title) => {
                updateMission.mutate({ id: mission.id, title });
                setEditing(null);
              }}
              onCancel={() => setEditing(null)}
            />
            <ResizableTextarea
              value={mission.description || ''}
              onChange={(e) => updateMission.mutate({ id: mission.id, description: e.target.value || undefined })}
              placeholder={t('descriptionOptional' as LangKey, language)}
            />
          </div>
        ) : (
          <span className="text-sm font-medium text-gray-200 uppercase">{mission.title}</span>
        )}
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-matrix-muted">{mission.progress}%</span>
          {editing !== 'mission' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setEditing('mission');
              }}
              className="text-[10px] text-matrix-muted/50 hover:text-matrix-accent transition-colors"
            >
              ✎
            </button>
          )}
        </div>
      </div>
      {!editing && mission.description && <p className="text-xs text-matrix-muted mb-1.5">{mission.description}</p>}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs font-semibold text-matrix-accent uppercase tracking-wider">Meta</span>
        <div className="flex-1">
          <ProgressBar value={mission.progress} />
        </div>
        <span className="text-xs font-mono text-matrix-muted w-8 text-right">{mission.progress}%</span>
      </div>

      {/* Objectives */}
      <div className="space-y-1">
        {objectives?.map((obj, idx) => {
          const objKey = `obj-${obj.id}`;
          return (
            <div key={obj.id} className="border border-matrix-border/40 rounded overflow-visible">
              <div
                className="group flex items-start gap-2 px-3 py-1.5 cursor-pointer hover:bg-white/[0.02] transition-colors"
                onClick={() => {
                  if (editing !== objKey) {
                    setExpandedObj(expandedObj === obj.id ? null : obj.id);
                    setExpandedPlan(null);
                  }
                }}
              >
                <span
                  className={`text-[10px] text-matrix-muted transition-transform mt-1 ${expandedObj === obj.id ? 'rotate-90' : ''}`}
                >
                  ▸
                </span>
                <div className="flex-1 min-w-0">
                  {editing === objKey ? (
                    <div className="space-y-1">
                      <input
                        value={editDrafts[objKey]?.title ?? obj.title}
                        onChange={(e) =>
                          setEditDrafts((d) => ({ ...d, [objKey]: { ...d[objKey], title: e.target.value } }))
                        }
                        onBlur={() => {
                          updateObjective.mutate({ id: obj.id, title: editDrafts[objKey]?.title ?? obj.title });
                          setEditing(null);
                        }}
                        className="bg-matrix-bg border border-matrix-accent/40 rounded px-2 py-1.5 text-base text-gray-200 focus:outline-none w-full"
                      />
                      <ResizableTextarea
                        value={editDrafts[objKey]?.description ?? obj.description ?? ''}
                        onChange={(e) =>
                          setEditDrafts((d) => ({ ...d, [objKey]: { ...d[objKey], description: e.target.value } }))
                        }
                        onBlur={() => {
                          updateObjective.mutate({
                            id: obj.id,
                            description: editDrafts[objKey]?.description ?? obj.description ?? undefined,
                          });
                          setEditing(null);
                        }}
                        placeholder={t('descriptionOptional' as LangKey, language)}
                      />
                      <button
                        onClick={() => {
                          updateObjective.mutate({
                            id: obj.id,
                            title: editDrafts[objKey]?.title ?? obj.title,
                            description: editDrafts[objKey]?.description ?? obj.description ?? undefined,
                          });
                          setEditing(null);
                        }}
                        className="text-xs text-matrix-muted hover:text-gray-200"
                      >
                        Done
                      </button>
                    </div>
                  ) : (
                    <span className="text-sm text-gray-300 block truncate">{obj.title}</span>
                  )}
                  {obj.description && expandedObj === obj.id && (
                    <span className="text-xs text-matrix-muted/70 block mt-0.5 whitespace-pre-wrap">
                      {obj.description}
                    </span>
                  )}
                </div>
                <div className="flex flex-col items-end gap-0.5">
                  <div className="w-12">
                    <ProgressBar value={obj.progress} />
                  </div>
                  <span className="text-[10px] text-gray-500">Objetivo {idx + 1}</span>
                </div>
                <span className="text-[10px] font-mono text-matrix-muted/60 ml-1">{obj.progress}%</span>
                <ActionButtons
                  showOnHover={false}
                  onEdit={() => {
                    setEditing(objKey);
                    setEditDrafts((d) => ({
                      ...d,
                      [objKey]: { title: obj.title, description: obj.description || '' },
                    }));
                  }}
                  onConfirmDelete={() => deleteObjective.mutate({ id: obj.id, action: 'cascade' })}
                  confirmMessage={t('deleteObjectiveConfirm' as LangKey, language)}
                />
              </div>
              {expandedObj === obj.id && (
                <div className="px-3 pb-2 pt-1 border-t border-matrix-border/30 transition-all duration-300">
                  <div className="ml-3 space-y-1">
                    {plans?.map((plan, planIdx) => {
                      const planKey = `plan-${plan.id}`;
                      return (
                        <div key={plan.id}>
                          <div
                            className="group flex items-start gap-2 py-1 px-2 rounded cursor-pointer hover:bg-white/[0.02] transition-colors"
                            onClick={() => {
                              if (editing !== planKey) setExpandedPlan(expandedPlan === plan.id ? null : plan.id);
                            }}
                          >
                            <span
                              className={`text-[9px] text-matrix-muted transition-transform mt-0.5 ${expandedPlan === plan.id ? 'rotate-90' : ''}`}
                            >
                              ▸
                            </span>
                            {editing === planKey ? (
                              <div className="flex-1 space-y-1" onClick={(e) => e.stopPropagation()}>
                                <input
                                  value={editDrafts[planKey]?.title ?? plan.title}
                                  onChange={(e) =>
                                    setEditDrafts((d) => ({
                                      ...d,
                                      [planKey]: { ...d[planKey], title: e.target.value },
                                    }))
                                  }
                                  autoFocus
                                  className="w-full bg-matrix-bg border border-matrix-accent/40 rounded px-2 py-1.5 text-base text-gray-200 focus:outline-none"
                                />
                                <ResizableTextarea
                                  value={editDrafts[planKey]?.description ?? plan.description ?? ''}
                                  onChange={(e) =>
                                    setEditDrafts((d) => ({
                                      ...d,
                                      [planKey]: { ...d[planKey], description: e.target.value },
                                    }))
                                  }
                                  placeholder={t('descriptionOptional' as LangKey, language)}
                                />
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => {
                                      updatePlan.mutate({
                                        id: plan.id,
                                        title: editDrafts[planKey]?.title ?? plan.title,
                                        description: editDrafts[planKey]?.description ?? plan.description ?? undefined,
                                      });
                                      setEditing(null);
                                    }}
                                    className="text-xs text-matrix-accent hover:text-matrix-accent-hover"
                                  >
                                    Save
                                  </button>
                                  <button
                                    onClick={() => setEditing(null)}
                                    className="text-xs text-matrix-muted hover:text-gray-200"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <span className="text-sm text-gray-400 flex-1">{plan.title}</span>
                            )}
                            <div className="flex flex-col items-end gap-0.5">
                              <div className="w-10">
                                <ProgressBar value={plan.progress} />
                              </div>
                              <span className="text-[9px] text-gray-500">Plan {planIdx + 1}</span>
                            </div>
                            <span className="text-[10px] font-mono text-matrix-muted/60 ml-1">{plan.progress}%</span>
                            <ActionButtons
                              showOnHover={false}
                              onEdit={() => {
                                setEditing(planKey);
                                setEditDrafts((d) => ({
                                  ...d,
                                  [planKey]: { title: plan.title, description: plan.description || '' },
                                }));
                              }}
                              onConfirmDelete={() => deletePlan.mutate({ id: plan.id, action: 'cascade' })}
                              confirmMessage={t('deletePlanConfirm' as LangKey, language)}
                            />
                          </div>
                          {expandedPlan === plan.id && (
                            <div className="ml-6 mt-0.5 space-y-px mb-1.5">
                              {plan.description && (
                                <p className="text-xs text-matrix-muted/70 whitespace-pre-wrap py-1 px-1.5 mb-1 border-l border-matrix-border/30">
                                  {plan.description}
                                </p>
                              )}
                              {planTasks?.map((task) => {
                                const taskKey = `task-${task.id}`;
                                return (
                                  <div
                                    key={task.id}
                                    className="group flex items-center gap-1.5 py-1 px-1.5 rounded hover:bg-white/[0.02]"
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
                                        className={`text-sm flex-1 ${task.status === 'done' ? 'line-through text-gray-600' : 'text-gray-400'}`}
                                      >
                                        {task.title}
                                      </span>
                                    )}
                                    <span className={`text-[10px] ${priorityColor[task.priority]}`}>
                                      {t(task.priority as LangKey, language)}
                                    </span>
                                    {editing !== taskKey && (
                                      <ActionButtons
                                        showOnHover={false}
                                        onEdit={() => setEditing(taskKey)}
                                        onConfirmDelete={() => deleteTask.mutate(task.id)}
                                        confirmMessage={t('deleteTaskConfirm' as LangKey, language)}
                                      />
                                    )}
                                  </div>
                                );
                              })}
                              {addingTask ? (
                                <form
                                  className="space-y-1 mt-0.5"
                                  onSubmit={(e) => {
                                    e.preventDefault();
                                    if (!newTaskTitle.trim()) return;
                                    createTask.mutate({ planId: plan.id, title: newTaskTitle.trim() });
                                    setNewTaskTitle('');
                                    setAddingTask(false);
                                  }}
                                >
                                  <input
                                    value={newTaskTitle}
                                    onChange={(e) => setNewTaskTitle(e.target.value)}
                                    placeholder={t('taskPlaceholder' as LangKey, language)}
                                    autoFocus
                                    className="w-full bg-transparent border border-matrix-border/50 rounded px-2 py-1.5 text-base text-gray-200 placeholder-gray-600 focus:outline-none focus:border-matrix-accent/40"
                                  />
                                  <div className="flex gap-2">
                                    <button
                                      type="submit"
                                      className="text-xs text-matrix-accent hover:text-matrix-accent-hover"
                                    >
                                      Save
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setNewTaskTitle('');
                                        setAddingTask(false);
                                      }}
                                      className="text-xs text-matrix-muted hover:text-gray-200"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </form>
                              ) : (
                                <button
                                  onClick={() => setAddingTask(true)}
                                  className="text-xs text-gray-500 hover:text-matrix-accent transition-colors ml-1 mt-0.5"
                                >
                                  + task
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                    {addingPlan ? (
                      <form
                        className="space-y-1 mt-0.5"
                        onSubmit={(e) => {
                          e.preventDefault();
                          if (!newPlanTitle.trim()) return;
                          createPlan.mutate({
                            objectiveId: obj.id,
                            title: newPlanTitle.trim(),
                            description: newPlanDesc.trim() || undefined,
                          });
                          setNewPlanTitle('');
                          setNewPlanDesc('');
                          setAddingPlan(false);
                        }}
                      >
                        <input
                          value={newPlanTitle}
                          onChange={(e) => setNewPlanTitle(e.target.value)}
                          placeholder={t('planPlaceholder' as LangKey, language)}
                          autoFocus
                          className="w-full bg-transparent border border-matrix-border/50 rounded px-2 py-1.5 text-base text-gray-200 placeholder-gray-600 focus:outline-none focus:border-matrix-accent/40"
                        />
                        <ResizableTextarea
                          value={newPlanDesc}
                          onChange={(e) => setNewPlanDesc(e.target.value)}
                          placeholder={t('descriptionOptional' as LangKey, language)}
                        />
                        <div className="flex gap-2">
                          <button type="submit" className="text-xs text-matrix-accent hover:text-matrix-accent-hover">
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setNewPlanTitle('');
                              setNewPlanDesc('');
                              setAddingPlan(false);
                            }}
                            className="text-xs text-matrix-muted hover:text-gray-200"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    ) : (
                      <button
                        onClick={() => setAddingPlan(true)}
                        className="text-xs text-gray-500 hover:text-matrix-accent transition-colors mt-0.5"
                      >
                        + plan
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {addingObj ? (
          <form
            className="space-y-1"
            onSubmit={(e) => {
              e.preventDefault();
              if (!newObjTitle.trim()) return;
              createObjective.mutate({
                missionId: mission.id,
                title: newObjTitle.trim(),
                description: newObjDesc.trim() || undefined,
              });
              setNewObjTitle('');
              setNewObjDesc('');
              setAddingObj(false);
            }}
          >
            <input
              value={newObjTitle}
              onChange={(e) => setNewObjTitle(e.target.value)}
              placeholder={t('objectivePlaceholder' as LangKey, language)}
              autoFocus
              className="w-full bg-transparent border border-matrix-border/50 rounded px-2 py-1.5 text-base text-gray-200 placeholder-gray-600 focus:outline-none focus:border-matrix-accent/40"
            />
            <ResizableTextarea
              value={newObjDesc}
              onChange={(e) => setNewObjDesc(e.target.value)}
              placeholder={t('descriptionOptional' as LangKey, language)}
            />
            <div className="flex gap-2">
              <button type="submit" className="text-xs text-matrix-accent hover:text-matrix-accent-hover">
                Save
              </button>
              <button
                type="button"
                onClick={() => {
                  setNewObjTitle('');
                  setNewObjDesc('');
                  setAddingObj(false);
                }}
                className="text-xs text-matrix-muted hover:text-gray-200"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setAddingObj(true)}
            className="text-xs text-gray-500 hover:text-matrix-accent transition-colors"
          >
            + objective
          </button>
        )}
      </div>
    </div>
  );
}
