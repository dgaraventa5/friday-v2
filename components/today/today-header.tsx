import { Flame } from 'lucide-react';

interface TodayHeaderProps {
  completedCount: number;
  totalCount: number;
  currentStreak: number;
}

export function TodayHeader({ completedCount, totalCount, currentStreak }: TodayHeaderProps) {
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 border-b px-4 py-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-balance">Today's Focus</h1>
        {currentStreak > 0 && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-orange-100 dark:bg-orange-900/30 rounded-full">
            <Flame className="h-4 w-4 text-orange-500" />
            <span className="text-sm font-semibold text-orange-700 dark:text-orange-400">
              {currentStreak} day{currentStreak !== 1 ? 's' : ''}
            </span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-4">
        <div className="relative w-24 h-24">
          <svg className="w-24 h-24 transform -rotate-90">
            <circle
              cx="48"
              cy="48"
              r="45"
              stroke="currentColor"
              strokeWidth="6"
              fill="none"
              className="text-slate-200 dark:text-slate-700"
            />
            <circle
              cx="48"
              cy="48"
              r="45"
              stroke="currentColor"
              strokeWidth="6"
              fill="none"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className="text-blue-500 transition-all duration-500 ease-out"
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-2xl font-bold">{completedCount}</div>
              <div className="text-xs text-muted-foreground">of {totalCount}</div>
            </div>
          </div>
        </div>

        <div className="flex-1">
          <p className="text-sm text-muted-foreground leading-relaxed">
            {completedCount === 0 && totalCount > 0 && "Let's make today productive. Start with your first task."}
            {completedCount > 0 && completedCount < totalCount && `Great progress! ${totalCount - completedCount} more to go.`}
            {completedCount === totalCount && totalCount > 0 && "All tasks complete! Enjoy the rest of your day."}
          </p>
        </div>
      </div>
    </div>
  );
}
