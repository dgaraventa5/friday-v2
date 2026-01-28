'use client';

import { Sun, Settings, RefreshCw, Sunrise } from 'lucide-react';
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
import { Profile } from '@/lib/types';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

interface AppHeaderProps {
  profile: Profile;
  userEmail?: string;
  onOpenRecalibration?: () => void;
}

export function AppHeader({ profile, userEmail, onOpenRecalibration }: AppHeaderProps) {
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
          <Sun className="h-6 w-6 text-yellow-500" fill="currentColor" aria-hidden="true" />
          <span className="text-xl font-semibold lowercase">friday</span>
        </div>

        {/* Right: Profile */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* User Profile */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full" aria-label="User menu">
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
                  <Sunrise className="h-4 w-4 mr-2" aria-hidden="true" />
                  Recalibrate
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => router.push('/settings')}>
                <Settings className="h-4 w-4 mr-2" aria-hidden="true" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleHardRefresh} disabled={isRefreshing}>
                <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} aria-hidden="true" />
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
