import * as React from 'react'

import { cn } from '@/lib/utils'

function Textarea({ className, ...props }: React.ComponentProps<'textarea'>) {
  return (
    <textarea
      className={cn(
        'w-full min-w-0 rounded-md border px-4 py-3 min-h-[88px] text-base outline-none transition-[color,box-shadow] resize-y',
        'bg-white dark:bg-slate-800',
        'border-slate-200 dark:border-slate-700',
        'text-slate-800 dark:text-slate-100',
        'placeholder:text-slate-400',
        'selection:bg-primary selection:text-primary-foreground',
        'focus-visible:border-blue-500 focus-visible:border-2 focus-visible:ring-blue-500/50 focus-visible:ring-[3px]',
        'disabled:bg-slate-100 dark:disabled:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
        className,
      )}
      {...props}
    />
  )
}

export { Textarea }

