'use client';

import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InlineQuickAddProps {
  onOpenFullForm: () => void;
  className?: string;
}

export function InlineQuickAdd({ onOpenFullForm, className }: InlineQuickAddProps) {
  return (
    <button
      onClick={onOpenFullForm}
      className={cn(
        'w-full rounded-xl border-2 border-dashed border-amber-200 dark:border-slate-600 p-3 sm:p-4',
        'flex items-center gap-2 text-sm text-stone-400 dark:text-slate-500',
        'hover:border-amber-400 hover:bg-amber-50 hover:text-amber-600',
        'dark:hover:border-amber-500 dark:hover:bg-amber-950/20 dark:hover:text-amber-400',
        'transition-colors',
        className
      )}
    >
      <Plus className="h-4 w-4" aria-hidden="true" />
      <span>Add a task...</span>
    </button>
  );
}
