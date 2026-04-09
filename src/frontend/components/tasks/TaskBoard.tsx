import React, { useState, useRef, useEffect } from 'react';
import { useTasks, useCreateTask, useUpdateTask, useDeleteTask, Task } from '../../hooks/useTasks';
import { usePlans } from '../../hooks/usePlans';
import { useUiStore } from '../../stores/ui.store';
import { t, LangKey } from '../../lib/i18n';
import { Dropdown } from '../ui/Dropdown';
import { ResizableTextarea } from '../ui/ResizableTextarea';
import { Calendar } from '../ui/Calendar';

const COLUMNS = ['pending', 'in_progress', 'done'] as const;
const columnLabels: Record<string, LangKey> = {
  pending: 'pending',
  in_progress: 'inProgress',
  done: 'done',
};
const columnColors: Record<string, string> = {
  pending: 'border-t-gray-500',
  in_progress: 'border-t-amber-500',
  done: 'border-t-green-500',
};
const priorityDots: Record<string, string> = {
  low: 'bg-gray-500',
  medium: 'bg-blue-400',
  high: 'bg-orange-400',
  urgent: 'bg-red-400',
};
const priorityCycle: Record<string, string> = {
  low: 'medium',
  medium: 'high',
  high: 'urgent',
  urgent: 'low',
};

function getDeadlineBorder(deadline: string | null | undefined, status: string): string {
  if (status === 'done' || !deadline) return 'border-matrix-border/50';
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const d = new Date(deadline + 'T00:00:00');
  const taskDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  if (taskDay < today) return 'border-red-500';
  if (taskDay.getTime() === today.getTime()) return 'border-red-400';
  const soon = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
  if (taskDay <= soon) return 'border-amber-500';
  return 'border-matrix-border/50';
}

function formatDeadline(deadline: string, status: string): { label: string; color: string } {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const d = new Date(deadline + 'T00:00:00');
  const taskDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  if (status === 'done') return { label, color: 'text-matrix-muted' };
  if (taskDay < today) return { label: `Overdue · ${label}`, color: 'text-red-400' };
  if (taskDay.getTime() === today.getTime()) return { label: `Today · ${label}`, color: 'text-red-400' };
  const soon = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
  if (taskDay <= soon) return { label, color: 'text-amber-400' };
  return { label, color: 'text-matrix-muted' };
}

function hasMultipleLines(text: string): boolean {
  return text.includes('\n') || text.length > 100;
}

export function TaskBoard() {
  const { language, quickCreateModal, closeQuickCreate } = useUiStore();
  const { data: allTasks } = useTasks();
  const { data: plans } = usePlans();
  const updateTask = useUpdateTask();
  const createTask = useCreateTask();
  const deleteTask = useDeleteTask();

  const [planFilter, setPlanFilter] = useState<number | ''>('');
  const [priorityFilter, setPriorityFilter] = useState<string>('');
  const draggedRef = useRef<number | null>(null);
  const [dragOverCol, setDragOverCol] = useState<string | null>(null);
  const [expandedCard, setExpandedCard] = useState<number | null>(null);

  // Per-column add form
  const [addingToCol, setAddingToCol] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newPlanId, setNewPlanId] = useState<number | ''>('');
  const [newDeadline, setNewDeadline] = useState('');

  // Edit task state
  const [editingTaskId, setEditingTaskId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editPlanId, setEditPlanId] = useState<number | ''>('');
  const [editDeadline, setEditDeadline] = useState('');

  useEffect(() => {
    if (quickCreateModal.type === 'task') {
      setAddingToCol('pending');
      closeQuickCreate();
    }
  }, [quickCreateModal, closeQuickCreate]);

  const startEdit = (task: Task) => {
    setEditingTaskId(task.id);
    setEditTitle(task.title);
    setEditDescription(task.description ?? '');
    setEditPlanId(task.planId);
    setEditDeadline(task.deadline ?? '');
  };

  const cancelEdit = () => {
    setEditingTaskId(null);
    setEditTitle('');
    setEditDescription('');
    setEditPlanId('');
    setEditDeadline('');
  };

  const saveEdit = (id: number) => {
    const title = editTitle.trim();
    if (!title) return;
    updateTask.mutate({
      id,
      title,
      description: editDescription.trim() || undefined,
      deadline: editDeadline || null,
      ...(editPlanId ? { planId: editPlanId as number } : {}),
    });
    cancelEdit();
  };

  const cancelAdd = () => {
    setAddingToCol(null);
    setNewTitle('');
    setNewDescription('');
    setNewPlanId('');
    setNewDeadline('');
  };

  const handleAddTask = (status: string) => {
    if (!newTitle.trim() || !newPlanId) return;
    createTask.mutate({
      planId: Number(newPlanId),
      title: newTitle.trim(),
      description: newDescription.trim() || undefined,
      deadline: newDeadline || undefined,
      status,
    });
    cancelAdd();
  };

  const planNameMap = new Map<number, string>();
  for (const p of plans || []) planNameMap.set(p.id, p.title);

  const isFiltered = planFilter !== '' || priorityFilter !== '';

  const totalByCol: Record<string, number> = { pending: 0, in_progress: 0, done: 0 };
  for (const task of allTasks || []) {
    if (totalByCol[task.status] !== undefined) totalByCol[task.status]++;
  }

  let filtered = allTasks || [];
  if (planFilter) filtered = filtered.filter((t) => t.planId === planFilter);
  if (priorityFilter) filtered = filtered.filter((t) => t.priority === priorityFilter);

  const grouped: Record<string, Task[]> = { pending: [], in_progress: [], done: [] };
  for (const task of filtered) {
    const col = grouped[task.status] ? task.status : 'pending';
    grouped[col].push(task);
  }
  for (const col of COLUMNS) {
    grouped[col].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
  }

  const handleDragStart = (e: React.DragEvent, taskId: number) => {
    draggedRef.current = taskId;
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, col: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverCol(col);
  };

  const handleDragLeave = () => setDragOverCol(null);

  const handleDrop = (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    setDragOverCol(null);
    const taskId = draggedRef.current;
    draggedRef.current = null;
    if (taskId === null) return;
    const task = (allTasks || []).find((t) => t.id === taskId);
    if (!task || task.status === newStatus) return;
    updateTask.mutate({ id: taskId, status: newStatus });
  };

  return (
    <div className="p-3 md:p-4">
      {/* Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-4">
        <h1 className="text-lg font-medium text-gray-200">{t('tasks', language)}</h1>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Dropdown
            value={String(planFilter)}
            onChange={(val) => setPlanFilter(val ? Number(val) : '')}
            options={[
              { value: '', label: 'All plans' },
              ...(plans || []).map((p) => ({ value: String(p.id), label: p.title })),
            ]}
            className="w-full sm:w-40"
          />
          <Dropdown
            value={priorityFilter}
            onChange={setPriorityFilter}
            options={[
              { value: '', label: 'All priorities' },
              { value: 'low', label: t('low', language) },
              { value: 'medium', label: t('medium', language) },
              { value: 'high', label: t('high', language) },
              { value: 'urgent', label: t('urgent', language) },
            ]}
            className="w-full sm:w-36"
          />
        </div>
      </div>

      {/* Board */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 w-full">
        {COLUMNS.map((col) => {
          const visibleCount = grouped[col].length;
          const totalCount = totalByCol[col];
          const showRatio = isFiltered && visibleCount !== totalCount;

          return (
            <div
              key={col}
              className={`bg-matrix-surface border border-matrix-border border-t-2 ${columnColors[col]} rounded-md flex flex-col min-h-[400px] ${dragOverCol === col ? 'ring-1 ring-matrix-accent/50' : ''}`}
              onDragOver={(e) => handleDragOver(e, col)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, col)}
            >
              {/* Column header */}
              <div className="flex items-center justify-between px-3 py-2.5 border-b border-matrix-border/40">
                <span className="text-xs font-medium text-gray-300">{t(columnLabels[col], language)}</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] bg-matrix-border/50 text-matrix-muted px-1.5 py-0.5 rounded-full">
                    {showRatio ? `${visibleCount}/${totalCount}` : visibleCount}
                  </span>
                  {col !== 'done' && (
                    <button
                      onClick={() => setAddingToCol(addingToCol === col ? null : col)}
                      className="text-[10px] text-matrix-muted hover:text-matrix-accent transition-colors w-4 h-4 flex items-center justify-center"
                      title="Add task"
                    >
                      +
                    </button>
                  )}
                </div>
              </div>

              {/* Cards */}
              <div className="flex-1 overflow-y-auto p-2.5 space-y-2">
                {grouped[col].map((task) => {
                  const isExpanded = expandedCard === task.id;
                  const isEditing = editingTaskId === task.id;
                  const isDone = task.status === 'done';
                  const showToggle = task.description ? hasMultipleLines(task.description) : false;
                  return (
                    <div
                      key={task.id}
                      draggable={!isEditing}
                      onDragStart={(e) => !isEditing && handleDragStart(e, task.id)}
                      className={`group bg-matrix-bg border-l-2 ${getDeadlineBorder(task.deadline, task.status)} rounded-md p-3 transition-all ${isDone ? 'opacity-60' : ''} ${isEditing ? 'ring-1 ring-matrix-accent/40' : 'cursor-move hover:border-matrix-accent/30'}`}
                    >
                      {isEditing ? (
                        <div className="space-y-1.5">
                          <input
                            autoFocus
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') saveEdit(task.id);
                              if (e.key === 'Escape') cancelEdit();
                            }}
                            className="w-full bg-matrix-bg border border-matrix-accent/40 rounded px-2 py-1 text-sm text-gray-200 focus:outline-none"
                          />
                          <ResizableTextarea
                            value={editDescription}
                            onChange={(e) => setEditDescription(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Escape') cancelEdit();
                            }}
                            placeholder="Description (optional)"
                            rows={2}
                          />
                          <div className="flex flex-col gap-2 sm:flex-row">
                            <Dropdown
                              value={String(editPlanId)}
                              onChange={(val) => setEditPlanId(val ? Number(val) : '')}
                              options={(plans || []).map((p) => ({ value: String(p.id), label: p.title }))}
                              className="flex-1"
                            />
                            <div className="w-full sm:w-36">
                              <Calendar value={editDeadline} onChange={setEditDeadline} />
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => saveEdit(task.id)}
                              className="text-[10px] px-2.5 py-0.5 bg-matrix-accent/10 text-matrix-accent rounded hover:bg-matrix-accent/20 transition-colors"
                            >
                              Save
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="text-[10px] text-matrix-muted hover:text-gray-200 transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start gap-2">
                          <span className="text-gray-600 text-xs mt-0.5 shrink-0">⋮⋮</span>
                          <div className="flex-1 min-w-0">
                            <p
                              className={`text-sm leading-snug ${isDone ? 'line-through text-gray-500' : 'text-gray-300'}`}
                            >
                              {task.title}
                            </p>
                            {task.description && (
                              <div className="mt-1.5">
                                <p
                                  className={`text-xs text-matrix-muted leading-relaxed whitespace-pre-wrap ${isExpanded ? '' : 'line-clamp-2'}`}
                                >
                                  {task.description}
                                </p>
                                {showToggle && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setExpandedCard(isExpanded ? null : task.id);
                                    }}
                                    className="text-[10px] text-matrix-accent hover:text-matrix-accent-hover mt-0.5"
                                  >
                                    {isExpanded ? '▲' : '▼'}
                                  </button>
                                )}
                              </div>
                            )}
                            <div className="flex items-center gap-2 mt-2 flex-wrap">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  updateTask.mutate({ id: task.id, priority: priorityCycle[task.priority] });
                                }}
                                title="Click to change priority"
                                className="flex items-center gap-1.5 hover:opacity-70 transition-opacity"
                              >
                                <span className={`w-2 h-2 rounded-full shrink-0 ${priorityDots[task.priority]}`} />
                                <span
                                  className={`text-[10px] font-medium ${priorityDots[task.priority].replace('bg-', 'text-')}`}
                                >
                                  {t(task.priority as LangKey, language)}
                                </span>
                              </button>
                              <span className="text-matrix-border">·</span>
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-matrix-surface border border-matrix-border/50 text-matrix-muted truncate max-w-[100px]">
                                {planNameMap.get(task.planId) || ''}
                              </span>
                              {task.deadline &&
                                (() => {
                                  const { label, color } = formatDeadline(task.deadline, task.status);
                                  return (
                                    <>
                                      <span className="text-matrix-border">·</span>
                                      <span className={`text-[10px] ${color}`}>📅 {label}</span>
                                    </>
                                  );
                                })()}
                            </div>
                            {/* Mobile-only status selector */}
                            <div className="flex gap-1 mt-2 md:hidden">
                              {COLUMNS.map((s) => (
                                <button
                                  key={s}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (task.status !== s) updateTask.mutate({ id: task.id, status: s });
                                  }}
                                  className={`text-[10px] px-2 py-0.5 rounded border transition-colors ${
                                    task.status === s
                                      ? 'border-matrix-accent/60 bg-matrix-accent/10 text-matrix-accent'
                                      : 'border-matrix-border/40 text-matrix-muted hover:text-gray-300'
                                  }`}
                                >
                                  {t(columnLabels[s], language)}
                                </button>
                              ))}
                            </div>
                          </div>
                          <span className="inline-flex items-center gap-1 shrink-0">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                startEdit(task);
                              }}
                              className="text-[10px] text-matrix-muted/50 hover:text-matrix-accent"
                              title="Edit"
                            >
                              ✎
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteTask.mutate(task.id);
                              }}
                              className="text-[10px] text-matrix-muted/50 hover:text-matrix-danger"
                              title="Delete"
                            >
                              ✕
                            </button>
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Inline add form */}
                {addingToCol === col && (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleAddTask(col);
                    }}
                    className="bg-matrix-bg border border-matrix-accent/30 rounded-md p-2.5 space-y-2"
                  >
                    <input
                      autoFocus
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Escape') cancelAdd();
                      }}
                      placeholder={t('taskTitle', language)}
                      className="w-full bg-transparent border border-matrix-border rounded px-2 py-1 text-xs text-gray-300 placeholder-gray-600 focus:outline-none focus:border-matrix-accent/60"
                    />
                    <ResizableTextarea
                      value={newDescription}
                      onChange={(e) => setNewDescription(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Escape') cancelAdd();
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleAddTask(col);
                        }
                      }}
                      placeholder={t('taskDescription', language)}
                      rows={2}
                    />
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <Dropdown
                        value={String(newPlanId)}
                        onChange={(val) => setNewPlanId(val ? Number(val) : '')}
                        options={[
                          { value: '', label: t('selectPlan', language) },
                          ...(plans || []).map((p) => ({ value: String(p.id), label: p.title })),
                        ]}
                        className="flex-1"
                      />
                      <div className="w-full sm:w-36">
                        <Calendar value={newDeadline} onChange={setNewDeadline} />
                      </div>
                    </div>
                    <div className="flex items-center gap-2 justify-end">
                      <button
                        type="submit"
                        className="px-2.5 py-1 bg-matrix-accent/10 text-matrix-accent text-[10px] rounded hover:bg-matrix-accent/20 transition-colors"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={cancelAdd}
                        className="px-2.5 py-1 text-matrix-muted text-[10px] rounded hover:text-gray-200 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
