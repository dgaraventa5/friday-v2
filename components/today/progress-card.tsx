'use client';

interface ProgressCardProps {
  completedCount: number;
  totalCount: number;
}

export function ProgressCard({ completedCount, totalCount }: ProgressCardProps) {
  const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/50 sm:p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
          Progress
        </h2>
      </div>

      <div className="mt-4 flex flex-col items-center justify-center">
        <div className="relative flex items-center justify-center">
          {/* Mobile Size (Default) */}
          <svg className="h-32 w-32 -rotate-90 transform">
            <circle
              cx="64"
              cy="64"
              r="58"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              className="text-slate-100 dark:text-slate-800"
            />
            <circle
              cx="64"
              cy="64"
              r="58"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              strokeDasharray={`${2 * Math.PI * 58}`}
              strokeDashoffset={`${2 * Math.PI * 58 * (1 - progress / 100)}`}
              className="text-blue-500 transition-all duration-500 ease-out"
              strokeLinecap="round"
            />
          </svg>
          
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold text-slate-900 dark:text-slate-100">
              {progress}%
            </span>
            <span className="text-xs font-medium text-muted-foreground mt-1">
              {completedCount} of {totalCount}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
