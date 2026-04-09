import { useState, useEffect, useRef, useCallback } from 'react';

interface CalendarProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

const WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export function Calendar({ value, onChange, className }: CalendarProps) {
  const [open, setOpen] = useState(false);
  const [viewDate, setViewDate] = useState(() => (value ? new Date(value + 'T00:00:00') : new Date()));
  const [position, setPosition] = useState<{ top: number; left: number; openUp: boolean } | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const selectedDate = value ? new Date(value + 'T00:00:00') : null;

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  const updatePosition = useCallback(() => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const calendarWidth = 240;
      const calendarHeight = 300;
      const buttonCenter = rect.left + rect.width / 2;
      const openLeftward = buttonCenter > window.innerWidth / 2;
      const left = openLeftward ? rect.right - calendarWidth : rect.left;
      const spaceBelow = window.innerHeight - rect.bottom - 4;
      const openUp = spaceBelow < calendarHeight && rect.top > calendarHeight;
      const top = openUp ? rect.top - calendarHeight - 4 : rect.bottom + 4;
      setPosition({ top, left, openUp });
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

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDaySun = new Date(year, month, 1).getDay(); // 0=Sun,1=Mon,...
    const firstDay = (firstDaySun + 6) % 7; // shift so Mon=0, Tue=1, ..., Sun=6
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const days: { date: Date; isCurrentMonth: boolean }[] = [];

    for (let i = firstDay - 1; i >= 0; i--) {
      days.push({ date: new Date(year, month - 1, daysInPrevMonth - i), isCurrentMonth: false });
    }

    for (let i = 1; i <= daysInMonth; i++) {
      days.push({ date: new Date(year, month, i), isCurrentMonth: true });
    }

    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      days.push({ date: new Date(year, month + 1, i), isCurrentMonth: false });
    }

    return days;
  };

  const formatDate = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const isSameDay = (a: Date, b: Date | null) => {
    if (!b) return false;
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return isSameDay(date, today);
  };

  const handleSelect = (date: Date) => {
    onChange(formatDate(date));
    setOpen(false);
  };

  const prevMonth = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  const nextMonth = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));

  const displayValue = value
    ? new Date(value + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : '';

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
        <span className="truncate">{displayValue || 'Select date'}</span>
        <svg
          className="w-3.5 h-3.5 text-gray-500 shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"
          />
        </svg>
      </button>

      {open && position && (
        <div
          className="fixed z-50 mt-1 bg-matrix-surface border border-matrix-border rounded-lg shadow-lg p-3 w-[240px]"
          style={{ top: position.top, left: position.left }}
        >
          <div className="flex items-center justify-between mb-2">
            <button
              type="button"
              onClick={prevMonth}
              className="p-1 text-gray-500 hover:text-gray-300 hover:bg-matrix-bg rounded transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span className="text-xs font-medium text-gray-300">
              {MONTHS[viewDate.getMonth()]} {viewDate.getFullYear()}
            </span>
            <button
              type="button"
              onClick={nextMonth}
              className="p-1 text-gray-500 hover:text-gray-300 hover:bg-matrix-bg rounded transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          <div className="grid grid-cols-7 gap-0.5 mb-1">
            {WEEKDAYS.map((day) => (
              <div key={day} className="text-[10px] text-center text-gray-600 font-medium py-1">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-0.5">
            {getDaysInMonth(viewDate).map((day, idx) => {
              const isSelected = isSameDay(day.date, selectedDate);
              const today = isToday(day.date);

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelect(day.date)}
                  disabled={!day.isCurrentMonth}
                  className={`
                    text-xs rounded transition-colors py-1
                    ${!day.isCurrentMonth ? 'text-gray-700 cursor-default' : ''}
                    ${
                      isSelected
                        ? 'bg-matrix-accent text-white font-medium'
                        : 'text-gray-400 hover:bg-matrix-bg hover:text-gray-200'
                    }
                    ${today && !isSelected ? 'ring-1 ring-matrix-accent/40' : ''}
                  `}
                >
                  {day.date.getDate()}
                </button>
              );
            })}
          </div>

          <div className="flex gap-2 mt-3 pt-2 border-t border-matrix-border/50">
            <button
              type="button"
              onClick={() => {
                onChange('');
                setOpen(false);
              }}
              className="flex-1 text-xs text-gray-500 hover:text-gray-300 py-1 rounded hover:bg-matrix-bg transition-colors"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => {
                onChange(formatDate(new Date()));
                setOpen(false);
              }}
              className="flex-1 text-xs text-matrix-accent hover:bg-matrix-accent/10 py-1 rounded transition-colors"
            >
              Today
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
