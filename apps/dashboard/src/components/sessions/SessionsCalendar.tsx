import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CalendarDay } from './CalendarDay';
import { DayTimeView } from './DayTimeView';
import { WeekTimeView } from './WeekTimeView';
import { SessionCreatePopup } from './SessionCreatePopup';
import type { Experience } from '@/hooks/useExperienceSessions';
import { AvailabilityRule } from '@/lib/availability';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  addDays,
  subDays,
} from 'date-fns';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface SessionData {
  single: true;
  experienceId: string;
  date: string;
  time: string;
  spotsTotal: number;
  spotsAvailable: number;
  priceOverrideCents: number | null;
  priceNote: string | null;
}

interface RecurringData {
  experienceId: string;
  startDate: string;
  endDate: string;
  time: string;
  spots: number;
  frequency: 'daily' | 'weekly';
  priceOverrideCents: number | null;
  priceNote: string | null;
}

interface SessionsCalendarProps {
  sessions: any[];
  sessionsByDate: Record<string, any[]>;
  experience: Experience | null;
  experiences?: Array<{ id: string; title: string; duration_minutes: number; max_participants?: number; price_cents?: number }>;
  currentMonth: Date;
  onMonthChange: (date: Date) => void;
  onCreateSession: (data: SessionData | RecurringData) => void;
  onDayClick?: (date: Date) => void;
  showExperienceTitle?: boolean;
  availabilityRules?: AvailabilityRule[];
  onSessionClick?: (sessionId: string) => void;
  onSessionUpdate?: () => void;
}

export function SessionsCalendar({
  sessionsByDate,
  currentMonth,
  onMonthChange,
  onCreateSession,
  onDayClick,
  showExperienceTitle = false,
  availabilityRules = [],
  experiences = [],
  onSessionClick,
  onSessionUpdate,
}: SessionsCalendarProps) {
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');
  const [selectedDay, setSelectedDay] = useState<Date>(new Date());
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [quickAddDate, setQuickAddDate] = useState<Date | undefined>();
  const [quickAddTime, setQuickAddTime] = useState<string | undefined>();
  const [quickAddPosition, setQuickAddPosition] = useState<{ x: number; y: number } | undefined>();

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  // For week view
  const weekStart = startOfWeek(currentMonth, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentMonth, { weekStartsOn: 1 });

  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const handlePrevious = () => {
    if (viewMode === 'month') {
      onMonthChange(subMonths(currentMonth, 1));
    } else if (viewMode === 'week') {
      onMonthChange(subWeeks(currentMonth, 1));
    } else {
      const newDay = subDays(selectedDay, 1);
      setSelectedDay(newDay);
      onMonthChange(newDay);
    }
  };
  
  const handleNext = () => {
    if (viewMode === 'month') {
      onMonthChange(addMonths(currentMonth, 1));
    } else if (viewMode === 'week') {
      onMonthChange(addWeeks(currentMonth, 1));
    } else {
      const newDay = addDays(selectedDay, 1);
      setSelectedDay(newDay);
      onMonthChange(newDay);
    }
  };
  
  const handleToday = () => {
    const today = new Date();
    setSelectedDay(today);
    onMonthChange(today);
  };

  const handleViewModeChange = (newMode: 'month' | 'week' | 'day') => {
    setViewMode(newMode);
    // If switching to day view without a selected day, use current date
    if (newMode === 'day' && !selectedDay) {
      setSelectedDay(currentMonth);
    }
  };

  const handleDayClick = (date: Date) => {
    // Clicking a day in month view switches to day view
    setSelectedDay(date);
    setViewMode('day');
    onMonthChange(date);
    if (onDayClick) {
      onDayClick(date);
    }
  };

  const handleTimeSlotClick = (date: Date, time: string, position?: { x: number; y: number }) => {
    setQuickAddDate(date);
    setQuickAddTime(time);
    if (position) {
      setQuickAddPosition(position);
    }
    setQuickAddOpen(true);
  };

  const handleCreateSession = (data: SessionData | RecurringData) => {
    onCreateSession(data);
    setQuickAddOpen(false);
  };

  const getDaySessions = (date: Date) => {
    try {
      const dateKey = format(date, 'yyyy-MM-dd');
      return sessionsByDate?.[dateKey] || [];
    } catch (error) {
      console.error('Error getting day sessions:', error);
      return [];
    }
  };

  // Always show month and year
  const getHeaderTitle = () => {
    return format(currentMonth, 'MMMM yyyy');
  };

  if (!sessionsByDate || !currentMonth) {
    return (
      <div className="bg-card rounded-xl p-4 border border-border">
        <p className="text-muted-foreground">Loading calendar...</p>
      </div>
    );
  }

  try {
    return (
      <>
        <div className="bg-card rounded-xl p-4 shadow-sm border border-border">
          {/* Calendar Header - Navigation */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">
              {getHeaderTitle()}
            </h2>
            <div className="flex items-center gap-2">
              <Tabs value={viewMode} onValueChange={(v) => handleViewModeChange(v as 'month' | 'week' | 'day')}>
                <TabsList className="h-7">
                  <TabsTrigger value="month" className="text-xs">Month</TabsTrigger>
                  <TabsTrigger value="week" className="text-xs">Week</TabsTrigger>
                  <TabsTrigger value="day" className="text-xs">Day</TabsTrigger>
                </TabsList>
              </Tabs>
              <Button variant="ghost" size="sm" onClick={handlePrevious} className="h-7 w-7 p-0">
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={handleToday} className="h-7 px-3 text-xs">
                Today
              </Button>
              <Button variant="ghost" size="sm" onClick={handleNext} className="h-7 w-7 p-0">
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Calendar Content */}
          {viewMode === 'month' && (
            <>
              {/* Weekday Headers */}
              <div className="grid grid-cols-7 gap-px mb-px">
                {weekdays.map((day) => (
                  <div
                    key={day}
                    className="text-center text-xs font-medium text-muted-foreground py-2"
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-px bg-border rounded overflow-hidden">
                {calendarDays.map((day) => {
                  const dateKey = format(day, 'yyyy-MM-dd');
                  const daySessions = getDaySessions(day) || [];

                  return (
                    <CalendarDay
                      key={dateKey}
                      date={day}
                      sessions={daySessions}
                      totalSessionCount={daySessions.length}
                      currentMonth={currentMonth}
                      onAddSession={() => {}}
                      onDayClick={handleDayClick}
                      showExperienceTitle={showExperienceTitle}
                      availabilityRules={availabilityRules || []}
                    />
                  );
                })}
              </div>
            </>
          )}

          {viewMode === 'week' && (
            <WeekTimeView
              currentDate={currentMonth}
              sessionsByDate={sessionsByDate}
              experiences={experiences}
              onTimeSlotClick={handleTimeSlotClick}
              onSessionClick={onSessionClick}
              showExperienceTitle={showExperienceTitle}
              onSessionUpdate={onSessionUpdate}
            />
          )}

          {viewMode === 'day' && (
            <DayTimeView
              date={selectedDay}
              sessions={getDaySessions(selectedDay)}
              experiences={experiences}
              onTimeSlotClick={handleTimeSlotClick}
              onSessionClick={onSessionClick}
              showExperienceTitle={showExperienceTitle}
              onSessionUpdate={onSessionUpdate}
            />
          )}
        </div>

        {/* Session Create Popup */}
        {quickAddOpen && experiences.length > 0 && (
          <SessionCreatePopup
            isOpen={quickAddOpen}
            onClose={() => setQuickAddOpen(false)}
            initialDate={quickAddDate}
            initialTime={quickAddTime}
            position={quickAddPosition}
            experiences={experiences.map(e => ({
              id: e.id,
              title: e.title,
              description: '',
              duration_minutes: e.duration_minutes,
              max_participants: e.max_participants || 8,
              price_cents: e.price_cents || 0,
              partner_id: '',
            }))}
            onSubmit={handleCreateSession}
          />
        )}
      </>
    );
  } catch (error) {
    console.error('Error rendering SessionsCalendar:', error);
    return (
      <div className="bg-card rounded-xl p-4 border border-border">
        <p className="text-destructive">Error loading calendar. Please refresh the page.</p>
      </div>
    );
  }
}
