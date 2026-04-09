import React from 'react';

interface ModalProps {
  children: React.ReactNode;
  title: string;
  onClose: () => void;
  /** Max width class, defaults to max-w-md */
  maxWidth?: string;
}

export function Modal({ children, title, onClose, maxWidth = 'max-w-md' }: ModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div
        className={`bg-matrix-surface border border-matrix-border rounded-lg p-4 w-full ${maxWidth} shadow-xl max-h-[calc(100vh-2rem)] overflow-y-auto mx-4 sm:mx-0`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-gray-200">{title}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-300 text-lg leading-none">
            &times;
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
