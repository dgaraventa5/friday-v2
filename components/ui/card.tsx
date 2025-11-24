import * as React from 'react'

import { cn } from '@/lib/utils'

type CardVariant = 'default' | 'elevated' | 'outlined'

interface CardProps extends React.ComponentProps<'div'> {
  variant?: CardVariant
  hover?: boolean
}

function Card({ className, variant = 'default', hover = false, ...props }: CardProps) {
  const variantStyles = {
    default: 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm',
    elevated: 'bg-white dark:bg-slate-800 shadow-lg',
    outlined: 'bg-transparent border-2 border-slate-300 dark:border-slate-600',
  }

  return (
    <div
      data-slot="card"
      className={cn(
        'flex flex-col gap-6 rounded-lg py-6 transition-all duration-[250ms] ease-out',
        variantStyles[variant],
        hover && 'hover:shadow-md hover:-translate-y-0.5 cursor-pointer',
        className,
      )}
      {...props}
    />
  )
}

function CardHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        '@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-2 px-6 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6',
        className,
      )}
      {...props}
    />
  )
}

function CardTitle({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-title"
      className={cn('leading-none font-semibold', className)}
      {...props}
    />
  )
}

function CardDescription({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-description"
      className={cn('text-slate-600 dark:text-slate-400 text-sm', className)}
      {...props}
    />
  )
}

function CardAction({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-action"
      className={cn(
        'col-start-2 row-span-2 row-start-1 self-start justify-self-end',
        className,
      )}
      {...props}
    />
  )
}

function CardContent({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-content"
      className={cn('px-6', className)}
      {...props}
    />
  )
}

function CardFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-footer"
      className={cn('flex items-center px-6 [.border-t]:pt-6', className)}
      {...props}
    />
  )
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
}
