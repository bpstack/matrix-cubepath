import React, { useState, useRef, useEffect } from 'react';

// --- Constants ---

export const statusIcon: Record<string, string> = { pending: '○', in_progress: '◐', done: '●' };
export const statusColor: Record<string, string> = {
  pending: 'text-gray-500',
  in_progress: 'text-amber-400',
  done: 'text-green-400',
};
export const priorityColor: Record<string, string> = {
  low: 'text-gray-500',
  medium: 'text-blue-400',
  high: 'text-orange-400',
  urgent: 'text-red-400',
};
export const nextStatus: Record<string, string> = { pending: 'in_progress', in_progress: 'done', done: 'pending' };

export function progressColor(value: number): string {
  if (value <= 33) return 'bg-red-500';
  if (value <= 66) return 'bg-amber-500';
  return 'bg-[#27a35a]';
}

export function progressColorText(value: number): string {
  if (value <= 33) return 'text-red-400';
  if (value <= 66) return 'text-amber-400';
  return 'text-[#27a35a]';
}

export const inlineCls =
  'flex-1 bg-transparent border border-matrix-border/50 rounded px-2 py-1 text-sm text-gray-300 placeholder-gray-600 focus:outline-none focus:border-matrix-accent/40';

// --- ProgressBar ---

export function ProgressBar({
  value,
  className = '',
  height = 'h-1',
  bg = 'bg-matrix-border/50',
}: {
  value: number;
  className?: string;
  height?: string;
  bg?: string;
}) {
  return (
    <div className={`w-full ${bg} rounded-full ${height} ${className}`}>
      <div
        className={`${progressColor(value)} ${height} rounded-full transition-all duration-500`}
        style={{ width: `${value}%` }}
      />
    </div>
  );
}

// --- ProgressRing ---

export function ProgressRing({ value, size = 48, stroke = 4 }: { value: number; size?: number; stroke?: number }) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;
  const color = value <= 33 ? '#ef4444' : value <= 66 ? '#f59e0b' : '#22c55e';
  return (
    <svg width={size} height={size} className="shrink-0">
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={stroke} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        className="transition-all duration-500"
      />
      <text
        x="50%"
        y="50%"
        textAnchor="middle"
        dominantBaseline="central"
        className="fill-gray-800 dark:fill-gray-300 text-[10px] font-mono"
      >
        {value}%
      </text>
    </svg>
  );
}

// --- SectionCard ---

export function SectionCard({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <div className="bg-matrix-surface border border-matrix-border rounded-md p-4">
      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-matrix-border">
        <span className="text-sm text-matrix-muted">{icon}</span>
        <h2 className="text-sm font-medium text-gray-300">{title}</h2>
      </div>
      {children}
    </div>
  );
}

// --- ActionButtons ---

export function ActionButtons({
  onEdit,
  onConfirmDelete,
  confirmMessage,
  size = 'xs',
  showOnHover = true,
}: {
  onEdit: () => void;
  onConfirmDelete: () => void;
  confirmMessage: string;
  size?: 'xs' | 'sm';
  showOnHover?: boolean;
}) {
  const cls = size === 'xs' ? 'text-[10px]' : 'text-xs';
  return (
    <span
      className={`inline-flex items-center gap-1 ${showOnHover ? 'opacity-0 group-hover:opacity-100 transition-opacity' : ''}`}
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          onEdit();
        }}
        className={`${cls} text-matrix-muted/50 hover:text-matrix-accent transition-colors`}
      >
        ✎
      </button>
      <DeleteConfirmButton onConfirm={onConfirmDelete} confirmMessage={confirmMessage} size={size} />
    </span>
  );
}

// --- DeleteConfirmButton ---

export function DeleteConfirmButton({
  onConfirm,
  confirmMessage,
  size = 'xs',
  className = '',
}: {
  onConfirm: () => void;
  confirmMessage: string;
  size?: 'xs' | 'sm';
  className?: string;
}) {
  const [pending, setPending] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const cls = size === 'xs' ? 'text-[10px]' : 'text-xs';

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (pending) {
      if (timerRef.current) clearTimeout(timerRef.current);
      setPending(false);
      onConfirm();
    } else {
      setPending(true);
      timerRef.current = setTimeout(() => setPending(false), 3000);
    }
  };

  return (
    <span className={`relative inline-flex ${className}`}>
      <button
        onClick={handleClick}
        title={pending ? confirmMessage : confirmMessage}
        className={`${cls} transition-colors ${
          pending ? 'text-matrix-danger animate-pulse' : 'text-matrix-muted/50 hover:text-matrix-danger'
        }`}
      >
        {pending ? '?' : '✕'}
      </button>
      {pending && (
        <span className="absolute bottom-full right-0 mb-1 whitespace-nowrap bg-matrix-surface border border-matrix-danger/40 text-matrix-danger text-[10px] rounded px-2 py-1 shadow-lg z-50 pointer-events-none">
          {confirmMessage}
        </span>
      )}
    </span>
  );
}
