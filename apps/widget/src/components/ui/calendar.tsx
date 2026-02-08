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
  datesWithSessions?: string[] // Array of date strings in YYYY-MM-DD format
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
    setValue(newValue)
    if (onSelect) {
      onSelect(newValue ? newValue.toDate() : undefined)
    }
  }

  const shouldDisableDate = (date: Dayjs) => {
    if (!disabled) return false
    return disabled(date.toDate())
  }

  // Custom day component with dot indicator
  const CustomDay = React.useCallback((props: PickersDayProps) => {
    const { day, ...other } = props
    const dateKey = day.format('YYYY-MM-DD')
    const hasSessions = datesWithSessions.includes(dateKey)

    return (
      <PickersDay
        {...other}
        day={day}
        sx={{
          position: 'relative',
          fontSize: '0.875rem',
          width: '36px',
          height: '36px',
          borderRadius: '6px',
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
  }, [datesWithSessions])

  return (
    <ThemeProvider theme={theme}>
      <div className={cn('w-full', className)}>
        <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="en-gb">
          <DateCalendar
            value={value}
            onChange={handleChange}
            shouldDisableDate={shouldDisableDate}
            showDaysOutsideCurrentMonth={false}
            slots={{
              day: CustomDay,
            }}
            sx={{
              width: '100%',
              '& .MuiPickersDay-root': {
                fontSize: '0.875rem',
                width: '36px',
                height: '36px',
                borderRadius: '6px',
              },
            }}
          />
        </LocalizationProvider>
      </div>
    </ThemeProvider>
  )
}
Calendar.displayName = 'Calendar'

export { Calendar }
