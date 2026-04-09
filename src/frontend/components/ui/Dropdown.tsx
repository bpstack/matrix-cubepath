import { useState, useEffect, useRef, useCallback } from 'react';

export interface DropdownOption {
  value: string;
  label: string;
}

interface DropdownProps {
  value: string;
  onChange: (value: string) => void;
  options: DropdownOption[];
  className?: string;
}

export function Dropdown({ value, onChange, options, className }: DropdownProps) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<{ top: number; left: number; width: number } | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const selected = options.find((o) => o.value === value);

  const updatePosition = useCallback(() => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setPosition({ top: rect.bottom + 4, left: rect.left, width: rect.width });
    }
  }, []);

  useEffect(() => {
    if (open) {
      updatePosition();
      window.addEventListener('scroll', updatePosition, true);
      window.addEventListener('resize', updatePosition);
    }
    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [open, updatePosition]);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  return (
    <div ref={ref} className={`relative ${className || ''}`}>
      <button
        type="button"
        ref={buttonRef}
        onClick={() => {
          setOpen(!open);
          if (!open) setTimeout(updatePosition, 0);
        }}
        className="w-full flex items-center justify-between gap-2 bg-matrix-bg border border-matrix-border rounded px-3 py-1.5 text-sm text-gray-400 hover:border-matrix-accent/30 focus:outline-none focus:border-matrix-accent/50 transition-colors"
      >
        <span className="truncate">{selected?.label ?? value}</span>
        <svg
          className={`w-3 h-3 text-gray-500 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 10 6"
        >
          <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && position && (
        <div
          className="fixed z-50 mt-1 min-w-[140px] bg-matrix-surface border border-matrix-border rounded shadow-lg py-1"
          style={{ top: position.top, left: position.left, width: position.width }}
        >
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
              className={`w-full text-left px-3 py-1.5 text-sm transition-colors ${
                opt.value === value
                  ? 'text-matrix-accent bg-matrix-accent/10 font-medium'
                  : 'text-matrix-muted hover:bg-matrix-accent/5 hover:text-matrix-accent'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
