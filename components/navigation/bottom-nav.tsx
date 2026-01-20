'use client';

import { Calendar, List, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

type NavView = 'today' | 'schedule';

interface BottomNavProps {
  currentView: NavView;
  onViewChange: (view: NavView) => void;
  onAddTask: () => void;
}

export function BottomNav({ currentView, onViewChange, onAddTask }: BottomNavProps) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 pb-safe-area backdrop-blur supports-backdrop-filter:bg-background/80">
      <div className="relative mx-auto flex w-full max-w-md items-center justify-between px-8 py-4">
        {/* Today Button */}
        <button
          onClick={() => onViewChange('today')}
          className={cn(
            'flex flex-col items-center justify-center gap-1 transition-colors rounded-md p-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
            currentView === 'today'
              ? 'text-blue-600 dark:text-blue-500'
              : 'text-muted-foreground hover:text-foreground'
          )}
          aria-pressed={currentView === 'today'}
        >
          <List className="h-6 w-6" aria-hidden="true" />
          <span className="text-xs font-medium">Today</span>
        </button>

        {/* Floating Add Button */}
        <button
          onClick={onAddTask}
          className="absolute left-1/2 -top-6 -translate-x-1/2 flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg transition-[transform,background-color,box-shadow] hover:bg-blue-700 hover:shadow-xl hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          aria-label="Add task"
        >
          <Plus className="h-7 w-7" strokeWidth={2.5} aria-hidden="true" />
        </button>

        {/* Schedule Button */}
        <button
          onClick={() => onViewChange('schedule')}
          className={cn(
            'flex flex-col items-center justify-center gap-1 transition-colors rounded-md p-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
            currentView === 'schedule'
              ? 'text-blue-600 dark:text-blue-500'
              : 'text-muted-foreground hover:text-foreground'
          )}
          aria-pressed={currentView === 'schedule'}
        >
          <Calendar className="h-6 w-6" aria-hidden="true" />
          <span className="text-xs font-medium">Schedule</span>
        </button>
      </div>
    </nav>
  );
}
