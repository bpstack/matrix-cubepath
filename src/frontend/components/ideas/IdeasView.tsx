import React, { useState, useEffect } from 'react';
import {
  useIdeas,
  useCreateIdea,
  useDeleteIdea,
  useEvaluateIdea,
  useIdeaEvaluation,
  useDecideIdea,
  usePromoteIdea,
  useUpdateIdea,
  Idea,
} from '../../hooks/useIdeas';
import { useObjectives } from '../../hooks/useObjectives';
import { usePlans } from '../../hooks/usePlans';
import { useMission } from '../../hooks/useMission';
import { useProjects } from '../../hooks/useProjects';
import { useUiStore } from '../../stores/ui.store';
import { t } from '../../lib/i18n';
import { Dropdown } from '../ui/Dropdown';
import { Modal } from '../ui/Modal';
import { ResizableTextarea } from '../ui/ResizableTextarea';

const columns = [
  { key: 'pending', label: 'Pending', color: 'border-gray-600' },
  { key: 'evaluating', label: 'Evaluating', color: 'border-yellow-600' },
  { key: 'approved', label: 'Approved', color: 'border-green-600' },
  { key: 'rejected', label: 'Rejected', color: 'border-red-600' },
] as const;

function calcTotal(a: number, i: number, c: number, r: number) {
  return Math.round((a * 0.4 + i * 0.3 + (10 - c) * 0.15 + (10 - r) * 0.15) * 100) / 100;
}

const scoreLabels = {
  alignment: { en: 'Alignment', es: 'Alineacion', abbr: 'ALI' },
  impact: { en: 'Impact', es: 'Impacto', abbr: 'IMP' },
  cost: { en: 'Cost', es: 'Coste', abbr: 'CST' },
  risk: { en: 'Risk', es: 'Riesgo', abbr: 'RSK' },
} as const;

type EntityItem = { id: number; title: string };
type ProjectItem = { id: number; name: string };

/* ─── CreateIdeaModal ─── */

function CreateIdeaModal({
  language,
  objectivesList,
  plansList,
  mission,
  projectsList,
  onClose,
  onCreated,
  editIdea,
  onUpdated,
}: {
  language: 'en' | 'es';
  objectivesList: EntityItem[];
  plansList: EntityItem[];
  mission: { id: number; title: string } | undefined;
  projectsList: ProjectItem[];
  onClose: () => void;
  onCreated: (data: {
    title: string;
    description?: string;
    targetType?: string;
    targetId?: number;
    projectId?: number;
  }) => void;
  editIdea?: Idea | null;
  onUpdated?: (data: {
    id: number;
    title?: string;
    description?: string;
    targetType?: string | null;
    targetId?: number | null;
    projectId?: number | null;
  }) => void;
}) {
  const isEdit = !!editIdea;
  const [newTitle, setNewTitle] = useState(editIdea?.title ?? '');
  const [newDesc, setNewDesc] = useState(editIdea?.description ?? '');
  const [newTargetType, setNewTargetType] = useState(editIdea?.targetType ?? '');
  const [newTargetId, setNewTargetId] = useState<number | ''>(editIdea?.targetId ?? '');
  const [newProjectId, setNewProjectId] = useState<number | ''>(editIdea?.projectId ?? '');

  const targetEntities = (): EntityItem[] => {
    switch (newTargetType) {
      case 'mission':
        return mission ? [{ id: mission.id, title: mission.title }] : [];
      case 'objective':
        return objectivesList.map((o) => ({ id: o.id, title: o.title }));
      case 'plan':
        return plansList.map((p) => ({ id: p.id, title: p.title }));
      default:
        return [];
    }
  };

  const handleSubmit = () => {
    if (!newTitle.trim()) return;
    if (isEdit && onUpdated) {
      onUpdated({
        id: editIdea!.id,
        title: newTitle.trim(),
        description: newDesc.trim() || undefined,
        targetType: newTargetType || null,
        targetId: newTargetId ? Number(newTargetId) : null,
        projectId: newProjectId ? Number(newProjectId) : null,
      });
    } else {
      onCreated({
        title: newTitle.trim(),
        description: newDesc.trim() || undefined,
        targetType: newTargetType || undefined,
        targetId: newTargetId ? Number(newTargetId) : undefined,
        projectId: newProjectId ? Number(newProjectId) : undefined,
      });
    }
    onClose();
  };

  return (
    <Modal
      onClose={onClose}
      title={isEdit ? (language === 'es' ? 'Editar idea' : 'Edit idea') : language === 'es' ? 'Nueva idea' : 'New idea'}
    >
      <div className="space-y-3">
        <input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder={language === 'es' ? 'Titulo de la idea...' : 'Idea title...'}
          className="w-full bg-matrix-bg border border-matrix-border rounded px-3 py-2 text-sm text-gray-200 focus:border-matrix-accent/50 outline-none"
          autoFocus
        />
        <ResizableTextarea
          value={newDesc}
          onChange={(e) => setNewDesc(e.target.value)}
          placeholder={language === 'es' ? 'Descripcion (opcional)' : 'Description (optional)'}
          rows={3}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-matrix-muted block mb-1">
              {language === 'es' ? 'Vincular a' : 'Link to'}
            </label>
            <Dropdown
              value={newTargetType}
              onChange={(val) => {
                setNewTargetType(val);
                setNewTargetId('');
              }}
              options={[
                { value: '', label: '--' },
                { value: 'mission', label: 'Mission' },
                { value: 'objective', label: 'Objective' },
                { value: 'plan', label: 'Plan' },
                { value: 'task', label: 'Task' },
              ]}
            />
          </div>
          {newTargetType && newTargetType !== 'task' && (
            <div>
              <label className="text-xs text-matrix-muted block mb-1">{language === 'es' ? 'Entidad' : 'Entity'}</label>
              <Dropdown
                value={String(newTargetId)}
                onChange={(val) => setNewTargetId(val ? Number(val) : '')}
                options={[
                  { value: '', label: '--' },
                  ...targetEntities().map((e) => ({
                    value: String(e.id),
                    label: e.title,
                  })),
                ]}
              />
            </div>
          )}
        </div>
        <div>
          <label className="text-xs text-matrix-muted block mb-1">{language === 'es' ? 'Proyecto' : 'Project'}</label>
          <Dropdown
            value={String(newProjectId)}
            onChange={(val) => setNewProjectId(val ? Number(val) : '')}
            options={[
              { value: '', label: '--' },
              ...projectsList.map((p) => ({
                value: String(p.id),
                label: p.name,
              })),
            ]}
          />
        </div>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button onClick={onClose} className="px-3 py-1 text-sm text-gray-400 hover:text-gray-300">
            {t('cancel', language)}
          </button>
          <button
            onClick={handleSubmit}
            disabled={!newTitle.trim()}
            className="px-3 py-1 text-sm bg-matrix-accent/10 text-matrix-accent border border-matrix-accent/30 rounded hover:bg-matrix-accent/20 disabled:opacity-40"
          >
            {isEdit ? t('save', language) : t('create', language)}
          </button>
        </div>
      </div>
    </Modal>
  );
}

/* ─── EvaluateModal ─── */

function EvaluateModal({
  idea,
  language,
  onClose,
  onEvaluated,
  onDecide,
}: {
  idea: Idea;
  language: 'en' | 'es';
  onClose: () => void;
  onEvaluated: (data: {
    id: number;
    alignmentScore: number;
    impactScore: number;
    costScore: number;
    riskScore: number;
    reasoning?: string;
  }) => void;
  onDecide: (id: number, decision: 'approved' | 'rejected') => void;
}) {
  const [scores, setScores] = useState({ alignment: 5, impact: 5, cost: 5, risk: 5 });
  const [reasoning, setReasoning] = useState('');
  const [evalLoaded, setEvalLoaded] = useState(false);

  const { data: existingEval } = useIdeaEvaluation(idea.id);

  useEffect(() => {
    if (existingEval && !evalLoaded) {
      setScores({
        alignment: existingEval.alignmentScore,
        impact: existingEval.impactScore,
        cost: existingEval.costScore,
        risk: existingEval.riskScore,
      });
      setReasoning(existingEval.reasoning || '');
      setEvalLoaded(true);
    }
  }, [existingEval, evalLoaded]);

  const handleEvaluate = () => {
    onEvaluated({
      id: idea.id,
      alignmentScore: scores.alignment,
      impactScore: scores.impact,
      costScore: scores.cost,
      riskScore: scores.risk,
      reasoning: reasoning || undefined,
    });
    onClose();
  };

  return (
    <Modal onClose={onClose} title={`${language === 'es' ? 'Evaluar' : 'Evaluate'}: ${idea.title}`}>
      <div className="space-y-4">
        {(['alignment', 'impact', 'cost', 'risk'] as const).map((key) => (
          <div key={key}>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-300">{scoreLabels[key][language]}</span>
              <span className="text-matrix-accent font-mono">{scores[key]}</span>
            </div>
            <input
              type="range"
              min={1}
              max={10}
              value={scores[key]}
              onChange={(e) => setScores((s) => ({ ...s, [key]: Number(e.target.value) }))}
              className="w-full accent-matrix-accent"
            />
          </div>
        ))}
        <div className="text-sm text-gray-300">
          Total Score:{' '}
          <span className="text-matrix-accent font-mono font-bold">
            {calcTotal(scores.alignment, scores.impact, scores.cost, scores.risk)}
          </span>
        </div>
        <ResizableTextarea
          value={reasoning}
          onChange={(e) => setReasoning(e.target.value)}
          placeholder={language === 'es' ? 'Razonamiento...' : 'Reasoning...'}
          rows={2}
        />
        <div className="flex justify-end gap-2">
          <button
            onClick={() => {
              handleEvaluate();
              onDecide(idea.id, 'rejected');
            }}
            className="px-3 py-1 text-sm text-red-400 border border-red-800/30 rounded hover:bg-red-900/20"
          >
            {language === 'es' ? 'Rechazar' : 'Reject'}
          </button>
          <button
            onClick={() => {
              handleEvaluate();
              onDecide(idea.id, 'approved');
            }}
            className="px-3 py-1 text-sm text-green-400 border border-green-800/30 rounded hover:bg-green-900/20"
          >
            {language === 'es' ? 'Aprobar' : 'Approve'}
          </button>
          <button
            onClick={handleEvaluate}
            className="px-3 py-1 text-sm bg-matrix-accent/10 text-matrix-accent border border-matrix-accent/30 rounded hover:bg-matrix-accent/20"
          >
            {language === 'es' ? 'Guardar' : 'Save'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

/* ─── PromoteModal ─── */

function PromoteModal({
  idea,
  language,
  objectivesList,
  plansList,
  mission,
  onClose,
  onPromoted,
}: {
  idea: Idea;
  language: 'en' | 'es';
  objectivesList: EntityItem[];
  plansList: EntityItem[];
  mission: { id: number; title: string } | undefined;
  onClose: () => void;
  onPromoted: (data: { id: number; type: string; parentId?: number }) => void;
}) {
  const [promoteType, setPromoteType] = useState('task');
  const [promoteParentId, setPromoteParentId] = useState<number | ''>('');

  const promoteParents = (): EntityItem[] => {
    switch (promoteType) {
      case 'task':
        return plansList.map((p) => ({ id: p.id, title: p.title }));
      case 'plan':
        return objectivesList.map((o) => ({ id: o.id, title: o.title }));
      case 'objective':
        return mission ? [{ id: mission.id, title: mission.title }] : [];
      case 'project':
        return [];
      default:
        return [];
    }
  };

  const handlePromote = () => {
    onPromoted({
      id: idea.id,
      type: promoteType,
      parentId: promoteParentId ? Number(promoteParentId) : undefined,
    });
    onClose();
  };

  return (
    <Modal onClose={onClose} title={`${language === 'es' ? 'Promover' : 'Promote'}: ${idea.title}`}>
      <div className="space-y-3">
        <div>
          <label className="text-xs text-matrix-muted block mb-1">
            {language === 'es' ? 'Destino' : 'Destination'}
          </label>
          <Dropdown
            value={promoteType}
            onChange={(val) => {
              setPromoteType(val);
              setPromoteParentId('');
            }}
            options={[
              { value: 'task', label: 'Task' },
              { value: 'plan', label: 'Plan' },
              { value: 'objective', label: 'Objective' },
              { value: 'project', label: 'Project' },
            ]}
          />
        </div>
        {promoteType !== 'project' && (
          <div>
            <label className="text-xs text-matrix-muted block mb-1">{language === 'es' ? 'Padre' : 'Parent'}</label>
            <Dropdown
              value={String(promoteParentId)}
              onChange={(val) => setPromoteParentId(val ? Number(val) : '')}
              options={[
                { value: '', label: '--' },
                ...promoteParents().map((e) => ({
                  value: String(e.id),
                  label: e.title,
                })),
              ]}
            />
          </div>
        )}
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-3 py-1 text-sm text-gray-400 hover:text-gray-300">
            {t('cancel', language)}
          </button>
          <button
            onClick={handlePromote}
            disabled={promoteType !== 'project' && !promoteParentId}
            className="px-3 py-1 text-sm bg-green-900/30 text-green-400 border border-green-800/30 rounded hover:bg-green-900/40 disabled:opacity-40"
          >
            {language === 'es' ? 'Promover' : 'Promote'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

/* ─── IdeasView (main) ─── */

export function IdeasView() {
  const { language, quickCreateModal, closeQuickCreate } = useUiStore();
  const { data: ideas = [], isLoading } = useIdeas();
  const { data: objectivesList = [] } = useObjectives();
  const { data: plansList = [] } = usePlans();
  const { data: missionData } = useMission();
  const { data: projectsList = [] } = useProjects();
  const createIdea = useCreateIdea();
  const deleteIdea = useDeleteIdea();
  const updateIdea = useUpdateIdea();
  const evaluateIdea = useEvaluateIdea();
  const decideIdea = useDecideIdea();
  const promoteIdea = usePromoteIdea();

  const [showCreate, setShowCreate] = useState(false);
  const [editTarget, setEditTarget] = useState<Idea | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [evalIdea, setEvalIdea] = useState<Idea | null>(null);
  const [promoteTarget, setPromoteTarget] = useState<Idea | null>(null);

  useEffect(() => {
    if (quickCreateModal.type === 'idea') {
      setShowCreate(true);
      closeQuickCreate();
    }
  }, [quickCreateModal, closeQuickCreate]);

  const mission = Array.isArray(missionData) ? missionData[0] : missionData;

  const handleDecide = (id: number, decision: 'approved' | 'rejected') => {
    decideIdea.mutate({ id, decision });
  };

  const handleMoveTo = (id: number, status: string) => {
    updateIdea.mutate({ id, status });
  };

  const getTargetLabel = (idea: Idea) => {
    if (!idea.targetType || !idea.targetId) return null;
    const labels: Record<string, string> = { mission: 'Mission', objective: 'Objective', plan: 'Plan', task: 'Task' };
    return labels[idea.targetType] || idea.targetType;
  };

  const getProjectName = (idea: Idea) => {
    if (!idea.projectId) return null;
    const p = projectsList.find((pr: { id: number; name: string }) => pr.id === idea.projectId);
    return p?.name || `Project #${idea.projectId}`;
  };

  if (isLoading) return <div className="p-4 text-matrix-muted">{t('loading', language)}</div>;

  return (
    <div className="p-3 md:p-4 h-full overflow-y-auto flex flex-col">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
        <div className="flex items-center gap-2 min-w-0">
          <h1 className="text-lg font-medium text-gray-200">{t('ideas', language)}</h1>
          <button
            onClick={() => setShowHelp(!showHelp)}
            className="text-matrix-muted hover:text-gray-300 text-xs border border-matrix-border rounded-full w-4 h-4 flex items-center justify-center"
            title={language === 'es' ? 'Centro de ayuda' : 'Help center'}
          >
            ?
          </button>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="w-full sm:w-auto px-3 py-1 text-sm bg-matrix-accent/10 text-matrix-accent border border-matrix-accent/30 rounded hover:bg-matrix-accent/20 transition-colors"
        >
          + {language === 'es' ? 'Nueva idea' : 'New idea'}
        </button>
      </div>

      {/* Kanban */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 min-h-0 overflow-visible xl:overflow-hidden">
        {columns.map((col) => {
          const colIdeas = ideas.filter((i: Idea) => i.status === col.key);
          return (
            <div
              key={col.key}
              className={`flex flex-col min-h-[260px] border-t-2 ${col.color} bg-matrix-bg/50 rounded-md overflow-hidden`}
            >
              <div className="px-3 py-2 flex items-center justify-between text-sm font-medium text-gray-300 border-b border-matrix-border">
                <span>{col.label}</span>
                <span className="text-xs text-matrix-muted bg-matrix-bg px-1.5 py-0.5 rounded">{colIdeas.length}</span>
              </div>
              <div className="flex-1 overflow-y-auto p-2 space-y-2">
                {colIdeas.map((idea: Idea) => (
                  <IdeaCard
                    key={idea.id}
                    idea={idea}
                    language={language}
                    targetLabel={getTargetLabel(idea)}
                    projectName={getProjectName(idea)}
                    onEdit={() => setEditTarget(idea)}
                    onEvaluate={() => setEvalIdea(idea)}
                    onApprove={() => handleDecide(idea.id, 'approved')}
                    onReject={() => handleDecide(idea.id, 'rejected')}
                    onPromote={() => setPromoteTarget(idea)}
                    onMoveTo={(status) => handleMoveTo(idea.id, status)}
                    onDelete={() => deleteIdea.mutate(idea.id)}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Help Center */}
      {showHelp && <HelpPanel language={language} onClose={() => setShowHelp(false)} />}

      {/* Modals */}
      {showCreate && (
        <CreateIdeaModal
          language={language}
          objectivesList={objectivesList}
          plansList={plansList}
          mission={mission}
          projectsList={projectsList}
          onClose={() => setShowCreate(false)}
          onCreated={(data) => createIdea.mutate(data)}
        />
      )}

      {editTarget && (
        <CreateIdeaModal
          language={language}
          objectivesList={objectivesList}
          plansList={plansList}
          mission={mission}
          projectsList={projectsList}
          editIdea={editTarget}
          onClose={() => setEditTarget(null)}
          onCreated={() => {}}
          onUpdated={(data) => updateIdea.mutate(data)}
        />
      )}

      {evalIdea && (
        <EvaluateModal
          idea={evalIdea}
          language={language}
          onClose={() => setEvalIdea(null)}
          onEvaluated={(data) => evaluateIdea.mutate(data)}
          onDecide={handleDecide}
        />
      )}

      {promoteTarget && (
        <PromoteModal
          idea={promoteTarget}
          language={language}
          objectivesList={objectivesList}
          plansList={plansList}
          mission={mission}
          onClose={() => setPromoteTarget(null)}
          onPromoted={(data) => promoteIdea.mutate(data)}
        />
      )}
    </div>
  );
}

/* ─── IdeaCard ─── */

function IdeaCard({
  idea,
  language,
  targetLabel,
  projectName,
  onEdit,
  onEvaluate,
  onApprove,
  onReject,
  onPromote,
  onMoveTo,
  onDelete,
}: {
  idea: Idea;
  language: 'en' | 'es';
  targetLabel: string | null;
  projectName: string | null;
  onEdit: () => void;
  onEvaluate: () => void;
  onApprove: () => void;
  onReject: () => void;
  onPromote: () => void;
  onMoveTo: (status: string) => void;
  onDelete: () => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const shouldFetchEval = idea.status !== 'pending';
  const { data: evaluation } = useIdeaEvaluation(shouldFetchEval ? idea.id : null);

  const evalScores = evaluation
    ? [
        { key: 'alignment' as const, value: evaluation.alignmentScore, color: 'text-blue-400' },
        { key: 'impact' as const, value: evaluation.impactScore, color: 'text-green-400' },
        { key: 'cost' as const, value: evaluation.costScore, color: 'text-orange-400' },
        { key: 'risk' as const, value: evaluation.riskScore, color: 'text-red-400' },
      ]
    : null;

  return (
    <div className="bg-matrix-surface border border-matrix-border rounded-md p-2.5">
      <p className="text-sm text-gray-200 font-medium leading-tight">{idea.title}</p>
      {idea.description && <p className="text-xs text-matrix-muted mt-1 line-clamp-2">{idea.description}</p>}

      {/* Badges */}
      <div className="flex flex-wrap gap-1 mt-1.5">
        {targetLabel && (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-900/30 text-blue-300 border border-blue-800/20">
            {targetLabel}
          </span>
        )}
        {projectName && (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-900/30 text-purple-300 border border-purple-800/20">
            {projectName}
          </span>
        )}
        {idea.promotedToType && (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-900/30 text-green-300 border border-green-800/20">
            &rarr; {idea.promotedToType}
          </span>
        )}
      </div>

      {/* Evaluation info */}
      {evaluation && evalScores && (
        <div className="mt-2 pt-2 border-t border-matrix-border/50">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 mb-1">
            {evalScores.map((s) => (
              <div key={s.key} className="text-center">
                <span className="text-[9px] text-matrix-muted block">
                  <span className="hidden xl:inline">{scoreLabels[s.key][language]}</span>
                  <span className="xl:hidden">{scoreLabels[s.key].abbr}</span>
                </span>
                <span className={`text-[11px] font-mono font-bold ${s.color}`}>{s.value}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-matrix-muted">Score:</span>
            <span className="text-[11px] font-mono font-bold text-matrix-accent">{evaluation.totalScore}</span>
          </div>
          {evaluation.reasoning && (
            <p className="text-[10px] text-matrix-muted mt-1 line-clamp-2 italic">{evaluation.reasoning}</p>
          )}
        </div>
      )}

      {/* Actions — always visible */}
      <div className="flex items-center justify-between mt-2">
        <span className="text-[10px] text-matrix-muted">{new Date(idea.createdAt).toLocaleDateString()}</span>
        <div className="flex gap-1 flex-wrap justify-end">
          {idea.status === 'pending' && (
            <ActionBtn
              onClick={onEvaluate}
              icon="?"
              label={language === 'es' ? 'Evaluar' : 'Evaluate'}
              color="text-yellow-400 hover:text-yellow-300"
            />
          )}
          {idea.status === 'evaluating' && (
            <>
              <ActionBtn
                onClick={() => onMoveTo('pending')}
                icon="&#x2190;"
                label={language === 'es' ? 'Volver a pendiente' : 'Back to pending'}
                color="text-gray-400 hover:text-gray-300"
              />
              <ActionBtn
                onClick={onEvaluate}
                icon="&#x270E;"
                label={language === 'es' ? 'Editar' : 'Edit'}
                color="text-yellow-400 hover:text-yellow-300"
              />
              <ActionBtn
                onClick={onApprove}
                icon="&#x2713;"
                label={language === 'es' ? 'Aprobar' : 'Approve'}
                color="text-green-400 hover:text-green-300"
              />
              <ActionBtn
                onClick={onReject}
                icon="&#x2717;"
                label={language === 'es' ? 'Rechazar' : 'Reject'}
                color="text-red-400 hover:text-red-300"
              />
            </>
          )}
          {idea.status === 'approved' && !idea.promotedToType && (
            <>
              <ActionBtn
                onClick={() => onMoveTo('evaluating')}
                icon="&#x2190;"
                label={language === 'es' ? 'Volver a evaluar' : 'Back to evaluating'}
                color="text-gray-400 hover:text-gray-300"
              />
              <ActionBtn
                onClick={() => onMoveTo('pending')}
                icon="&#x21C7;"
                label={language === 'es' ? 'Volver a pendiente' : 'Back to pending'}
                color="text-gray-400 hover:text-gray-300"
              />
              <ActionBtn
                onClick={onPromote}
                icon="&#x2191;"
                label={language === 'es' ? 'Promover' : 'Promote'}
                color="text-matrix-accent hover:text-matrix-accent/80"
              />
            </>
          )}
          {idea.status === 'rejected' && (
            <>
              <ActionBtn
                onClick={() => onMoveTo('evaluating')}
                icon="&#x2190;"
                label={language === 'es' ? 'Volver a evaluar' : 'Back to evaluating'}
                color="text-gray-400 hover:text-gray-300"
              />
              <ActionBtn
                onClick={() => onMoveTo('pending')}
                icon="&#x21C7;"
                label={language === 'es' ? 'Volver a pendiente' : 'Back to pending'}
                color="text-blue-400 hover:text-blue-300"
              />
            </>
          )}
          <ActionBtn
            onClick={onEdit}
            icon="&#x270E;"
            label={language === 'es' ? 'Editar' : 'Edit'}
            color="text-matrix-muted hover:text-gray-300"
          />
          {confirmDelete ? (
            <span className="flex items-center gap-1">
              <span className="text-[10px] text-red-400">{language === 'es' ? '¿Borrar?' : 'Delete?'}</span>
              <button
                onClick={() => {
                  onDelete();
                  setConfirmDelete(false);
                }}
                className="text-[10px] text-red-400 border border-red-800/30 rounded px-1 py-0.5 hover:bg-red-900/20 transition-colors"
              >
                {language === 'es' ? 'Sí' : 'Yes'}
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="text-[10px] text-gray-400 border border-matrix-border rounded px-1 py-0.5 hover:text-gray-300 transition-colors"
              >
                No
              </button>
            </span>
          ) : (
            <ActionBtn
              onClick={() => setConfirmDelete(true)}
              icon="&#x2715;"
              label={language === 'es' ? 'Borrar' : 'Del'}
              color="text-red-400/60 hover:text-red-400"
            />
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── HelpPanel ─── */

function HelpPanel({ language, onClose }: { language: 'en' | 'es'; onClose: () => void }) {
  const es = language === 'es';
  return (
    <div className="mt-4 shrink-0 border border-matrix-border rounded-md bg-matrix-surface overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b border-matrix-border">
        <span className="text-xs font-medium text-gray-300">
          {es ? 'Centro de ayuda — Ideas Pipeline' : 'Help Center — Ideas Pipeline'}
        </span>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-300 text-sm leading-none">
          &times;
        </button>
      </div>
      <div className="px-4 py-3 text-xs text-gray-400 space-y-3">
        {/* Overview */}
        <div>
          <p className="text-gray-300 font-medium mb-1">{es ? 'Flujo de trabajo' : 'Workflow'}</p>
          <p>
            {es
              ? 'El pipeline de ideas te permite capturar cualquier idea de forma rapida y decidir con criterio si merece convertirse en algo accionable. Cada idea avanza por 4 etapas:'
              : 'The ideas pipeline lets you quickly capture any idea and decide with clear criteria whether it deserves to become actionable. Each idea progresses through 4 stages:'}
          </p>
        </div>

        {/* Stages */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-2">
          <div className="bg-matrix-bg rounded p-2 border-t-2 border-gray-600">
            <p className="text-gray-300 font-medium mb-0.5">Pending</p>
            <p>
              {es
                ? 'Ideas recien capturadas. Aqui vive todo lo que se te ocurra sin compromiso. El objetivo es capturar con friccion minima.'
                : 'Freshly captured ideas. Everything you come up with lives here with no commitment. The goal is to capture with minimal friction.'}
            </p>
          </div>
          <div className="bg-matrix-bg rounded p-2 border-t-2 border-yellow-600">
            <p className="text-gray-300 font-medium mb-0.5">Evaluating</p>
            <p>
              {es
                ? 'Ideas en proceso de evaluacion. Se puntuan con 4 criterios para decidir objetivamente si merecen accion.'
                : 'Ideas being evaluated. They are scored on 4 criteria to objectively decide whether they deserve action.'}
            </p>
          </div>
          <div className="bg-matrix-bg rounded p-2 border-t-2 border-green-600">
            <p className="text-gray-300 font-medium mb-0.5">Approved</p>
            <p>
              {es
                ? 'Ideas aprobadas listas para ser promovidas a una entidad concreta del sistema: tarea, plan, objetivo o proyecto.'
                : 'Approved ideas ready to be promoted to a concrete entity in the system: task, plan, objective, or project.'}
            </p>
          </div>
          <div className="bg-matrix-bg rounded p-2 border-t-2 border-red-600">
            <p className="text-gray-300 font-medium mb-0.5">Rejected</p>
            <p>
              {es
                ? 'Ideas descartadas. Pueden recuperarse en cualquier momento si las circunstancias cambian.'
                : 'Discarded ideas. They can be recovered at any time if circumstances change.'}
            </p>
          </div>
        </div>

        {/* Evaluation */}
        <div>
          <p className="text-gray-300 font-medium mb-1">{es ? 'Sistema de evaluacion' : 'Evaluation system'}</p>
          <p className="mb-1">
            {es
              ? 'Cada idea se evalua con 4 criterios en escala del 1 al 10:'
              : 'Each idea is evaluated with 4 criteria on a scale of 1 to 10:'}
          </p>
          <ul className="space-y-0.5 ml-2">
            <li>
              <span className="text-blue-400">{es ? 'Alineacion' : 'Alignment'}</span> —{' '}
              {es
                ? 'Coherencia con tu mision y objetivos estrategicos.'
                : 'Coherence with your mission and strategic objectives.'}
            </li>
            <li>
              <span className="text-green-400">{es ? 'Impacto' : 'Impact'}</span> —{' '}
              {es ? 'Beneficio potencial que generaria si se ejecuta.' : 'Potential benefit if executed.'}
            </li>
            <li>
              <span className="text-orange-400">{es ? 'Coste' : 'Cost'}</span> —{' '}
              {es
                ? 'Esfuerzo, tiempo o recursos necesarios (menor = mejor).'
                : 'Effort, time, or resources needed (lower = better).'}
            </li>
            <li>
              <span className="text-red-400">{es ? 'Riesgo' : 'Risk'}</span> —{' '}
              {es
                ? 'Probabilidad de fallar o generar problemas (menor = mejor).'
                : 'Likelihood of failure or causing problems (lower = better).'}
            </li>
          </ul>
          <p className="mt-1 text-matrix-muted">
            {es ? 'Formula: ' : 'Formula: '}
            <span className="font-mono text-gray-400">
              Score = ALI x 0.4 + IMP x 0.3 + (10 - CST) x 0.15 + (10 - RSK) x 0.15
            </span>
          </p>
        </div>

        {/* Promotion */}
        <div>
          <p className="text-gray-300 font-medium mb-1">{es ? 'Promocion' : 'Promotion'}</p>
          <p>
            {es
              ? 'Cuando una idea se aprueba, puedes promoverla a una entidad real del sistema. La idea queda vinculada al elemento creado para mantener trazabilidad completa:'
              : 'When an idea is approved, you can promote it to a real entity in the system. The idea remains linked to the created element for full traceability:'}
          </p>
          <ul className="space-y-0.5 ml-2 mt-1">
            <li>
              <span className="text-gray-300">Task</span> —{' '}
              {es ? 'Se crea dentro de un plan existente.' : 'Created inside an existing plan.'}
            </li>
            <li>
              <span className="text-gray-300">Plan</span> —{' '}
              {es ? 'Se crea dentro de un objetivo existente.' : 'Created inside an existing objective.'}
            </li>
            <li>
              <span className="text-gray-300">Objective</span> —{' '}
              {es ? 'Se crea dentro de la mision activa.' : 'Created inside the active mission.'}
            </li>
            <li>
              <span className="text-gray-300">Project</span> —{' '}
              {es ? 'Se crea como proyecto independiente.' : 'Created as a standalone project.'}
            </li>
          </ul>
        </div>

        {/* Icons legend */}
        <div>
          <p className="text-gray-300 font-medium mb-1">{es ? 'Iconos de accion' : 'Action icons'}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-0.5 ml-2">
            <span>
              <span className="text-yellow-400">?</span> — {es ? 'Evaluar idea' : 'Evaluate idea'}
            </span>
            <span>
              <span className="text-yellow-400">&#x270E;</span> — {es ? 'Editar evaluacion' : 'Edit evaluation'}
            </span>
            <span>
              <span className="text-green-400">&#x2713;</span> — {es ? 'Aprobar' : 'Approve'}
            </span>
            <span>
              <span className="text-red-400">&#x2717;</span> — {es ? 'Rechazar' : 'Reject'}
            </span>
            <span>
              <span className="text-matrix-accent">&#x2191;</span> — {es ? 'Promover' : 'Promote'}
            </span>
            <span>
              <span className="text-red-400">&#x2715;</span> — {es ? 'Eliminar' : 'Delete'}
            </span>
            <span>
              <span className="text-gray-400">&#x2190;</span> — {es ? 'Volver un paso' : 'Go back one step'}
            </span>
            <span>
              <span className="text-blue-400">&#x21C7;</span> — {es ? 'Volver a pendiente' : 'Back to pending'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── ActionBtn ─── */

function ActionBtn({
  onClick,
  icon,
  label,
  color,
}: {
  onClick: () => void;
  icon: string;
  label: string;
  color: string;
}) {
  return (
    <button onClick={onClick} className={`text-sm ${color}`} title={label} dangerouslySetInnerHTML={{ __html: icon }} />
  );
}
