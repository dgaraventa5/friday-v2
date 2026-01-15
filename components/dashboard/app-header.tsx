'use client';

import { Flame, Sun, Settings, RefreshCw, Sunrise } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { createBrowserClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Task, Profile } from '@/lib/types';
import { getTodaysFocusTasks } from '@/lib/utils/task-prioritization';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

interface AppHeaderProps {
  tasks: Task[];
  profile: Profile;
  userEmail?: string;
  onOpenRecalibration?: () => void;
}

export function AppHeader({ tasks, profile, userEmail, onOpenRecalibration }: AppHeaderProps) {
  const router = useRouter();
  const supabase = createBrowserClient();
  const { toast } = useToast();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const handleHardRefresh = async () => {
    setIsRefreshing(true);
    try {
      const response = await fetch('/api/reschedule', {
        method: 'POST',
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: 'Tasks rescheduled',
          description: `${data.rescheduled} task(s) rescheduled successfully.`,
        });
        // Refresh the page to show updated tasks
        router.refresh();
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to reschedule tasks',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to reschedule tasks',
        variant: 'destructive',
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  // Calculate daily progress
  const focusTasks = getTodaysFocusTasks(tasks);
  const completedTasks = focusTasks.filter(t => t.completed);
  const totalTasks = focusTasks.length;
  const progress = totalTasks > 0 ? Math.round((completedTasks.length / totalTasks) * 100) : 0;

  // User initials
  const initials = profile?.full_name
    ? profile.full_name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : userEmail?.slice(0, 2).toUpperCase() || 'U';

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Left: Friday Logo */}
        <div className="flex items-center gap-2">
          <Sun className="h-6 w-6 text-yellow-500" fill="currentColor" />
          <span className="text-xl font-semibold lowercase">friday</span>
        </div>

        {/* Right: Streak, Progress, Profile */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Streak Counter */}
          <div className="flex items-center gap-1.5 rounded-full bg-orange-100 dark:bg-orange-900/30 px-2.5 py-1.5 sm:px-3 sm:py-2">
            <Flame className="h-4 w-4 text-orange-500" />
            <span className="text-sm font-semibold text-orange-700 dark:text-orange-400">
              {profile.current_streak || 0}
            </span>
          </div>

          {/* Progress Circle - Mobile/Tablet Only */}
          <div className="relative flex items-center justify-center lg:hidden">
            <svg className="h-10 w-10 -rotate-90 transform sm:h-12 sm:w-12">
              <circle
                cx="20"
                cy="20"
                r="18"
                stroke="currentColor"
                strokeWidth="3"
                fill="none"
                className="text-slate-200 dark:text-slate-700 sm:hidden"
              />
              <circle
                cx="24"
                cy="24"
                r="21"
                stroke="currentColor"
                strokeWidth="3.5"
                fill="none"
                className="hidden text-slate-200 dark:text-slate-700 sm:block"
              />
              <circle
                cx="20"
                cy="20"
                r="18"
                stroke="currentColor"
                strokeWidth="3"
                fill="none"
                strokeDasharray={`${2 * Math.PI * 18}`}
                strokeDashoffset={`${2 * Math.PI * 18 * (1 - progress / 100)}`}
                className="text-blue-500 transition-all duration-500 ease-out sm:hidden"
                strokeLinecap="round"
              />
              <circle
                cx="24"
                cy="24"
                r="21"
                stroke="currentColor"
                strokeWidth="3.5"
                fill="none"
                strokeDasharray={`${2 * Math.PI * 21}`}
                strokeDashoffset={`${2 * Math.PI * 21 * (1 - progress / 100)}`}
                className="hidden text-blue-500 transition-all duration-500 ease-out sm:block"
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs font-bold sm:text-sm">{progress}%</span>
            </div>
          </div>

          {/* User Profile */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-medium leading-none">
                    {profile?.full_name || 'User'}
                  </p>
                  {userEmail && (
                    <p className="text-xs text-muted-foreground">{userEmail}</p>
                  )}
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {onOpenRecalibration && (
                <DropdownMenuItem onClick={onOpenRecalibration}>
                  <Sunrise className="h-4 w-4 mr-2" />
                  Recalibrate
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => router.push('/settings')}>
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleHardRefresh} disabled={isRefreshing}>
                <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                Hard Refresh
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
