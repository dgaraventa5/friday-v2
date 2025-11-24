'use client'

import * as React from 'react'
import * as CheckboxPrimitive from '@radix-ui/react-checkbox'
import { CheckIcon } from 'lucide-react'

import { cn } from '@/lib/utils'

function Checkbox({
  className,
  ...props
}: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        'peer size-5 shrink-0 rounded-[4px] border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 outline-none transition-all duration-150',
        'hover:scale-105',
        'focus-visible:border-blue-500 focus-visible:ring-[3px] focus-visible:ring-blue-500/50',
        'data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500 data-[state=checked]:text-white',
        'aria-invalid:border-red-500 aria-invalid:ring-[3px] aria-invalid:ring-red-500/20',
        'disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100',
        className,
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="flex items-center justify-center text-current"
      >
        <CheckIcon className="size-4 animate-checkbox-check" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
}

export { Checkbox }
