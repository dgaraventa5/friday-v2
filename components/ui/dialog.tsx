'use client'

import * as React from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { XIcon } from 'lucide-react'

import { cn } from '@/lib/utils'

function Dialog({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Root>) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />
}

function DialogTrigger({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />
}

function DialogPortal({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Portal>) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />
}

function DialogClose({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Close>) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />
}

function DialogOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      data-slot="dialog-overlay"
      className={cn(
        'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50 backdrop-blur-sm',
        className,
      )}
      {...props}
    />
  )
}

function DialogContent({
  className,
  children,
  showCloseButton = true,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
  showCloseButton?: boolean
}) {
  // Check if this is a bottom sheet (dialog-sheet class) for mobile
  const isBottomSheet = className?.includes('dialog-sheet')
  
  return (
    <DialogPortal data-slot="dialog-portal">
      <DialogOverlay />
      <DialogPrimitive.Content
        data-slot="dialog-content"
        className={cn(
          'bg-white dark:bg-slate-800 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed z-50 w-full',
          // Mobile (sheet style)
          isBottomSheet && 'bottom-0 left-0 right-0 rounded-t-3xl p-6 pb-safe max-h-[85vh] overflow-y-auto',
          isBottomSheet && 'data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom duration-300',
          // Desktop (center modal)
          isBottomSheet && 'md:top-[50%] md:left-[50%] md:bottom-auto md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-2xl md:p-8 md:max-w-[480px] md:max-h-none md:shadow-2xl',
          // Non-sheet dialogs (standard centered)
          !isBottomSheet && 'top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 rounded-2xl p-8 max-w-[480px] shadow-2xl',
          !isBottomSheet && 'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 duration-200',
          className,
        )}
        {...props}
      >
        {/* Drag handle for mobile sheet */}
        {isBottomSheet && (
          <div className="md:hidden absolute top-3 left-1/2 -translate-x-1/2 w-8 h-1 bg-slate-300 dark:bg-slate-600 rounded-full" />
        )}
        {children}
        {showCloseButton && (
          <DialogPrimitive.Close
            data-slot="dialog-close"
            className="absolute top-4 right-4 w-8 h-8 rounded-md opacity-70 transition-opacity hover:opacity-100 hover:bg-slate-100 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:pointer-events-none flex items-center justify-center"
          >
            <XIcon className="h-4 w-4 text-slate-600 dark:text-slate-400" />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DialogPortal>
  )
}

function DialogHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="dialog-header"
      className={cn('flex flex-col gap-2 text-left mb-6', className)}
      {...props}
    />
  )
}

function DialogFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        'flex flex-col gap-3 md:flex-row md:justify-end md:gap-3 pt-6',
        className,
      )}
      {...props}
    />
  )
}

function DialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn('text-2xl font-semibold text-slate-800 dark:text-slate-100', className)}
      {...props}
    />
  )
}

function DialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn('text-base text-slate-600 dark:text-slate-400', className)}
      {...props}
    />
  )
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
}
