/**
 * FRIDAY DESIGN SYSTEM - BUTTON COMPONENT
 * 
 * Variants:
 * - default (Primary): Yellow-500 background, Slate-900 text, for main CTAs (use sparingly!)
 * - secondary/outline: White background, Slate-200 border, Slate-700 text
 * - ghost: Transparent, Slate-600 text, hover Slate-100
 * - destructive: Red-600 background, white text
 * - link: Blue underlined text
 * 
 * Features:
 * - Hover: Scale 1.02 + lighter background
 * - Active: Scale 0.98
 * - Focus: Blue-500 ring (3px) for accessibility
 * - Disabled: 50% opacity, no pointer events
 * 
 * Sizes:
 * - sm: 8px 16px padding
 * - default: 10px 20px padding
 * - lg: 12px 24px padding
 * - icon variants: Square buttons with no scale effect
 * 
 * @see /docs/DESIGN_SYSTEM_IMPLEMENTATION.md
 */

import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all duration-150 ease-out disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:border-ring aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive hover:scale-[1.02] active:scale-[0.98]",
  {
    variants: {
      variant: {
        // Primary variant: Yellow-500 background, Slate-900 text, subtle shadow
        default: 'bg-yellow-500 text-slate-900 shadow-sm hover:bg-yellow-400 dark:bg-yellow-400 dark:hover:bg-yellow-500',
        // Secondary variant: White background, Slate-200 border, Slate-700 text
        secondary: 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-100 dark:border-slate-700 dark:hover:bg-slate-700',
        // Outline variant (alias for secondary for backward compatibility)
        outline: 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-100 dark:border-slate-700 dark:hover:bg-slate-700',
        // Ghost variant: Transparent, Slate-600 text, hover Slate-100
        ghost: 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800',
        // Destructive variant: Red-600 background, white text
        destructive: 'bg-red-600 text-white hover:bg-red-500 focus-visible:ring-red-500/50 dark:bg-red-600 dark:hover:bg-red-500',
        // Link variant: underlined text
        link: 'text-blue-600 underline-offset-4 hover:underline dark:text-blue-400',
      },
      size: {
        // sm: 8px 16px (h-8 gives ~32px height, px-4 gives 16px horizontal)
        sm: 'h-8 px-4 py-2 text-sm has-[>svg]:px-3',
        // default/md: 10px 20px (h-9 gives ~36px height, px-5 gives 20px horizontal)
        default: 'h-9 px-5 py-2.5 has-[>svg]:px-4',
        // lg: 12px 24px (h-10 gives ~40px height, px-6 gives 24px horizontal)
        lg: 'h-10 px-6 py-3 has-[>svg]:px-5',
        // Icon sizes (no scale on hover for icon-only buttons)
        icon: 'size-9 hover:scale-100',
        'icon-sm': 'size-8 hover:scale-100',
        'icon-lg': 'size-10 hover:scale-100',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : 'button'

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
