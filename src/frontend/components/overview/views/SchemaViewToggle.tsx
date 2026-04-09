import React from 'react';

export type SchemaViewMode = 'tree' | 'dashboard' | 'roadmap';

const viewModes: { key: SchemaViewMode; icon: string; label: string }[] = [
  { key: 'tree', icon: '☰', label: 'Tree' },
  { key: 'dashboard', icon: '◫', label: 'Dashboard' },
  { key: 'roadmap', icon: '⟿', label: 'Roadmap' },
];

export function SchemaViewToggle({
  value,
  onChange,
}: {
  value: SchemaViewMode;
  onChange: (mode: SchemaViewMode) => void;
}) {
  return (
    <div className="flex border border-matrix-border rounded overflow-hidden">
      {viewModes.map((m) => (
        <button
          key={m.key}
          onClick={() => onChange(m.key)}
          title={m.label}
          className={`px-2 py-1 text-xs transition-colors ${
            value === m.key ? 'bg-matrix-accent/10 text-matrix-accent' : 'text-matrix-muted hover:text-gray-300'
          }`}
        >
          {m.icon}
        </button>
      ))}
    </div>
  );
}
