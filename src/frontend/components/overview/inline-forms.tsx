import React, { useState, useRef, useEffect } from 'react';
import { inlineCls } from './primitives';
import { ResizableTextarea } from '../ui/ResizableTextarea';
import { useUiStore } from '../../stores/ui.store';
import { t } from '../../lib/i18n';

// ── InlineEdit ──────────────────────────────────────────────────────────────

export function InlineEdit({
  value,
  onSave,
  onCancel,
}: {
  value: string;
  onSave: (v: string) => void;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const commit = () => {
    const trimmed = draft.trim();
    if (trimmed && trimmed !== value) onSave(trimmed);
    else onCancel();
  };

  return (
    <input
      ref={inputRef}
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') commit();
        if (e.key === 'Escape') onCancel();
      }}
      autoFocus
      className="bg-matrix-bg border border-matrix-accent/40 rounded px-2 py-0.5 text-sm text-gray-200 focus:outline-none w-full"
      onClick={(e) => e.stopPropagation()}
    />
  );
}

// ── InlineAdd ───────────────────────────────────────────────────────────────

export function InlineAdd({
  label,
  placeholder,
  onAdd,
}: {
  label: string;
  placeholder: string;
  onAdd: (title: string) => void;
}) {
  const [active, setActive] = useState(false);
  const [value, setValue] = useState('');

  if (!active) {
    return (
      <button
        onClick={(e) => {
          e.stopPropagation();
          setActive(true);
        }}
        className="text-xs text-gray-500 hover:text-matrix-accent transition-colors mt-1"
      >
        + {label}
      </button>
    );
  }

  return (
    <form
      className="flex gap-1.5 mt-1"
      onSubmit={(e) => {
        e.preventDefault();
        if (!value.trim()) return;
        onAdd(value.trim());
        setValue('');
        setActive(false);
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        autoFocus
        onBlur={() => !value.trim() && setActive(false)}
        className={inlineCls}
      />
    </form>
  );
}

// ── InlineAddObjective ──────────────────────────────────────────────────────

export function InlineAddObjective({
  missionId,
  onCreate,
}: {
  missionId: number;
  onCreate: (data: { missionId: number; title: string; description?: string }) => void;
}) {
  const { language } = useUiStore();
  const [active, setActive] = useState(false);
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');

  if (!active) {
    return (
      <button
        onClick={(e) => {
          e.stopPropagation();
          setActive(true);
        }}
        className="text-xs text-gray-500 hover:text-matrix-accent transition-colors mt-1"
      >
        + objective
      </button>
    );
  }

  return (
    <form
      className="space-y-1 mt-1"
      onClick={(e) => e.stopPropagation()}
      onSubmit={(e) => {
        e.preventDefault();
        if (!title.trim()) return;
        onCreate({ missionId, title: title.trim(), description: desc.trim() || undefined });
        setTitle('');
        setDesc('');
        setActive(false);
      }}
    >
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder={t('objectivePlaceholder', language)}
        autoFocus
        className="w-full bg-transparent border border-matrix-border/50 rounded px-2 py-1.5 text-base text-gray-200 placeholder-gray-600 focus:outline-none focus:border-matrix-accent/40"
      />
      <ResizableTextarea
        value={desc}
        onChange={(e) => setDesc(e.target.value)}
        placeholder={t('descriptionOptional', language)}
      />
      <div className="flex gap-2">
        <button type="submit" className="text-xs text-matrix-accent hover:text-matrix-accent-hover">
          Save
        </button>
        <button
          type="button"
          onClick={() => {
            setTitle('');
            setDesc('');
            setActive(false);
          }}
          className="text-xs text-matrix-muted hover:text-gray-200"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
