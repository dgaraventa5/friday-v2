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
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 px-2 pb-safe-area backdrop-blur supports-[backdrop-filter]:bg-background/80 md:static md:border md:bg-card md:px-6 md:pb-0 md:pt-0 md:shadow-sm">
      <div className="mx-auto flex w-full max-w-xl items-center gap-2 py-2 md:py-3">
        <button
          onClick={() => onViewChange('today')}
          className={cn(
            'flex flex-1 items-center justify-center gap-2 rounded-full px-3 py-2 text-xs font-medium transition-colors md:text-sm',
            currentView === 'today'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          )}
          aria-pressed={currentView === 'today'}
        >
          <Home className="h-4 w-4" />
          <span>Today</span>
        </button>

        <button
          onClick={onAddTask}
          className="flex flex-1 items-center justify-center gap-2 rounded-full bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 md:text-sm"
        >
          <Plus className="h-4 w-4" />
          <span>Add</span>
        </button>

        <button
          onClick={() => onViewChange('schedule')}
          className={cn(
            'flex flex-1 items-center justify-center gap-2 rounded-full px-3 py-2 text-xs font-medium transition-colors md:text-sm',
            currentView === 'schedule'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          )}
          aria-pressed={currentView === 'schedule'}
        >
          <Calendar className="h-4 w-4" />
          <span>Schedule</span>
        </button>
      </div>
    </nav>
  );
}
