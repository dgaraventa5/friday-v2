'use client';

interface ProgressCardProps {
  completedCount: number;
  totalCount: number;
}

export function ProgressCard({ completedCount, totalCount }: ProgressCardProps) {
  const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900/50 sm:p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100">
          Progress
        </h2>
      </div>

      <div className="mt-2 flex flex-col items-center justify-center">
        <div className="relative flex items-center justify-center">
          {/* Compact Size */}
          <svg className="h-24 w-24 -rotate-90 transform">
            <circle
              cx="48"
              cy="48"
              r="42"
              stroke="currentColor"
              strokeWidth="6"
              fill="none"
              className="text-slate-100 dark:text-slate-800"
            />
            <circle
              cx="48"
              cy="48"
              r="42"
              stroke="currentColor"
              strokeWidth="6"
              fill="none"
              strokeDasharray={`${2 * Math.PI * 42}`}
              strokeDashoffset={`${2 * Math.PI * 42 * (1 - progress / 100)}`}
              className="text-blue-500 transition-all duration-500 ease-out"
              strokeLinecap="round"
            />
          </svg>
          
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {progress}%
            </span>
            <span className="text-[10px] font-medium text-muted-foreground mt-0.5">
              {completedCount} of {totalCount}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
