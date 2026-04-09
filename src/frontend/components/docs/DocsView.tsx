import React from 'react';
import { useDocsTree } from '../../hooks/useDocs';
import { DocTree } from './DocTree';
import { DocEditor } from './DocEditor';
import { t } from '../../lib/i18n';
import { useUiStore } from '../../stores/ui.store';

export function DocsView() {
  const { language, docsSelectedFileId, setDocsSelectedFileId } = useUiStore();
  const { data, isLoading } = useDocsTree();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full text-matrix-muted text-sm">{t('loading', language)}</div>
    );
  }

  return (
    <div className="flex h-full overflow-hidden">
      {/* Left panel: file tree */}
      <div className="w-60 shrink-0 border-r border-matrix-border bg-matrix-surface flex flex-col overflow-hidden">
        {data && (
          <DocTree
            folders={data.folders}
            files={data.files}
            selectedFileId={docsSelectedFileId}
            onSelectFile={setDocsSelectedFileId}
          />
        )}
      </div>

      {/* Right panel: editor */}
      <div className="flex-1 flex flex-col overflow-hidden bg-matrix-bg">
        {docsSelectedFileId !== null ? (
          <DocEditor fileId={docsSelectedFileId} />
        ) : (
          <div className="flex items-center justify-center h-full text-matrix-muted text-sm">
            {t('noFileSelected', language)}
          </div>
        )}
      </div>
    </div>
  );
}
