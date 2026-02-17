'use client'

import * as React from 'react'
import * as SliderPrimitive from '@radix-ui/react-slider'
import { cn } from '@/lib/utils'

interface SliderProps extends React.ComponentProps<typeof SliderPrimitive.Root> {
  accentColor?: string
}

function Slider({ className, accentColor, ...props }: SliderProps) {
  return (
    <SliderPrimitive.Root
      data-slot="slider"
      className={cn(
        'relative flex w-full touch-none select-none items-center',
        className,
      )}
      {...props}
    >
      <SliderPrimitive.Track
        data-slot="slider-track"
        className="relative h-2 w-full grow overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700"
      >
        <SliderPrimitive.Range
          data-slot="slider-range"
          className={cn(
            'absolute h-full rounded-full',
            !accentColor && 'bg-gradient-to-r from-yellow-400 to-yellow-500',
          )}
          style={accentColor ? { backgroundColor: accentColor } : undefined}
        />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb
        data-slot="slider-thumb"
        className={cn(
          'block h-5 w-5 rounded-full bg-white shadow-md ring-0 transition-transform duration-150 ease-out',
          'hover:scale-110 hover:shadow-lg',
          'focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-yellow-500/50',
          'disabled:pointer-events-none disabled:opacity-50',
        )}
        style={{
          borderWidth: 2,
          borderStyle: 'solid',
          borderColor: accentColor || '#FDE047',
        }}
      />
    </SliderPrimitive.Root>
  )
}

export { Slider }
