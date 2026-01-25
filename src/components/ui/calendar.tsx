'use client'

import * as React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { DayPicker } from 'react-day-picker'
import { enGB } from 'date-fns/locale'
import { cn } from '@/lib/utils'

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({ className, classNames, showOutsideDays = true, ...props }: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      locale={enGB}
      weekStartsOn={1}
      className={cn('p-3 pointer-events-auto select-none', className)}
      classNames={{
        // v9 class names
        months: 'flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0',
        month: 'space-y-4',
        month_caption: 'flex justify-center pt-1 relative items-center',
        caption_label: 'text-sm font-medium text-foreground',
        nav: 'space-x-1 flex items-center',
        button_previous: cn(
          'absolute left-1 h-7 w-7 bg-transparent p-0 inline-flex items-center justify-center',
          'border border-border rounded-md text-muted-foreground',
          'hover:bg-muted hover:text-foreground transition-colors',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent'
        ),
        button_next: cn(
          'absolute right-1 h-7 w-7 bg-transparent p-0 inline-flex items-center justify-center',
          'border border-border rounded-md text-muted-foreground',
          'hover:bg-muted hover:text-foreground transition-colors',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent'
        ),
        // Grid structure
        month_grid: 'w-full border-collapse space-y-1',
        weekdays: 'flex',
        weekday: 'text-muted-foreground rounded-md w-9 font-normal text-[0.8rem] text-center',
        week: 'flex w-full mt-2',
        day: 'h-9 w-9 text-center text-sm p-0 relative focus-within:relative focus-within:z-20',
        day_button: cn(
          'h-9 w-9 p-0 font-normal inline-flex items-center justify-center rounded-md',
          'hover:bg-muted text-foreground transition-colors',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent',
          'aria-selected:opacity-100'
        ),
        // States
        selected: 'bg-accent text-accent-foreground hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground',
        today: 'bg-muted text-foreground font-semibold',
        outside: 'text-muted-foreground/40 aria-selected:bg-accent/50 aria-selected:text-muted-foreground/40',
        disabled: 'text-muted-foreground/30 cursor-not-allowed',
        range_middle: 'aria-selected:bg-accent aria-selected:text-accent-foreground',
        hidden: 'invisible',
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation }) => {
          if (orientation === 'left') {
            return <ChevronLeft className="h-4 w-4" />
          }
          return <ChevronRight className="h-4 w-4" />
        },
      }}
      {...props}
    />
  )
}
Calendar.displayName = 'Calendar'

export { Calendar }
