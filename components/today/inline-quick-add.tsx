'use client';

import { useState, useRef } from 'react';
import { Plus, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InlineQuickAddProps {
  onQuickAdd: (title: string) => void;
  onOpenFullForm: () => void;
  className?: string;
}

export function InlineQuickAdd({ onQuickAdd, onOpenFullForm, className }: InlineQuickAddProps) {
  const [isActive, setIsActive] = useState(false);
  const [title, setTitle] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = () => {
    const trimmed = title.trim();
    if (!trimmed) return;
    onQuickAdd(trimmed);
    setTitle('');
    // Keep input focused for rapid entry
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
    if (e.key === 'Escape') {
      setTitle('');
      setIsActive(false);
      inputRef.current?.blur();
    }
  };

  if (!isActive) {
    return (
      <button
        onClick={() => {
          setIsActive(true);
          setTimeout(() => inputRef.current?.focus(), 0);
        }}
        className={cn(
          'w-full rounded-xl border-2 border-dashed border-amber-200 dark:border-slate-600 p-3 sm:p-4',
          'flex items-center gap-2 text-sm text-stone-400 dark:text-slate-500',
          'hover:border-amber-300 hover:text-stone-500 dark:hover:border-slate-500',
          'transition-colors',
          className
        )}
      >
        <Plus className="h-4 w-4" aria-hidden="true" />
        <span>Add a task...</span>
      </button>
    );
  }

  return (
    <div className={cn(
      'rounded-xl border-2 border-amber-300 dark:border-amber-600 bg-white dark:bg-slate-800 p-2 sm:p-3',
      'flex items-center gap-2',
      className
    )}>
      <input
        ref={inputRef}
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => {
          if (!title.trim()) setIsActive(false);
        }}
        placeholder="Type a task and press Enter..."
        className="flex-1 bg-transparent text-sm text-stone-800 dark:text-slate-100 placeholder:text-stone-400 dark:placeholder:text-slate-500 outline-none"
        autoFocus
      />
      <button
        onClick={onOpenFullForm}
        className="shrink-0 flex items-center gap-1 text-xs text-stone-400 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
        title="Open full task form"
      >
        <span className="hidden sm:inline">More</span>
        <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
    </div>
  );
}
