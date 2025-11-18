'use client';

import { Calendar, Home, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

type NavView = 'today' | 'schedule';

interface BottomNavProps {
  currentView: NavView;
  onViewChange: (view: NavView) => void;
  onAddTask: () => void;
}

export function BottomNav({ currentView, onViewChange, onAddTask }: BottomNavProps) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 pb-safe-area backdrop-blur supports-[backdrop-filter]:bg-background/80 md:border-t-0 md:border md:rounded-t-2xl md:mx-auto md:mb-4 md:max-w-2xl md:shadow-lg">
      <div className="mx-auto flex w-full items-center gap-2 px-4 py-3 md:gap-3 md:px-6 md:py-4">
        <button
          onClick={() => onViewChange('today')}
          className={cn(
            'flex flex-1 items-center justify-center gap-2 rounded-full px-4 py-2.5 text-xs font-medium transition-all md:text-sm md:px-6 md:py-3',
            currentView === 'today'
              ? 'bg-primary text-primary-foreground shadow-sm scale-105'
              : 'text-muted-foreground hover:text-foreground hover:bg-accent'
          )}
          aria-pressed={currentView === 'today'}
        >
          <Home className="h-4 w-4 md:h-5 md:w-5" />
          <span>Today</span>
        </button>

        <button
          onClick={onAddTask}
          className="flex flex-1 items-center justify-center gap-2 rounded-full bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground shadow-md transition-all hover:bg-primary/90 hover:shadow-lg hover:scale-105 md:text-sm md:px-6 md:py-3"
        >
          <Plus className="h-4 w-4 md:h-5 md:w-5" />
          <span>Add Task</span>
        </button>

        <button
          onClick={() => onViewChange('schedule')}
          className={cn(
            'flex flex-1 items-center justify-center gap-2 rounded-full px-4 py-2.5 text-xs font-medium transition-all md:text-sm md:px-6 md:py-3',
            currentView === 'schedule'
              ? 'bg-primary text-primary-foreground shadow-sm scale-105'
              : 'text-muted-foreground hover:text-foreground hover:bg-accent'
          )}
          aria-pressed={currentView === 'schedule'}
        >
          <Calendar className="h-4 w-4 md:h-5 md:w-5" />
          <span>Schedule</span>
        </button>
      </div>
    </nav>
  );
}
