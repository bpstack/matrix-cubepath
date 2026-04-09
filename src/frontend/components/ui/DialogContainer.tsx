import React, { useEffect, useRef, useState } from 'react';
import { useDialogStore } from '../../stores/dialog.store';

export function DialogContainer() {
  const { dialog, _resolve, _close } = useDialogStore();
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);

  // Sync default value when a prompt dialog opens
  useEffect(() => {
    if (dialog?.type === 'prompt') {
      setInputValue(dialog.options.defaultValue ?? '');
      setTimeout(() => inputRef.current?.focus(), 0);
    } else if (dialog?.type === 'confirm') {
      setTimeout(() => confirmRef.current?.focus(), 0);
    }
  }, [dialog]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') _close();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [_close]);

  if (!dialog) return null;

  const isConfirm = dialog.type === 'confirm';
  const opts = dialog.options;
  const isDanger = isConfirm && (opts as typeof dialog.options & { danger?: boolean }).danger;

  const confirmLabel = opts.confirmLabel ?? (isDanger ? 'Delete' : 'Confirm');
  const cancelLabel = opts.cancelLabel ?? 'Cancel';

  const handleConfirm = () => {
    if (isConfirm) {
      _resolve(true);
    } else {
      _resolve(inputValue.trim() || null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={_close}>
      <div
        className="bg-matrix-surface border border-matrix-border rounded-lg shadow-xl w-full max-w-sm mx-4 p-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Title */}
        <h3 className="text-sm font-semibold text-gray-200 mb-1">{opts.title}</h3>

        {/* Description */}
        {'description' in opts && opts.description && (
          <p className="text-xs text-matrix-muted mb-4">{opts.description}</p>
        )}

        {/* Prompt input */}
        {!isConfirm && (
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleConfirm()}
            placeholder={'placeholder' in opts ? opts.placeholder : undefined}
            className="w-full mt-3 mb-4 bg-matrix-bg border border-matrix-border rounded px-3 py-2 text-sm text-gray-200 placeholder:text-matrix-muted/50 focus:outline-none focus:border-matrix-accent/50"
          />
        )}

        {/* Confirm-only spacing */}
        {isConfirm && <div className="mt-4" />}

        {/* Actions */}
        <div className="flex justify-end gap-2">
          <button
            onClick={_close}
            className="px-3 py-1.5 text-xs text-matrix-muted hover:text-gray-300 border border-matrix-border rounded hover:bg-matrix-border/30 transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            ref={confirmRef}
            onClick={handleConfirm}
            className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
              isDanger
                ? 'bg-red-500/15 text-red-400 border border-red-500/30 hover:bg-red-500/25'
                : 'bg-matrix-accent/15 text-matrix-accent border border-matrix-accent/30 hover:bg-matrix-accent/25'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
