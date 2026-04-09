import React, { useRef, useCallback } from 'react';

interface ResizableTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  /** Extra Tailwind classes to merge in */
  className?: string;
}

/**
 * Consistent textarea with a full-width bottom drag handle for easy resizing.
 */
export function ResizableTextarea({ className = '', rows = 2, ...props }: ResizableTextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const startY = e.clientY;
    const startHeight = textareaRef.current?.offsetHeight ?? 0;

    const onMouseMove = (ev: MouseEvent) => {
      if (textareaRef.current) {
        const newHeight = Math.max(64, startHeight + ev.clientY - startY);
        textareaRef.current.style.height = `${newHeight}px`;
      }
    };

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }, []);

  return (
    <div className="relative flex flex-col">
      <textarea
        ref={textareaRef}
        rows={rows}
        style={{ resize: 'none' }}
        className={`w-full text-sm bg-matrix-surface border border-matrix-border rounded-t px-2 py-1.5 text-gray-200 placeholder-matrix-muted/50 focus:outline-none focus:border-matrix-accent min-h-[4rem] ${className}`}
        {...props}
      />
      {/* Full-width drag handle */}
      <div
        onMouseDown={handleMouseDown}
        className="h-3 w-full cursor-row-resize bg-matrix-bg border border-t-0 border-matrix-border rounded-b flex items-center justify-center group hover:bg-matrix-border/20 transition-colors select-none"
      >
        <div className="w-8 h-px bg-matrix-border group-hover:bg-matrix-muted transition-colors rounded-full" />
      </div>
    </div>
  );
}
