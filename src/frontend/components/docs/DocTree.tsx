import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  DocFolder,
  DocFile,
  useCreateFolder,
  useRenameFolder,
  useDeleteFolder,
  useCreateFile,
  useUpdateFile,
  useDeleteFile,
  useSearchDocs,
  useUpdateFolderSort,
} from '../../hooks/useDocs';
import { t } from '../../lib/i18n';
import { useUiStore } from '../../stores/ui.store';
import { DeleteConfirmButton } from '../overview/primitives';

const ROOT_FOLDER_ID = 1;

interface FolderNode extends DocFolder {
  children: FolderNode[];
  files: DocFile[];
}

function buildTree(folders: DocFolder[], files: DocFile[]): FolderNode | null {
  const nodeMap = new Map<number, FolderNode>();
  for (const f of folders) {
    nodeMap.set(f.id, { ...f, children: [], files: [] });
  }
  let root: FolderNode | null = null;
  for (const node of nodeMap.values()) {
    if (node.id === ROOT_FOLDER_ID) {
      root = node;
    } else if (node.parentId !== null) {
      const parent = nodeMap.get(node.parentId);
      if (parent) parent.children.push(node);
    }
  }
  for (const file of files) {
    const parent = nodeMap.get(file.folderId);
    if (parent) parent.files.push(file);
  }
  return root;
}

function RenameInput({
  initialValue,
  onCommit,
  onCancel,
}: {
  initialValue: string;
  onCommit: (name: string) => void;
  onCancel: () => void;
}) {
  const [value, setValue] = useState(initialValue);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.select();
  }, []);

  return (
    <input
      ref={inputRef}
      className="flex-1 bg-matrix-bg border border-matrix-accent/50 rounded px-1 text-sm text-gray-200 focus:outline-none min-w-0"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={() => (value.trim() ? onCommit(value.trim()) : onCancel())}
      onKeyDown={(e) => {
        if (e.key === 'Enter') value.trim() ? onCommit(value.trim()) : onCancel();
        if (e.key === 'Escape') onCancel();
        e.stopPropagation();
      }}
      onClick={(e) => e.stopPropagation()}
    />
  );
}

function FolderItem({
  node,
  selectedFileId,
  onSelectFile,
  onRequestDelete,
  depth,
  canMoveUp,
  canMoveDown,
  onMoveUp,
  onMoveDown,
}: {
  node: FolderNode;
  selectedFileId: number | null;
  onSelectFile: (id: number | null) => void;
  onRequestDelete: (type: 'folder' | 'file', id: number) => void;
  depth: number;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
}) {
  const { language } = useUiStore();
  const [expanded, setExpanded] = useState(depth === 0);
  const [renamingFolder, setRenamingFolder] = useState(false);
  const [renamingFileId, setRenamingFileId] = useState<number | null>(null);

  const renameFolder = useRenameFolder();
  const createFolder = useCreateFolder();
  const createFile = useCreateFile();
  const renameFile = useUpdateFile();
  const updateFolderSort = useUpdateFolderSort();
  const updateFileSort = useUpdateFile();

  const indent = depth * 12;
  const isRoot = node.id === ROOT_FOLDER_ID;

  const sortedChildren = useMemo(
    () => node.children.slice().sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.id - b.id),
    [node.children],
  );
  const sortedFiles = useMemo(
    () => node.files.slice().sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.id - b.id),
    [node.files],
  );

  function swapFolderOrder(siblings: FolderNode[], idxA: number, idxB: number) {
    const orders = siblings.map((_, i) => i);
    [orders[idxA], orders[idxB]] = [orders[idxB], orders[idxA]];
    updateFolderSort.mutate({ id: siblings[idxA].id, sortOrder: orders[idxA] });
    updateFolderSort.mutate({ id: siblings[idxB].id, sortOrder: orders[idxB] });
  }

  function swapFileOrder(siblings: DocFile[], idxA: number, idxB: number) {
    const orders = siblings.map((_, i) => i);
    [orders[idxA], orders[idxB]] = [orders[idxB], orders[idxA]];
    updateFileSort.mutate({ id: siblings[idxA].id, sortOrder: orders[idxA] });
    updateFileSort.mutate({ id: siblings[idxB].id, sortOrder: orders[idxB] });
  }

  return (
    <div>
      {/* Folder row */}
      <div
        className="group flex items-center gap-1 py-0.5 pr-2 hover:bg-matrix-accent/5 cursor-pointer select-none"
        style={{ paddingLeft: `${indent + 8}px` }}
        onClick={() => setExpanded((v) => !v)}
      >
        <span className="text-matrix-muted text-xs w-3 shrink-0">{expanded ? '▾' : '▸'}</span>
        <span className="text-xs mr-1 text-matrix-muted shrink-0">📁</span>

        {renamingFolder ? (
          <RenameInput
            initialValue={node.name}
            onCommit={(name) => {
              renameFolder.mutate({ id: node.id, name });
              setRenamingFolder(false);
            }}
            onCancel={() => setRenamingFolder(false)}
          />
        ) : (
          <span
            className="flex-1 text-sm text-gray-300 truncate"
            onDoubleClick={(e) => {
              e.stopPropagation();
              if (!isRoot) setRenamingFolder(true);
            }}
          >
            {node.name}
          </span>
        )}

        <span className="hidden group-hover:flex items-center gap-0.5 ml-auto shrink-0">
          {canMoveUp && (
            <button
              title="Move up"
              className="text-matrix-muted hover:text-matrix-accent text-xs px-0.5 py-0.5 leading-none"
              onClick={(e) => {
                e.stopPropagation();
                onMoveUp?.();
              }}
            >
              ↑
            </button>
          )}
          {canMoveDown && (
            <button
              title="Move down"
              className="text-matrix-muted hover:text-matrix-accent text-xs px-0.5 py-0.5 leading-none"
              onClick={(e) => {
                e.stopPropagation();
                onMoveDown?.();
              }}
            >
              ↓
            </button>
          )}
          <button
            title={t('newFolder', language)}
            className="text-matrix-muted hover:text-matrix-accent text-xs px-0.5 py-0.5 leading-none"
            onClick={(e) => {
              e.stopPropagation();
              createFolder.mutate(
                { name: t('untitled', language), parentId: node.id },
                { onSuccess: () => setExpanded(true) },
              );
            }}
          >
            +📁
          </button>
          <button
            title={t('newFile', language)}
            className="text-matrix-muted hover:text-matrix-accent text-xs px-0.5 py-0.5 leading-none"
            onClick={(e) => {
              e.stopPropagation();
              createFile.mutate(
                { name: `${t('untitled', language)}.md`, folderId: node.id },
                {
                  onSuccess: (file) => {
                    setExpanded(true);
                    onSelectFile(file.id);
                  },
                },
              );
            }}
          >
            +📄
          </button>
          {!isRoot && (
            <DeleteConfirmButton
              onConfirm={() => onRequestDelete('folder', node.id)}
              confirmMessage={t('deleteFolderConfirm', language)}
            />
          )}
        </span>
      </div>

      {/* Children */}
      {expanded && (
        <div>
          {sortedChildren.map((child, childIdx) => (
            <FolderItem
              key={child.id}
              node={child}
              selectedFileId={selectedFileId}
              onSelectFile={onSelectFile}
              onRequestDelete={onRequestDelete}
              depth={depth + 1}
              canMoveUp={childIdx > 0}
              canMoveDown={childIdx < sortedChildren.length - 1}
              onMoveUp={() => swapFolderOrder(sortedChildren, childIdx, childIdx - 1)}
              onMoveDown={() => swapFolderOrder(sortedChildren, childIdx, childIdx + 1)}
            />
          ))}

          {sortedFiles.map((file, fileIdx) => (
            <div
              key={file.id}
              className={`group flex items-center gap-1 py-0.5 pr-2 cursor-pointer select-none ${
                selectedFileId === file.id
                  ? 'bg-matrix-accent/10 text-matrix-accent'
                  : 'text-gray-400 hover:bg-matrix-accent/5 hover:text-gray-200'
              }`}
              style={{ paddingLeft: `${indent + 20}px` }}
              onClick={() => onSelectFile(file.id)}
            >
              <span className="text-xs mr-1 text-matrix-muted shrink-0">📄</span>

              {renamingFileId === file.id ? (
                <RenameInput
                  initialValue={file.name}
                  onCommit={(name) => {
                    renameFile.mutate({ id: file.id, name });
                    setRenamingFileId(null);
                  }}
                  onCancel={() => setRenamingFileId(null)}
                />
              ) : (
                <span
                  className="flex-1 text-sm truncate"
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    setRenamingFileId(file.id);
                  }}
                >
                  {file.name}
                </span>
              )}

              <span className="hidden group-hover:flex items-center gap-0.5 ml-auto shrink-0">
                {fileIdx > 0 && (
                  <button
                    title="Move up"
                    className="text-matrix-muted hover:text-matrix-accent text-xs px-0.5 py-0.5 leading-none"
                    onClick={(e) => {
                      e.stopPropagation();
                      swapFileOrder(sortedFiles, fileIdx, fileIdx - 1);
                    }}
                  >
                    ↑
                  </button>
                )}
                {fileIdx < sortedFiles.length - 1 && (
                  <button
                    title="Move down"
                    className="text-matrix-muted hover:text-matrix-accent text-xs px-0.5 py-0.5 leading-none"
                    onClick={(e) => {
                      e.stopPropagation();
                      swapFileOrder(sortedFiles, fileIdx, fileIdx + 1);
                    }}
                  >
                    ↓
                  </button>
                )}
                <DeleteConfirmButton
                  onConfirm={() => onRequestDelete('file', file.id)}
                  confirmMessage={t('deleteFileConfirm', language)}
                />
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

interface Props {
  folders: DocFolder[];
  files: DocFile[];
  selectedFileId: number | null;
  onSelectFile: (id: number | null) => void;
}

export function DocTree({ folders, files, selectedFileId, onSelectFile }: Props) {
  const { language } = useUiStore();
  const [searchQuery, setSearchQuery] = useState('');
  const createFolder = useCreateFolder();
  const createFile = useCreateFile();
  const deleteFolder = useDeleteFolder();
  const deleteFile = useDeleteFile();

  const { data: searchResults, isFetching: isSearching } = useSearchDocs(searchQuery);

  // Clear selected file when it gets deleted
  const handleDelete = (type: 'folder' | 'file', id: number) => {
    if (type === 'folder') {
      // Collect all file IDs in the folder subtree (BFS)
      const subtreeFileIds = new Set<number>();
      const toVisit = [id];
      while (toVisit.length) {
        const fid = toVisit.pop()!;
        for (const file of files) {
          if (file.folderId === fid) subtreeFileIds.add(file.id);
        }
        for (const folder of folders) {
          if (folder.parentId === fid) toVisit.push(folder.id);
        }
      }
      deleteFolder.mutate(id, {
        onSuccess: () => {
          if (selectedFileId !== null && subtreeFileIds.has(selectedFileId)) {
            onSelectFile(null);
          }
        },
      });
    } else {
      deleteFile.mutate(id, {
        onSuccess: () => {
          if (id === selectedFileId) onSelectFile(null);
        },
      });
    }
  };

  const tree = useMemo(() => buildTree(folders, files), [folders, files]);
  if (!tree) return null;

  const isSearchMode = searchQuery.trim().length >= 2;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-matrix-border bg-matrix-surface shrink-0">
        <span className="text-xs text-matrix-muted font-semibold uppercase tracking-wide">{t('docs', language)}</span>
        <div className="flex gap-0.5">
          <button
            title={t('newFolder', language)}
            className="text-matrix-muted hover:text-matrix-accent text-xs px-1 py-0.5"
            onClick={() => createFolder.mutate({ name: t('untitled', language), parentId: ROOT_FOLDER_ID })}
          >
            +📁
          </button>
          <button
            title={t('newFile', language)}
            className="text-matrix-muted hover:text-matrix-accent text-xs px-1 py-0.5"
            onClick={() =>
              createFile.mutate(
                { name: `${t('untitled', language)}.md`, folderId: ROOT_FOLDER_ID },
                { onSuccess: (file) => onSelectFile(file.id) },
              )
            }
          >
            +📄
          </button>
        </div>
      </div>

      {/* Search input */}
      <div className="px-2 py-1.5 border-b border-matrix-border shrink-0">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`${t('search', language)}...`}
            className="w-full bg-matrix-bg border border-matrix-border rounded px-2 py-0.5 text-xs text-gray-300 placeholder:text-matrix-muted/50 focus:outline-none focus:border-matrix-accent/50"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 text-matrix-muted hover:text-gray-300 text-xs"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-1">
        {isSearchMode ? (
          /* Search results — flat file list */
          isSearching ? (
            <div className="px-3 py-2 text-xs text-matrix-muted">{t('loading', language)}</div>
          ) : searchResults && searchResults.length > 0 ? (
            searchResults.map((file) => (
              <div
                key={file.id}
                className={`flex items-center gap-1 py-0.5 px-3 cursor-pointer select-none ${
                  selectedFileId === file.id
                    ? 'bg-matrix-accent/10 text-matrix-accent'
                    : 'text-gray-400 hover:bg-matrix-accent/5 hover:text-gray-200'
                }`}
                onClick={() => onSelectFile(file.id)}
              >
                <span className="text-xs mr-1 text-matrix-muted shrink-0">📄</span>
                <span className="text-sm truncate">{file.name}</span>
              </div>
            ))
          ) : (
            <div className="px-3 py-2 text-xs text-matrix-muted">{t('noData', language)}</div>
          )
        ) : (
          /* Normal tree view */
          <FolderItem
            node={tree}
            selectedFileId={selectedFileId}
            onSelectFile={onSelectFile}
            onRequestDelete={handleDelete}
            depth={0}
          />
        )}
      </div>
    </div>
  );
}
