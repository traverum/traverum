import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import {
  WEEKDAYS,
  MONTHS,
  getDaysForMonth,
  DEFAULT_WEEKDAYS,
  DEFAULT_START_TIME,
  DEFAULT_END_TIME,
} from '@/lib/availability';

interface AvailabilityEditorProps {
  weekdays: number[];
  startTime: string;
  endTime: string;
  validFrom: string | null; // MM-DD format
  validUntil: string | null; // MM-DD format
  onWeekdaysChange: (weekdays: number[]) => void;
  onStartTimeChange: (time: string) => void;
  onEndTimeChange: (time: string) => void;
  onValidFromChange: (date: string | null) => void;
  onValidUntilChange: (date: string | null) => void;
  disabled?: boolean;
}

// Generate time options in 30-minute increments
const TIME_OPTIONS = Array.from({ length: 48 }, (_, i) => {
  const hour = Math.floor(i / 2);
  const minute = (i % 2) * 30;
  const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  return { value: time, label: time };
});

function parseMonthDay(mmdd: string | null): { month: string; day: string } {
  if (!mmdd) return { month: '', day: '' };
  const [m, d] = mmdd.split('-');
  return { month: m || '', day: d || '' };
}

function toMonthDay(month: string, day: string): string | null {
  if (!month || !day) return null;
  return `${month}-${day}`;
}

export function AvailabilityEditor({
  weekdays,
  startTime,
  endTime,
  validFrom,
  validUntil,
  onWeekdaysChange,
  onStartTimeChange,
  onEndTimeChange,
  onValidFromChange,
  onValidUntilChange,
  disabled = false,
}: AvailabilityEditorProps) {
  const [hasSeason, setHasSeason] = useState(
    validFrom !== null || validUntil !== null
  );

  // Update hasSeason when props change
  useEffect(() => {
    setHasSeason(validFrom !== null || validUntil !== null);
  }, [validFrom, validUntil]);

  const toggleWeekday = (day: number) => {
    if (disabled) return;
    
    if (weekdays.includes(day)) {
      // Don't allow deselecting all days
      if (weekdays.length > 1) {
        onWeekdaysChange(weekdays.filter((d) => d !== day));
      }
    } else {
      onWeekdaysChange([...weekdays, day]);
    }
  };

  const handleSeasonToggle = (checked: boolean) => {
    setHasSeason(checked);
    if (!checked) {
      onValidFromChange(null);
      onValidUntilChange(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Available Days */}
      <div className="space-y-3">
        <Label>Available days</Label>
        <div className="flex flex-wrap gap-2">
          {WEEKDAYS.map((day) => {
            const isSelected = weekdays.includes(day.value);
            return (
              <button
                key={day.value}
                type="button"
                onClick={() => toggleWeekday(day.value)}
                disabled={disabled}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                  'border-2 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
                  isSelected
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background text-muted-foreground border-border hover:border-primary/50',
                  disabled && 'opacity-50 cursor-not-allowed'
                )}
              >
                {day.label}
              </button>
            );
          })}
        </div>
        <p className="text-xs text-muted-foreground">
          {weekdays.length === 7
            ? 'Available every day'
            : `Available ${weekdays.length} day${weekdays.length !== 1 ? 's' : ''} per week`}
        </p>
      </div>

      {/* Operating Hours */}
      <div className="space-y-3">
        <Label>Operating hours</Label>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="startTime" className="text-xs text-muted-foreground">
              From
            </Label>
            <Select
              value={startTime}
              onValueChange={onStartTimeChange}
              disabled={disabled}
            >
              <SelectTrigger id="startTime">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIME_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="endTime" className="text-xs text-muted-foreground">
              To
            </Label>
            <Select
              value={endTime}
              onValueChange={onEndTimeChange}
              disabled={disabled}
            >
              <SelectTrigger id="endTime">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIME_OPTIONS.filter((opt) => opt.value > startTime).map(
                  (option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  )
                )}
              </SelectContent>
            </Select>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Bookings can be scheduled between these hours
        </p>
      </div>

      {/* Seasonal Availability */}
      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="hasSeason"
            checked={hasSeason}
            onCheckedChange={handleSeasonToggle}
            disabled={disabled}
          />
          <Label htmlFor="hasSeason" className="font-medium cursor-pointer">
            Seasonal availability
          </Label>
        </div>

        {hasSeason && (
          <div className="pl-6 space-y-4">
            <SeasonDatePicker
              label="Season starts"
              value={validFrom}
              onChange={onValidFromChange}
              disabled={disabled}
            />
            <SeasonDatePicker
              label="Season ends"
              value={validUntil}
              onChange={onValidUntilChange}
              disabled={disabled}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function SeasonDatePicker({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: string | null;
  onChange: (val: string | null) => void;
  disabled?: boolean;
}) {
  const { month, day } = parseMonthDay(value);
  const dayOptions = getDaysForMonth(month);

  const handleMonthChange = (m: string) => {
    const maxDay = getDaysForMonth(m).length;
    let newDay = day || '01';
    if (parseInt(newDay) > maxDay) {
      newDay = maxDay.toString().padStart(2, '0');
    }
    onChange(toMonthDay(m, newDay));
  };

  const handleDayChange = (d: string) => {
    onChange(toMonthDay(month, d));
  };

  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <div className="grid grid-cols-2 gap-2">
        <Select value={month} onValueChange={handleMonthChange} disabled={disabled}>
          <SelectTrigger>
            <SelectValue placeholder="Month" />
          </SelectTrigger>
          <SelectContent>
            {MONTHS.map((m) => (
              <SelectItem key={m.value} value={m.value}>
                {m.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={day} onValueChange={handleDayChange} disabled={disabled || !month}>
          <SelectTrigger>
            <SelectValue placeholder="Day" />
          </SelectTrigger>
          <SelectContent>
            {dayOptions.map((d) => (
              <SelectItem key={d} value={d}>
                {parseInt(d)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

// Default values export for form initialization
export const defaultAvailability = {
  weekdays: DEFAULT_WEEKDAYS,
  startTime: DEFAULT_START_TIME,
  endTime: DEFAULT_END_TIME,
  validFrom: null as string | null,
  validUntil: null as string | null,
};
