'use client'

import * as React from 'react'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar'
import { PickersDay, PickersDayProps } from '@mui/x-date-pickers/PickersDay'
import dayjs, { Dayjs } from 'dayjs'
import 'dayjs/locale/en-gb' // UK locale starts week on Monday
import { cn } from '@/lib/utils'
import { ThemeProvider, createTheme } from '@mui/material/styles'

interface CalendarProps {
  selected?: Date
  onSelect?: (date: Date | undefined) => void
  disabled?: (date: Date) => boolean
  className?: string
  datesWithSessions?: string[]
}

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: 'hsl(var(--accent))',
    },
    background: {
      default: 'transparent',
      paper: 'transparent',
    },
  },
  components: {
    MuiPickersDay: {
      styleOverrides: {
        root: {
          color: 'hsl(var(--foreground))',
          fontVariantNumeric: 'tabular-nums',
          '&.Mui-selected': {
            backgroundColor: 'hsl(var(--accent))',
            color: 'hsl(var(--accent-foreground))',
            fontWeight: 500,
            '&:hover': {
              backgroundColor: 'hsl(var(--accent))',
            },
            '&:focus': {
              backgroundColor: 'hsl(var(--accent))',
            },
          },
          '&.Mui-disabled': {
            color: 'hsl(var(--muted-foreground) / 0.3)',
          },
          '&:hover': {
            backgroundColor: 'hsl(var(--muted))',
          },
        },
      },
    },
    MuiPickersCalendarHeader: {
      styleOverrides: {
        root: {
          paddingLeft: '16px',
          paddingRight: '16px',
          marginBottom: '8px',
        },
        label: {
          color: 'hsl(var(--foreground))',
          fontWeight: 600,
          fontSize: '0.875rem',
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          color: 'hsl(var(--muted-foreground))',
          '&:hover': {
            backgroundColor: 'hsl(var(--muted))',
            color: 'hsl(var(--foreground))',
          },
        },
      },
    },
    MuiDayCalendar: {
      styleOverrides: {
        header: {
          color: 'hsl(var(--muted-foreground))',
          fontWeight: 500,
          fontSize: '0.75rem',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        },
      },
    },
  },
} as any)

const daySx = {
  position: 'relative',
  fontSize: '0.875rem',
  width: '36px',
  height: '36px',
  borderRadius: '6px',
}

const dayRootSx = {
  '& .MuiPickersDay-root': {
    fontSize: '0.875rem',
    width: '36px',
    height: '36px',
    borderRadius: '6px',
  },
}

function useSessionDot(datesWithSessions: string[]) {
  const sessionSet = React.useMemo(() => new Set(datesWithSessions), [datesWithSessions])

  return React.useCallback((props: PickersDayProps) => {
    const { day, ...other } = props
    const hasSessions = sessionSet.has(day.format('YYYY-MM-DD'))

    return (
      <PickersDay
        {...other}
        day={day}
        sx={{
          ...daySx,
          '&::after': hasSessions
            ? {
                content: '""',
                position: 'absolute',
                bottom: '4px',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '4px',
                height: '4px',
                borderRadius: '50%',
                backgroundColor: 'hsl(var(--accent))',
              }
            : {},
        }}
      />
    )
  }, [sessionSet])
}

function Calendar({ selected, onSelect, disabled, className, datesWithSessions = [] }: CalendarProps) {
  const [value, setValue] = React.useState<Dayjs | null>(
    selected ? dayjs(selected) : null
  )

  React.useEffect(() => {
    if (selected) {
      setValue(dayjs(selected))
    }
  }, [selected])

  const handleChange = (newValue: Dayjs | null) => {
    if (!newValue) return
    setValue(newValue)
    onSelect?.(newValue.toDate())
  }

  const shouldDisableDate = (date: Dayjs) => {
    if (!disabled) return false
    return disabled(date.toDate())
  }

  const CustomDay = useSessionDot(datesWithSessions)

  return (
    <ThemeProvider theme={theme}>
      <div className={cn(className)}>
        <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="en-gb">
          <DateCalendar
            value={value}
            onChange={handleChange}
            shouldDisableDate={shouldDisableDate}
            showDaysOutsideCurrentMonth={false}
            slots={{ day: CustomDay }}
            sx={{ width: 'auto', ...dayRootSx }}
          />
        </LocalizationProvider>
      </div>
    </ThemeProvider>
  )
}
Calendar.displayName = 'Calendar'

function DualCalendar({ selected, onSelect, disabled, className, datesWithSessions = [] }: CalendarProps) {
  const [displayMonth, setDisplayMonth] = React.useState<Dayjs>(() => {
    if (selected) return dayjs(selected).startOf('month')
    return dayjs().startOf('month')
  })

  const rightMonth = displayMonth.add(1, 'month')
  const selectedValue = selected ? dayjs(selected) : null

  const currentMonth = React.useMemo(() => dayjs().startOf('month'), [])
  const canGoBack = displayMonth.isAfter(currentMonth)

  const leftValue = selectedValue?.isSame(displayMonth, 'month') ? selectedValue : null
  const rightValue = selectedValue?.isSame(rightMonth, 'month') ? selectedValue : null

  const handleChange = React.useCallback((newValue: Dayjs | null) => {
    if (!newValue) return
    onSelect?.(newValue.toDate())
  }, [onSelect])

  const shouldDisableDate = React.useCallback((date: Dayjs) => {
    if (!disabled) return false
    return disabled(date.toDate())
  }, [disabled])

  const CustomDay = useSessionDot(datesWithSessions)

  const calSx = {
    width: 'auto',
    maxHeight: 'none',
    '& .MuiPickersCalendarHeader-root': { display: 'none' },
    '& .MuiDayCalendar-slideTransition': { minHeight: 240 },
    ...dayRootSx,
  }

  return (
    <ThemeProvider theme={theme}>
      <div className={cn(className)}>
        <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="en-gb">
          <div className="flex items-center px-3 pt-1 pb-2">
            <button
              type="button"
              onClick={() => setDisplayMonth(m => m.subtract(1, 'month'))}
              className={cn(
                'w-7 h-7 rounded-full flex items-center justify-center transition-colors',
                canGoBack
                  ? 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  : 'opacity-0 pointer-events-none'
              )}
              aria-label="Previous month"
            >
              <svg className="w-4 h-4" aria-hidden="true" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="m15 18-6-6 6-6" /></svg>
            </button>

            <div className="flex flex-1">
              <span className="flex-1 text-center text-sm font-semibold text-foreground">
                {displayMonth.format('MMMM YYYY')}
              </span>
              <span className="flex-1 text-center text-sm font-semibold text-foreground">
                {rightMonth.format('MMMM YYYY')}
              </span>
            </div>

            <button
              type="button"
              onClick={() => setDisplayMonth(m => m.add(1, 'month'))}
              className="w-7 h-7 rounded-full flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              aria-label="Next month"
            >
              <svg className="w-4 h-4" aria-hidden="true" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="m9 18 6-6-6-6" /></svg>
            </button>
          </div>

          <div className="flex gap-4">
            <DateCalendar
              key={`l-${displayMonth.format('YYYY-MM')}`}
              value={leftValue}
              referenceDate={displayMonth}
              onChange={handleChange}
              shouldDisableDate={shouldDisableDate}
              showDaysOutsideCurrentMonth={false}
              slots={{ day: CustomDay }}
              sx={calSx}
            />
            <DateCalendar
              key={`r-${rightMonth.format('YYYY-MM')}`}
              value={rightValue}
              referenceDate={rightMonth}
              onChange={handleChange}
              shouldDisableDate={shouldDisableDate}
              showDaysOutsideCurrentMonth={false}
              slots={{ day: CustomDay }}
              sx={calSx}
            />
          </div>
        </LocalizationProvider>
      </div>
    </ThemeProvider>
  )
}
DualCalendar.displayName = 'DualCalendar'

// ── Range calendar (rental date picking) ──────────────────────────────

interface RangeCalendarProps {
  rangeStart?: Date
  rangeEnd?: Date
  onRangeChange?: (start: Date | undefined, end: Date | undefined) => void
  disabled?: (date: Date) => boolean
  className?: string
  minDays?: number
  maxDays?: number
}

function useRangeState(
  rangeStartProp: Date | undefined,
  rangeEndProp: Date | undefined,
  onRangeChange: ((start: Date | undefined, end: Date | undefined) => void) | undefined,
  disabled: ((date: Date) => boolean) | undefined,
  minDays: number,
  maxDays: number,
) {
  const [start, setStart] = React.useState<Dayjs | null>(rangeStartProp ? dayjs(rangeStartProp) : null)
  const [end, setEnd] = React.useState<Dayjs | null>(rangeEndProp ? dayjs(rangeEndProp) : null)
  const [hoverDate, setHoverDate] = React.useState<Dayjs | null>(null)

  React.useEffect(() => {
    setStart(rangeStartProp ? dayjs(rangeStartProp) : null)
  }, [rangeStartProp])

  React.useEffect(() => {
    setEnd(rangeEndProp ? dayjs(rangeEndProp) : null)
  }, [rangeEndProp])

  const handleDayClick = React.useCallback((newValue: Dayjs | null) => {
    if (!newValue) return

    if (!start || end) {
      setStart(newValue)
      setEnd(null)
      setHoverDate(null)
      onRangeChange?.(newValue.toDate(), undefined)
      return
    }

    if (newValue.isSame(start, 'day')) {
      setStart(null)
      setEnd(null)
      setHoverDate(null)
      onRangeChange?.(undefined, undefined)
    } else if (newValue.isBefore(start, 'day')) {
      setStart(newValue)
      setEnd(null)
      setHoverDate(null)
      onRangeChange?.(newValue.toDate(), undefined)
    } else {
      setEnd(newValue)
      setHoverDate(null)
      onRangeChange?.(start.toDate(), newValue.toDate())
    }
  }, [start, end, onRangeChange])

  const shouldDisableDate = React.useCallback((date: Dayjs) => {
    if (disabled?.(date.toDate())) return true
    if (start && !end) {
      const diff = date.diff(start, 'day')
      if (diff > 0 && (diff + 1 < minDays || diff + 1 > maxDays)) return true
    }
    return false
  }, [disabled, start, end, minDays, maxDays])

  const clearHover = React.useCallback(() => setHoverDate(null), [])
  const RangeDay = useRangeDay(start, end, hoverDate, setHoverDate)

  return { start, end, handleDayClick, shouldDisableDate, clearHover, RangeDay }
}

function useRangeDay(
  rangeStart: Dayjs | null,
  rangeEnd: Dayjs | null,
  hoverDate: Dayjs | null,
  setHoverDate: (day: Dayjs | null) => void,
) {
  return React.useCallback(
    (props: PickersDayProps) => {
      const { day, outsideCurrentMonth, selected: _sel, ...rest } = props

      if (outsideCurrentMonth) {
        return <PickersDay {...rest} day={day} outsideCurrentMonth selected={false} sx={{ ...daySx, visibility: 'hidden' }} />
      }

      const effectiveEnd = rangeEnd ?? (
        rangeStart && hoverDate && hoverDate.isAfter(rangeStart, 'day') ? hoverDate : null
      )
      const isPreview = !rangeEnd && !!effectiveEnd

      const isStart = !!rangeStart && day.isSame(rangeStart, 'day')
      const isEnd = !!effectiveEnd && day.isSame(effectiveEnd, 'day')
      const isEndpoint = isStart || isEnd

      const inRange =
        !!rangeStart &&
        !!effectiveEnd &&
        day.isAfter(rangeStart, 'day') &&
        day.isBefore(effectiveEnd, 'day')

      return (
        <PickersDay
          {...rest}
          day={day}
          outsideCurrentMonth={false}
          selected={false}
          onMouseEnter={() => { if (!rest.disabled) setHoverDate(day) }}
          sx={{
            ...daySx,
            ...(isEndpoint && {
              backgroundColor: 'hsl(var(--accent)) !important',
              color: 'hsl(var(--accent-foreground)) !important',
              fontWeight: 500,
              '&:hover': { backgroundColor: 'hsl(var(--accent)) !important' },
              '&:focus': { backgroundColor: 'hsl(var(--accent)) !important' },
            }),
            ...(inRange && !isEndpoint && {
              backgroundColor: isPreview ? 'hsl(var(--accent) / 0.08)' : 'hsl(var(--accent) / 0.12)',
              '&:hover': { backgroundColor: 'hsl(var(--accent) / 0.2)' },
            }),
          }}
        />
      )
    },
    [rangeStart, rangeEnd, hoverDate, setHoverDate],
  )
}

function RangeCalendar({
  rangeStart: rangeStartProp,
  rangeEnd: rangeEndProp,
  onRangeChange,
  disabled,
  className,
  minDays = 1,
  maxDays = 365,
}: RangeCalendarProps) {
  const { handleDayClick, shouldDisableDate, clearHover, RangeDay } = useRangeState(
    rangeStartProp, rangeEndProp, onRangeChange, disabled, minDays, maxDays,
  )

  return (
    <ThemeProvider theme={theme}>
      <div className={cn(className)} onMouseLeave={clearHover}>
        <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="en-gb">
          <DateCalendar
            value={null}
            onChange={handleDayClick}
            shouldDisableDate={shouldDisableDate}
            showDaysOutsideCurrentMonth={false}
            slots={{ day: RangeDay }}
            sx={{ width: 'auto', ...dayRootSx }}
          />
        </LocalizationProvider>
      </div>
    </ThemeProvider>
  )
}
RangeCalendar.displayName = 'RangeCalendar'

function DualRangeCalendar({
  rangeStart: rangeStartProp,
  rangeEnd: rangeEndProp,
  onRangeChange,
  disabled,
  className,
  minDays = 1,
  maxDays = 365,
}: RangeCalendarProps) {
  const [displayMonth, setDisplayMonth] = React.useState<Dayjs>(() => {
    if (rangeStartProp) return dayjs(rangeStartProp).startOf('month')
    return dayjs().startOf('month')
  })
  const rightMonth = displayMonth.add(1, 'month')

  const currentMonth = React.useMemo(() => dayjs().startOf('month'), [])
  const canGoBack = displayMonth.isAfter(currentMonth)

  const { handleDayClick, shouldDisableDate, clearHover, RangeDay } = useRangeState(
    rangeStartProp, rangeEndProp, onRangeChange, disabled, minDays, maxDays,
  )

  const calSx = {
    width: 'auto',
    maxHeight: 'none',
    '& .MuiPickersCalendarHeader-root': { display: 'none' },
    '& .MuiDayCalendar-slideTransition': { minHeight: 240 },
    ...dayRootSx,
  }

  return (
    <ThemeProvider theme={theme}>
      <div className={cn(className)} onMouseLeave={clearHover}>
        <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="en-gb">
          <div className="flex items-center px-3 pt-1 pb-2">
            <button
              type="button"
              onClick={() => setDisplayMonth(m => m.subtract(1, 'month'))}
              className={cn(
                'w-7 h-7 rounded-full flex items-center justify-center transition-colors',
                canGoBack
                  ? 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  : 'opacity-0 pointer-events-none'
              )}
              aria-label="Previous month"
            >
              <svg className="w-4 h-4" aria-hidden="true" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="m15 18-6-6 6-6" /></svg>
            </button>

            <div className="flex flex-1">
              <span className="flex-1 text-center text-sm font-semibold text-foreground">
                {displayMonth.format('MMMM YYYY')}
              </span>
              <span className="flex-1 text-center text-sm font-semibold text-foreground">
                {rightMonth.format('MMMM YYYY')}
              </span>
            </div>

            <button
              type="button"
              onClick={() => setDisplayMonth(m => m.add(1, 'month'))}
              className="w-7 h-7 rounded-full flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              aria-label="Next month"
            >
              <svg className="w-4 h-4" aria-hidden="true" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="m9 18 6-6-6-6" /></svg>
            </button>
          </div>

          <div className="flex gap-4">
            <DateCalendar
              key={`rl-${displayMonth.format('YYYY-MM')}`}
              value={null}
              referenceDate={displayMonth}
              onChange={handleDayClick}
              shouldDisableDate={shouldDisableDate}
              showDaysOutsideCurrentMonth={false}
              slots={{ day: RangeDay }}
              sx={calSx}
            />
            <DateCalendar
              key={`rr-${rightMonth.format('YYYY-MM')}`}
              value={null}
              referenceDate={rightMonth}
              onChange={handleDayClick}
              shouldDisableDate={shouldDisableDate}
              showDaysOutsideCurrentMonth={false}
              slots={{ day: RangeDay }}
              sx={calSx}
            />
          </div>
        </LocalizationProvider>
      </div>
    </ThemeProvider>
  )
}
DualRangeCalendar.displayName = 'DualRangeCalendar'

export { Calendar, DualCalendar, RangeCalendar, DualRangeCalendar }
