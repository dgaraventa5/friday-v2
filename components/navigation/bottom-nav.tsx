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
    <nav className="border-t bg-background">
      <div className="flex items-center justify-around h-16">
        <button
          onClick={() => onViewChange('today')}
          className={cn(
            'flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors',
            currentView === 'today'
              ? 'text-primary'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <Home className="h-5 w-5" />
          <span className="text-xs font-medium">Today</span>
        </button>

        <button
          onClick={onAddTask}
          className="flex items-center justify-center w-14 h-14 -mt-8 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl transition-all hover:scale-105 active:scale-95"
        >
          <Plus className="h-6 w-6" />
        </button>

        <button
          onClick={() => onViewChange('schedule')}
          className={cn(
            'flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors',
            currentView === 'schedule'
              ? 'text-primary'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <Calendar className="h-5 w-5" />
          <span className="text-xs font-medium">Schedule</span>
        </button>
      </div>
    </nav>
  );
}
