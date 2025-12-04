'use client';

import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AddTaskGhostProps {
  onClick: () => void;
  className?: string;
}

export function AddTaskGhost({ onClick, className }: AddTaskGhostProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center justify-center gap-2',
        'bg-transparent border-2 border-dashed border-slate-200 dark:border-slate-700',
        'rounded-md p-3 md:p-3.5 lg:p-4',
        'text-slate-500 dark:text-slate-400 font-medium',
        'hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:border-slate-300 dark:hover:border-slate-600',
        'transition-all duration-200 ease-out',
        'cursor-pointer group',
        className
      )}
    >
      <div className="p-1 rounded-full bg-slate-100 dark:bg-slate-800 group-hover:bg-slate-200 dark:group-hover:bg-slate-700 transition-colors">
        <Plus className="h-4 w-4 text-slate-600 dark:text-slate-400" />
      </div>
      <span>Add another task</span>
    </button>
  );
}

