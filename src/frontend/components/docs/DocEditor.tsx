import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useDocFile, useUpdateFile } from '../../hooks/useDocs';
import { t } from '../../lib/i18n';
import { useUiStore } from '../../stores/ui.store';

interface Props {
  fileId: number;
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// Maps each line to styled HTML — mimics VS Code markdown colours
function highlight(text: string, dark: boolean): string {
  const boldColor = dark ? '#f0a500' : '#6334b2';
  const codeColor = dark ? '#2dd4bf' : '#0e7490';

  return text
    .split('\n')
    .map((line) => {
      const esc = escapeHtml(line);
      // Headings — whole line coloured
      if (/^# /.test(line)) return `<span style="color:#79b8ff;font-weight:600">${esc}</span>`;
      if (/^## /.test(line)) return `<span style="color:#58a6ff;font-weight:600">${esc}</span>`;
      if (/^### /.test(line)) return `<span style="color:#388bfd;font-weight:600">${esc}</span>`;
      if (/^#{4,} /.test(line)) return `<span style="color:#1f6feb;font-weight:600">${esc}</span>`;
      // Inline code and bold
      return esc
        .replace(/`([^`]+)`/g, `<span style="color:${codeColor}">\`$1\`</span>`)
        .replace(/\*\*(.+?)\*\*/g, `<span style="color:${boldColor};font-weight:700">**$1**</span>`);
    })
    .join('\n');
}

export function DocEditor({ fileId }: Props) {
  const { language, theme, setDocsIsDirty } = useUiStore();
  const { data: file, isLoading } = useDocFile(fileId);
  const updateFile = useUpdateFile();

  const [content, setContent] = useState('');
  const [isDirty, setIsDirty] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isDirtyRef = useRef(false);
  const backdropRef = useRef<HTMLPreElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const highlighted = useMemo(() => highlight(content, theme === 'dark') + '\n', [content, theme]);

  // Sync isDirty to global store so Sidebar can intercept tab changes
  useEffect(() => {
    setDocsIsDirty(isDirty);
  }, [isDirty, setDocsIsDirty]);

  // Reset when switching files — must run BEFORE the [file] effect
  useEffect(() => {
    isDirtyRef.current = false;
    setIsDirty(false);
    setSaveError(false);
    setContent('');
  }, [fileId]);

  // Sync server data only when no unsaved local changes
  useEffect(() => {
    if (file && !isDirtyRef.current) {
      setContent(file.content);
    }
  }, [file]);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [fileId]);

  const handleScroll = useCallback(() => {
    if (backdropRef.current && textareaRef.current) {
      backdropRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  }, []);

  // Shared save trigger — used by handleChange and handleKeyDown
  const triggerSave = useCallback(
    (newValue: string) => {
      isDirtyRef.current = true;
      setIsDirty(true);
      setSaveError(false);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        updateFile.mutate(
          { id: fileId, content: newValue },
          {
            onSuccess: () => {
              isDirtyRef.current = false;
              setIsDirty(false);
            },
            onError: () => {
              setSaveError(true);
            },
          },
        );
      }, 800);
    },
    [fileId, updateFile],
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = e.target.value;
      setContent(newValue);
      triggerSave(newValue);
    },
    [triggerSave],
  );

  // Tab key inserts 2 spaces; Shift+Tab removes indentation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key !== 'Tab') return;
      e.preventDefault();
      const ta = e.currentTarget;
      const start = ta.selectionStart;
      const end = ta.selectionEnd;

      if (!e.shiftKey) {
        const spaces = '  ';
        const newContent = content.substring(0, start) + spaces + content.substring(end);
        setContent(newContent);
        triggerSave(newContent);
        requestAnimationFrame(() => {
          ta.selectionStart = ta.selectionEnd = start + spaces.length;
        });
      } else {
        // Shift+Tab: remove up to 2 spaces from start of current line
        const before = content.substring(0, start);
        const lineStart = before.lastIndexOf('\n') + 1;
        const linePrefix = content.substring(lineStart, lineStart + 2);
        if (linePrefix === '  ') {
          const newContent = content.substring(0, lineStart) + content.substring(lineStart + 2);
          setContent(newContent);
          triggerSave(newContent);
          requestAnimationFrame(() => {
            ta.selectionStart = ta.selectionEnd = Math.max(lineStart, start - 2);
          });
        }
      }
    },
    [content, triggerSave],
  );

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center text-matrix-muted text-sm">{t('loading', language)}</div>
    );
  }

  return (
    <div className="flex flex-col flex-1 h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-matrix-border bg-matrix-surface shrink-0">
        <span className="text-sm text-gray-300 font-medium truncate">{file?.name}</span>
        {file && (
          <span className={`text-xs ${saveError ? 'text-red-400' : isDirty ? 'text-matrix-muted' : 'text-green-400'}`}>
            {saveError
              ? '⚠ Save failed'
              : isDirty
                ? '...'
                : `${t('saved', language)} ✓ — ${new Date(file.updatedAt).toLocaleString(
                    language === 'es' ? 'es-ES' : 'en-US',
                    {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    },
                  )}`}
          </span>
        )}
      </div>

      {/* Editor: pre backdrop + transparent textarea overlay */}
      <div className="flex-1 relative overflow-hidden">
        {/* Highlighted backdrop — pointer-events:none so clicks pass through to textarea */}
        <pre
          ref={backdropRef}
          aria-hidden
          className="absolute inset-0 font-mono text-sm p-4 m-0 overflow-hidden whitespace-pre-wrap break-words text-gray-200 pointer-events-none select-none"
          style={{ background: 'transparent' }}
          dangerouslySetInnerHTML={{ __html: highlighted }}
        />
        {/* Textarea — transparent text so backdrop shows through, white caret stays visible */}
        <textarea
          ref={textareaRef}
          className="absolute inset-0 w-full h-full resize-none bg-transparent font-mono text-sm p-4 focus:outline-none placeholder:text-matrix-muted/40"
          style={{ color: 'transparent', caretColor: theme === 'light' ? '#1e293b' : '#e2e8f0' }}
          value={content}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onScroll={handleScroll}
          placeholder="# Start writing..."
          spellCheck={false}
        />
      </div>
    </div>
  );
}
