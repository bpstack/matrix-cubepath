import React, { useState } from 'react';
import {
  useProjects,
  useCreateProject,
  useDeleteProject,
  useScanProject,
  useSyncProjectGitHub,
  Project,
} from '../../hooks/useProjects';
import { useUiStore } from '../../stores/ui.store';
import { t } from '../../lib/i18n';
import { ResizableTextarea } from '../ui/ResizableTextarea';
import { ProjectDetail } from './ProjectDetail';
import { useDialogStore } from '../../stores/dialog.store';

export function ProjectsView() {
  const { language } = useUiStore();
  const { data: projects, isLoading } = useProjects();
  const createProject = useCreateProject();
  const deleteProject = useDeleteProject();
  const scanProject = useScanProject();
  const syncGitHub = useSyncProjectGitHub();

  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [repo, setRepo] = useState('');
  const [description, setDescription] = useState('');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const { confirm } = useDialogStore();

  if (isLoading) return <div className="p-3 md:p-6 text-matrix-muted">{t('loading', language)}</div>;

  if (selectedId) {
    return <ProjectDetail projectId={selectedId} onBack={() => setSelectedId(null)} />;
  }

  const handleCreate = () => {
    if (!name.trim()) return;
    if (!repo.trim()) return;
    createProject.mutate(
      {
        name: name.trim(),
        url: repo.trim(),
        description: description.trim() || undefined,
      },
      {
        onSuccess: () => {
          setName('');
          setRepo('');
          setDescription('');
          setShowForm(false);
        },
      },
    );
  };

  return (
    <div className="p-3 md:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
        <h1 className="text-xl font-semibold text-gray-200">{t('projects', language)}</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="w-full sm:w-auto px-3 py-1.5 text-sm bg-matrix-accent/20 text-matrix-accent rounded hover:bg-matrix-accent/30 transition-colors"
        >
          + {t('newProject', language)}
        </button>
      </div>

      {showForm && (
        <div className="mb-6 p-4 bg-matrix-surface rounded-lg border border-matrix-border space-y-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('projectName', language)}
            className="w-full px-3 py-2 bg-matrix-bg border border-matrix-border rounded text-sm text-gray-200 placeholder-matrix-muted focus:border-matrix-accent focus:outline-none"
          />
          <input
            value={repo}
            onChange={(e) => setRepo(e.target.value)}
            placeholder={t('projectRepo', language)}
            className="w-full px-3 py-2 bg-matrix-bg border border-matrix-border rounded text-sm text-gray-200 placeholder-matrix-muted focus:border-matrix-accent focus:outline-none"
          />
          <ResizableTextarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t('taskDescription', language)}
            rows={2}
          />
          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              onClick={handleCreate}
              className="px-3 py-1.5 text-sm bg-matrix-accent pilled-active rounded hover:bg-matrix-accent-hover transition-colors font-medium"
            >
              {t('create', language)}
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="px-3 py-1.5 text-sm text-matrix-muted hover:text-gray-300 transition-colors"
            >
              {t('cancel', language)}
            </button>
          </div>
        </div>
      )}

      {!projects?.length ? (
        <div className="text-center text-matrix-muted py-12">
          <p className="text-lg mb-2">{t('noProjects', language)}</p>
        </div>
      ) : (
        <div
          className="grid gap-4 items-start"
          style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}
        >
          {projects.map((p) => (
            <ProjectCard
              key={p.id}
              project={p}
              onClick={() => setSelectedId(p.id)}
              onScan={() => (p.url ? syncGitHub.mutate(p.id) : scanProject.mutate(p.id))}
              onDelete={async () => {
                const ok = await confirm({ title: 'Delete project?', danger: true });
                if (ok) deleteProject.mutate(p.id);
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ProjectCard({
  project: p,
  onClick,
  onScan,
  onDelete,
}: {
  project: Project;
  onClick: () => void;
  onScan: () => void;
  onDelete: () => void;
}) {
  const statusColors: Record<string, string> = {
    active: 'text-matrix-success',
    paused: 'text-matrix-warning',
    completed: 'text-blue-400',
    archived: 'text-matrix-muted',
  };

  return (
    <div
      className="p-4 bg-matrix-surface rounded-lg border border-matrix-border hover:border-matrix-accent/30 transition-colors cursor-pointer group flex flex-col min-h-[220px]"
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-sm shrink-0">◫</span>
          <h3 className="text-sm font-semibold text-blue-400 truncate">{p.name}</h3>
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          {(p.path || p.url) && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onScan();
              }}
              className="px-1.5 py-0.5 text-xs bg-matrix-accent/15 text-matrix-accent rounded hover:bg-matrix-accent/25 transition-colors"
            >
              ⟳
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="px-1.5 py-0.5 text-xs text-matrix-danger hover:bg-matrix-danger/10 rounded transition-colors"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Status */}
      <span className={`text-xs mb-2 ${statusColors[p.status] || 'text-matrix-muted'}`}>
        ● {p.status.charAt(0).toUpperCase() + p.status.slice(1)}
      </span>

      {/* Description */}
      {p.description && <p className="text-xs text-matrix-muted mb-2 line-clamp-2">{p.description}</p>}

      {/* Progress bar */}
      {p.scan && p.scan.totalTasks > 0 && (
        <div className="mb-2">
          <div className="flex justify-between text-xs text-matrix-muted mb-1">
            <span>
              ☑ {p.scan.completedTasks}/{p.scan.totalTasks}
            </span>
            <span>{p.scan.progressPercent}%</span>
          </div>
          <div className="h-1.5 bg-matrix-bg rounded-full overflow-hidden">
            <div
              className="h-full bg-matrix-accent rounded-full transition-all"
              style={{ width: `${p.scan.progressPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* Languages */}
      {p.techStats?.languages && p.techStats.languages.length > 0 && (
        <div className="mb-3">
          <div className="h-1.5 rounded-full overflow-hidden flex mb-2">
            {p.techStats.languages.slice(0, 5).map((lang) => (
              <div
                key={lang.name}
                className="h-full"
                style={{ backgroundColor: lang.color, width: `${lang.percent}%` }}
              />
            ))}
          </div>
          <div className="flex flex-wrap gap-x-3 gap-y-1">
            {p.techStats.languages.slice(0, 4).map((lang) => (
              <span key={lang.name} className="flex items-center gap-1 text-xs text-matrix-muted">
                <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: lang.color }} />
                {lang.name} <span className="text-gray-500">{lang.percent}%</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="flex flex-wrap gap-x-3 gap-y-1 mt-auto pt-2 border-t border-matrix-border/50">
        {p.techStats && p.techStats.totalLines > 0 && (
          <span className="text-xs text-matrix-muted">📄 {formatLines(p.techStats.totalLines)}</span>
        )}
        {p.techStats && p.techStats.dependencies > 0 && (
          <span className="text-xs text-matrix-muted">📦 {p.techStats.dependencies}</span>
        )}
        {p.techStats?.hasTests && <span className="text-xs text-matrix-success">✓ tests</span>}
        {p.techStats?.hasCiCd && <span className="text-xs text-matrix-success">✓ CI/CD</span>}
        {p.scan && (
          <span className="text-xs text-matrix-muted">
            ☑ {p.scan.completedTasks}/{p.scan.totalTasks} ({p.scan.progressPercent}%)
          </span>
        )}
        {p.techStats?.gitBranch && (
          <span className="text-xs text-matrix-muted">
            ⎇ {p.techStats.gitBranch}
            {p.techStats.gitDirty ? ' *' : ''}
          </span>
        )}
      </div>
    </div>
  );
}

function formatLines(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}
