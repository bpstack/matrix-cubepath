import React, { useState } from 'react';
import {
  useProject,
  useScanProject,
  useSyncProjectGitHub,
  useUpdateProject,
  useDeleteProject,
} from '../../hooks/useProjects';
import { useUiStore } from '../../stores/ui.store';
import { t } from '../../lib/i18n';
import { ResizableTextarea } from '../ui/ResizableTextarea';
import { useDialogStore } from '../../stores/dialog.store';

interface Props {
  projectId: number;
  onBack: () => void;
}

export function ProjectDetail({ projectId, onBack }: Props) {
  const { language } = useUiStore();
  const { data: project, isLoading } = useProject(projectId);
  const scanProject = useScanProject();
  const syncGitHub = useSyncProjectGitHub();
  const updateProject = useUpdateProject();
  const deleteProject = useDeleteProject();

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editUrl, setEditUrl] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const { confirm } = useDialogStore();

  if (isLoading || !project) return <div className="p-3 md:p-6 text-matrix-muted">{t('loading', language)}</div>;

  const ts = project.techStats;
  const scan = project.scan;
  const scanData = scan?.rawData ? JSON.parse(scan.rawData) : null;

  const statusColors: Record<string, string> = {
    active: 'bg-matrix-success/20 text-matrix-success',
    paused: 'bg-matrix-warning/20 text-matrix-warning',
    completed: 'bg-blue-400/20 text-blue-400',
    archived: 'bg-gray-500/20 text-gray-400',
  };

  const cycleStatus = () => {
    const order = ['active', 'paused', 'completed', 'archived'];
    const next = order[(order.indexOf(project.status) + 1) % order.length];
    updateProject.mutate({ id: project.id, status: next });
  };

  const startEdit = () => {
    setEditName(project.name);
    setEditUrl(project.url || '');
    setEditDescription(project.description || '');
    setIsEditing(true);
  };

  const saveEdit = () => {
    updateProject.mutate(
      {
        id: project.id,
        name: editName.trim() || undefined,
        url: editUrl.trim() || undefined,
        description: editDescription.trim() || undefined,
      },
      {
        onSuccess: () => setIsEditing(false),
      },
    );
  };

  const handleDelete = async () => {
    const ok = await confirm({
      title: t('deleteProjectConfirm', language) || 'Delete this project?',
      danger: true,
    });
    if (ok) deleteProject.mutate(project.id, { onSuccess: onBack });
  };

  return (
    <div className="p-3 md:p-6">
      {/* Header */}
      <button onClick={onBack} className="text-sm text-matrix-muted hover:text-gray-300 mb-4 transition-colors">
        ← {t('projects', language)}
      </button>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between mb-6">
        {isEditing ? (
          <div className="flex-1 space-y-3 lg:mr-4 min-w-0">
            <input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder={t('projectName', language)}
              className="w-full px-3 py-2 bg-matrix-bg border border-matrix-border rounded text-lg font-semibold text-gray-200 placeholder-matrix-muted focus:border-matrix-accent focus:outline-none"
            />
            <input
              value={editUrl}
              onChange={(e) => setEditUrl(e.target.value)}
              placeholder="URL (GitHub, GitLab...)"
              className="w-full px-3 py-2 bg-matrix-bg border border-matrix-border rounded text-sm text-gray-200 placeholder-matrix-muted focus:border-matrix-accent focus:outline-none"
            />
            <ResizableTextarea
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              placeholder={t('taskDescription', language)}
              rows={2}
            />
            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                onClick={saveEdit}
                className="px-3 py-1.5 text-sm bg-matrix-accent text-black rounded hover:bg-matrix-accent-hover transition-colors font-medium"
              >
                {t('save', language)}
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="px-3 py-1.5 text-sm text-matrix-muted hover:text-gray-300 transition-colors"
              >
                {t('cancel', language)}
              </button>
            </div>
          </div>
        ) : (
          <div className="min-w-0">
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-xl font-semibold text-gray-200">{project.name}</h1>
              <button
                onClick={cycleStatus}
                className={`px-2 py-0.5 text-xs rounded-full ${statusColors[project.status] || ''}`}
              >
                {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
              </button>
            </div>
            {project.description && <p className="text-sm text-matrix-muted">{project.description}</p>}
            {project.url && (
              <a
                href={project.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-400 hover:underline mt-1 inline-block"
              >
                {project.url}
              </a>
            )}
          </div>
        )}
        <div className="flex flex-wrap gap-2 shrink-0">
          {!isEditing && (
            <>
              <button
                onClick={startEdit}
                className="px-3 py-1.5 text-sm bg-matrix-surface border border-matrix-border text-gray-300 rounded hover:bg-matrix-bg transition-colors"
              >
                ✎ {t('edit', language)}
              </button>
              <button
                onClick={handleDelete}
                className="px-3 py-1.5 text-sm text-matrix-danger hover:bg-matrix-danger/10 rounded transition-colors"
              >
                ✕
              </button>
            </>
          )}
          {project.path && !isEditing && (
            <button
              onClick={() => scanProject.mutate(project.id)}
              className="px-3 py-1.5 text-sm bg-matrix-accent/20 text-matrix-accent rounded hover:bg-matrix-accent/30 transition-colors"
            >
              ⟳ Scan
            </button>
          )}
          {project.url && !isEditing && (
            <button
              onClick={() => syncGitHub.mutate(project.id)}
              className="px-3 py-1.5 text-sm bg-matrix-accent/20 text-matrix-accent rounded hover:bg-matrix-accent/30 transition-colors"
            >
              ⟳ {t('githubSync', language)}
            </button>
          )}
        </div>
      </div>

      {/* Info cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {project.path && (
          <div>
            <InfoCard label={t('directory', language)} value={project.resolvedPath || project.path} small />
          </div>
        )}
        {ts && (
          <>
            <InfoCard label={t('linesOfCode', language)} value={formatLines(ts.totalLines)} />
            <InfoCard label={t('deps', language)} value={String(ts.dependencies)} />
            <InfoCard
              label="Tests"
              value={ts.hasTests ? '✓' : '✕'}
              color={ts.hasTests ? 'text-matrix-success' : 'text-matrix-danger'}
            />
            <InfoCard
              label="CI/CD"
              value={ts.hasCiCd ? '✓' : '✕'}
              color={ts.hasCiCd ? 'text-matrix-success' : 'text-matrix-danger'}
            />
          </>
        )}
      </div>

      {/* Progress bar */}
      {scan && scan.totalTasks > 0 && (
        <div className="mb-6 p-4 bg-matrix-surface rounded-lg border border-matrix-border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-300">{t('progress', language)}</span>
            <span className="text-sm font-mono text-matrix-accent">{scan.progressPercent}%</span>
          </div>
          <div className="h-2 bg-matrix-bg rounded-full overflow-hidden mb-3">
            <div
              className="h-full bg-matrix-accent rounded-full transition-all"
              style={{ width: `${scan.progressPercent}%` }}
            />
          </div>
          <div className="flex gap-4 text-xs text-matrix-muted">
            <span>
              ☑ {scan.completedTasks}/{scan.totalTasks} tasks
            </span>
            {scan.blockers > 0 && <span className="text-matrix-danger">⚠ {scan.blockers} blockers</span>}
            {scan.wipItems > 0 && <span className="text-matrix-warning">◉ {scan.wipItems} WIP</span>}
          </div>
        </div>
      )}

      {/* Languages */}
      {ts && ts.languages.length > 0 && (
        <div className="mb-6 p-4 bg-matrix-surface rounded-lg border border-matrix-border">
          <h3 className="text-sm font-medium text-gray-300 mb-3">{t('languages', language)}</h3>
          {/* Language bar */}
          <div className="h-2 rounded-full overflow-hidden flex mb-3">
            {ts.languages.map((lang) => (
              <div
                key={lang.name}
                className="h-full"
                style={{ backgroundColor: lang.color, width: `${lang.percent}%` }}
                title={`${lang.name} ${lang.percent}%`}
              />
            ))}
          </div>
          <div className="flex flex-wrap gap-3">
            {ts.languages.map((lang) => (
              <span key={lang.name} className="flex items-center gap-1.5 text-xs text-matrix-muted">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: lang.color }} />
                {lang.name} <span className="text-gray-500">{lang.percent}%</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Scan breakdown + Git info side by side */}
      {(scanData?.roadmap || ts?.lastCommit) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          {/* Scan breakdown */}
          {scanData?.roadmap && (
            <div className="p-4 bg-matrix-surface rounded-lg border border-matrix-border">
              <h3 className="text-sm font-medium text-gray-300 mb-3">{t('scanBreakdown', language)}</h3>
              <div className="space-y-2 text-xs">
                {/* Roadmap */}
                <div className="flex items-center justify-between bg-matrix-bg/50 rounded px-3 py-2">
                  <span className="text-gray-300 font-mono">ROADMAP</span>
                  <div className="flex items-center gap-2">
                    {scanData.roadmap?.exists ? (
                      <>
                        <span className="text-matrix-accent font-mono">
                          {scanData.roadmap.completedPhases || 0}/{scanData.roadmap.totalPhases || 0}
                        </span>
                        <span className="text-gray-500 text-[10px]">{scanData.roadmap.lineCount || 0} lines</span>
                        {scanData.roadmap.totalPhases > 0 && (
                          <span className="text-gray-500 text-[10px]">
                            (
                            {Math.round(((scanData.roadmap.completedPhases || 0) / scanData.roadmap.totalPhases) * 100)}
                            %)
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="text-matrix-danger">✕</span>
                    )}
                  </div>
                </div>

                {/* TODO */}
                <div className="flex items-center justify-between bg-matrix-bg/50 rounded px-3 py-2">
                  <span className="text-gray-300 font-mono">TODO</span>
                  <div className="flex items-center gap-2">
                    {scanData.todo?.exists ? (
                      scanData.todo.hasContent ? (
                        <span className="text-matrix-warning text-[10px]">{t('todoHasContent', language)}</span>
                      ) : (
                        <span className="text-matrix-success">✓</span>
                      )
                    ) : (
                      <span className="text-matrix-danger">✕</span>
                    )}
                  </div>
                </div>

                {/* README */}
                <div className="flex items-center justify-between bg-matrix-bg/50 rounded px-3 py-2">
                  <span className="text-gray-300 font-mono">README</span>
                  <div className="flex items-center gap-2">
                    {scanData.readme?.exists ? (
                      <span className="text-matrix-success">✓</span>
                    ) : (
                      <span className="text-matrix-danger">✕</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Git info */}
          {ts?.lastCommit && (
            <div className="p-4 bg-matrix-surface rounded-lg border border-matrix-border">
              <h3 className="text-sm font-medium text-gray-300 mb-3">Git</h3>
              <div className="space-y-2 text-xs text-matrix-muted">
                {ts.gitBranch && (
                  <div className="flex items-center gap-2">
                    <span>⎇</span>
                    <span className="text-gray-300">{ts.gitBranch}</span>
                    {ts.gitDirty && <span className="text-matrix-warning">(uncommitted)</span>}
                  </div>
                )}
                <div>
                  <span className="text-gray-500">Last commit:</span>
                  <span className="text-gray-300 ml-1">{ts.lastCommit.message}</span>
                </div>
                <div className="text-gray-500">{new Date(ts.lastCommit.date).toLocaleDateString()}</div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Linked entities */}
      {project.links && project.links.length > 0 && (
        <div className="mt-6 p-4 bg-matrix-surface rounded-lg border border-matrix-border">
          <h3 className="text-sm font-medium text-gray-300 mb-3">{t('linkedEntities', language)}</h3>
          <div className="space-y-1.5">
            {project.links.map((link: { id: number; linkableType: string; linkableId: number }) => {
              const icons: Record<string, string> = { mission: '◈', objective: '◎', plan: '◻', task: '☰' };
              return (
                <div key={link.id} className="flex items-center justify-between text-xs">
                  <span className="text-gray-300">
                    <span className="mr-1.5">{icons[link.linkableType] || '•'}</span>
                    {link.linkableType} #{link.linkableId}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tags */}
      {project.tags.length > 0 && (
        <div className="mt-4 flex gap-2 flex-wrap">
          {project.tags.map((tag) => (
            <span key={tag} className="px-2 py-0.5 text-xs bg-blue-400/10 text-blue-400 rounded-full">
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Help / How it works - Separator */}
      <div className="mt-8 mb-2 flex items-center gap-4">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-matrix-border to-transparent" />
        <div className="flex items-center gap-2 px-3 py-1 bg-matrix-surface/50 rounded-full border border-matrix-border/50">
          <svg
            className="w-3.5 h-3.5 text-matrix-accent"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"
            />
          </svg>
          <span className="text-xs font-medium text-gray-400 whitespace-nowrap">
            {language === 'es' ? 'Guía del análisis' : 'Scan Guide'}
          </span>
        </div>
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-matrix-border to-transparent" />
      </div>

      <div className="p-5 bg-matrix-surface rounded-lg border border-matrix-border shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
          {/* Column 1: Documentación */}
          <div className="space-y-3">
            <div className="flex items-start gap-2.5">
              <div className="w-5 h-5 rounded bg-matrix-accent/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-matrix-accent text-[10px] font-bold">R</span>
              </div>
              <div>
                <span className="text-gray-300 font-medium">ROADMAP</span>
                <p className="text-matrix-muted mt-0.5 leading-relaxed">
                  {language === 'es'
                    ? 'Cuenta encabezados ## como fases/etapas del proyecto. Las fases se consideran completadas cuando tienen ✅ al final o están marcadas como [x]. El número de líneas indica el nivel de detalle.'
                    : 'Counts ## headers as project phases/stages. Phases are marked complete with ✅ at the end or [x] checkboxes. Line count indicates detail level.'}
                </p>
                <div className="mt-1.5 flex flex-wrap gap-2">
                  <code className="px-1.5 py-0.5 bg-matrix-bg rounded text-[10px] text-gray-500">
                    ## Phase 1: Setup ✅
                  </code>
                  <code className="px-1.5 py-0.5 bg-matrix-bg rounded text-[10px] text-gray-500">- [x] Task done</code>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <div className="w-5 h-5 rounded bg-matrix-warning/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-matrix-warning text-[10px] font-bold">T</span>
              </div>
              <div>
                <span className="text-gray-300 font-medium">TODO</span>
                <p className="text-matrix-muted mt-0.5 leading-relaxed">
                  {language === 'es'
                    ? 'Verifica si existe un archivo de pendientes. Muestra el estado actual del proyecto en cuanto a tareas pendientes.'
                    : 'Checks for a pending tasks file. Shows current project status regarding remaining work.'}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <div className="w-5 h-5 rounded bg-matrix-success/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-matrix-success text-[10px] font-bold">D</span>
              </div>
              <div>
                <span className="text-gray-300 font-medium">README</span>
                <p className="text-matrix-muted mt-0.5 leading-relaxed">
                  {language === 'es'
                    ? 'Verifica la existencia de documentación básica del proyecto. Un proyecto profesional siempre debería tener uno.'
                    : 'Checks for basic project documentation. Every professional project should have one.'}
                </p>
              </div>
            </div>
          </div>

          {/* Column 2: Técnología */}
          <div className="space-y-3">
            <div className="flex items-start gap-2.5">
              <div className="w-5 h-5 rounded bg-blue-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-blue-400 text-[10px] font-bold">🧪</span>
              </div>
              <div>
                <span className="text-gray-300 font-medium">{language === 'es' ? 'Tests' : 'Tests'}</span>
                <p className="text-matrix-muted mt-0.5 leading-relaxed">
                  {language === 'es'
                    ? 'Detecta la presencia de tests buscando carpetas estándar (test, tests, __tests__, spec, cypress, playwright) y archivos de configuración de frameworks de testing.'
                    : 'Detects tests by looking for standard folders (test, tests, __tests__, spec, cypress, playwright) and testing framework config files.'}
                </p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  <code className="px-1.5 py-0.5 bg-matrix-bg rounded text-[10px] text-gray-500">/tests</code>
                  <code className="px-1.5 py-0.5 bg-matrix-bg rounded text-[10px] text-gray-500">/src/__tests__</code>
                  <code className="px-1.5 py-0.5 bg-matrix-bg rounded text-[10px] text-gray-500">vitest.config.ts</code>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <div className="w-5 h-5 rounded bg-purple-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-purple-400 text-[10px] font-bold">📦</span>
              </div>
              <div>
                <span className="text-gray-300 font-medium">{language === 'es' ? 'Dependencias' : 'Dependencies'}</span>
                <p className="text-matrix-muted mt-0.5 leading-relaxed">
                  {language === 'es'
                    ? 'Cuenta el total de dependencias del proyectoextrayéndolas del archivo de configuración del gestor de paquetes correspondiente.'
                    : 'Counts total project dependencies by extracting them from the corresponding package manager config file.'}
                </p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  <code className="px-1.5 py-0.5 bg-matrix-bg rounded text-[10px] text-gray-500">package.json</code>
                  <code className="px-1.5 py-0.5 bg-matrix-bg rounded text-[10px] text-gray-500">requirements.txt</code>
                  <code className="px-1.5 py-0.5 bg-matrix-bg rounded text-[10px] text-gray-500">Cargo.toml</code>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <div className="w-5 h-5 rounded bg-amber-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-amber-400 text-[10px] font-bold">⚙</span>
              </div>
              <div>
                <span className="text-gray-300 font-medium">CI/CD</span>
                <p className="text-matrix-muted mt-0.5 leading-relaxed">
                  {language === 'es'
                    ? 'Detecta pipelines de integración continua configurados buscando archivos de configuración en rutas estándar.'
                    : 'Detects continuous integration pipelines by looking for config files in standard paths.'}
                </p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  <code className="px-1.5 py-0.5 bg-matrix-bg rounded text-[10px] text-gray-500">
                    .github/workflows
                  </code>
                  <code className="px-1.5 py-0.5 bg-matrix-bg rounded text-[10px] text-gray-500">.gitlab-ci.yml</code>
                  <code className="px-1.5 py-0.5 bg-matrix-bg rounded text-[10px] text-gray-500">Jenkinsfile</code>
                  <code className="px-1.5 py-0.5 bg-matrix-bg rounded text-[10px] text-gray-500">.travis.yml</code>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoCard({ label, value, small, color }: { label: string; value: string; small?: boolean; color?: string }) {
  return (
    <div className="p-3 bg-matrix-surface rounded-lg border border-matrix-border">
      <p className="text-xs text-matrix-muted mb-1">{label}</p>
      <p className={`${small ? 'text-xs font-mono truncate' : 'text-lg font-semibold'} ${color || 'text-gray-200'}`}>
        {value}
      </p>
    </div>
  );
}

function formatLines(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}
