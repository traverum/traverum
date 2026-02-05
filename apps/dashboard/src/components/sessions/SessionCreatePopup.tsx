import { useState, useEffect, useRef } from 'react';
import { format, addMonths } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { X, ChevronDown, Users, Euro, Repeat } from 'lucide-react';
import { cn } from '@/lib/utils';
import { generateRecurringSessions, type Experience } from '@/hooks/useExperienceSessions';

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

interface SessionCreatePopupProps {
  isOpen: boolean;
  onClose: () => void;
  initialDate?: Date;
  initialTime?: string;
  position?: { x: number; y: number };
  experiences: Experience[];
  onSubmit: (data: SessionData | RecurringData) => void;
}

function calculateEndTime(startTime: string, durationMinutes: number): string {
  const [hours, minutes] = startTime.split(':').map(Number);
  const totalMinutes = hours * 60 + minutes + durationMinutes;
  const endHours = Math.floor(totalMinutes / 60) % 24;
  const endMinutes = totalMinutes % 60;
  return `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
}

export function SessionCreatePopup({
  isOpen,
  onClose,
  initialDate,
  initialTime,
  position,
  experiences,
  onSubmit,
}: SessionCreatePopupProps) {
  const [experienceId, setExperienceId] = useState<string>('');
  const [date, setDate] = useState(format(initialDate || new Date(), 'yyyy-MM-dd'));
  const [startTime, setStartTime] = useState(initialTime || '09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [spots, setSpots] = useState(8);
  
  // Recurring
  const [isRecurring, setIsRecurring] = useState(false);
  const [frequency, setFrequency] = useState<'daily' | 'weekly'>('weekly');
  const [repeatEndDate, setRepeatEndDate] = useState(format(addMonths(new Date(), 1), 'yyyy-MM-dd'));
  
  // Advanced
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [customPrice, setCustomPrice] = useState('');
  
  const popupRef = useRef<HTMLDivElement>(null);
  const selectedExperience = experiences.find(e => e.id === experienceId);

  // Session count for recurring
  const sessionCount = isRecurring
    ? generateRecurringSessions({
        experienceId: experienceId || '',
        startDate: date,
        endDate: repeatEndDate,
        time: startTime,
        spots,
        frequency,
      }).length
    : 1;

  // Update end time when experience changes (use default duration)
  useEffect(() => {
    if (selectedExperience) {
      setSpots(selectedExperience.max_participants || 8);
      const duration = selectedExperience.duration_minutes || 60;
      setEndTime(calculateEndTime(startTime, duration));
    }
  }, [selectedExperience]);

  // Update end time when start time changes (maintain duration)
  const handleStartTimeChange = (newStartTime: string) => {
    if (selectedExperience) {
      const duration = selectedExperience.duration_minutes || 60;
      setEndTime(calculateEndTime(newStartTime, duration));
    }
    setStartTime(newStartTime);
  };

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      if (initialDate) setDate(format(initialDate, 'yyyy-MM-dd'));
      if (initialTime) {
        setStartTime(initialTime);
        // Calculate initial end time based on first experience or default 1hr
        const defaultDuration = experiences.length > 0 
          ? (experiences[0].duration_minutes || 60) 
          : 60;
        setEndTime(calculateEndTime(initialTime, defaultDuration));
      }
      if (experiences.length === 1) {
        setExperienceId(experiences[0].id);
        setSpots(experiences[0].max_participants || 8);
        const duration = experiences[0].duration_minutes || 60;
        setEndTime(calculateEndTime(initialTime || '09:00', duration));
      } else {
        setExperienceId('');
      }
      setShowAdvanced(false);
      setIsRecurring(false);
      setCustomPrice('');
    }
  }, [isOpen, initialDate, initialTime, experiences]);

  // Position popup
  useEffect(() => {
    if (isOpen && position && popupRef.current) {
      const popup = popupRef.current;
      const rect = popup.getBoundingClientRect();
      const vw = window.innerWidth;
      const vh = window.innerHeight;

      let x = position.x - 140;
      let y = position.y + 10;

      if (x + rect.width > vw - 16) x = vw - rect.width - 16;
      if (y + rect.height > vh - 16) y = position.y - rect.height - 10;
      if (x < 16) x = 16;
      if (y < 16) y = 16;

      popup.style.left = `${x}px`;
      popup.style.top = `${y}px`;
    }
  }, [isOpen, position, showAdvanced, isRecurring]);

  // Escape to close
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!experienceId) return;

    const priceOverrideCents = customPrice
      ? Math.round(parseFloat(customPrice) * 100)
      : null;

    if (isRecurring) {
      onSubmit({
        experienceId,
        startDate: date,
        endDate: repeatEndDate,
        time: startTime,
        spots,
        frequency,
        priceOverrideCents,
        priceNote: null,
      });
    } else {
      onSubmit({
        single: true,
        experienceId,
        date,
        time: startTime,
        spotsTotal: spots,
        spotsAvailable: spots,
        priceOverrideCents,
        priceNote: null,
      });
    }
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      
      <div
        ref={popupRef}
        className="fixed z-50 w-72 bg-background border border-border/50 rounded-2xl shadow-2xl overflow-hidden"
        style={{
          left: position?.x || '50%',
          top: position?.y || '50%',
          transform: position ? 'none' : 'translate(-50%, -50%)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-muted/30 border-b border-border/30">
          <span className="font-medium text-sm">New Session</span>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-6 w-6 p-0 rounded-full">
            <X className="w-3.5 h-3.5" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-3 space-y-3">
          {/* Experience */}
          <Select value={experienceId} onValueChange={setExperienceId} required>
            <SelectTrigger className="h-9 rounded-lg bg-muted/30 border-border/40">
              <SelectValue placeholder="Select experience" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              {experiences.map((exp) => (
                <SelectItem key={exp.id} value={exp.id} className="rounded-lg">
                  {exp.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Date */}
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="h-9 rounded-lg bg-muted/30 border-border/40"
            required
          />

          {/* Time: Start → End */}
          <div className="flex items-center gap-2">
            <Input
              type="time"
              value={startTime}
              onChange={(e) => handleStartTimeChange(e.target.value)}
              className="flex-1 h-9 rounded-lg bg-muted/30 border-border/40 text-center"
              required
            />
            <span className="text-muted-foreground/60 text-sm">→</span>
            <Input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="flex-1 h-9 rounded-lg bg-muted/30 border-border/40 text-center"
              required
            />
          </div>

          {/* Repeat toggle */}
          <button
            type="button"
            onClick={() => setIsRecurring(!isRecurring)}
            className={cn(
              "flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm transition-colors",
              isRecurring ? "bg-primary/10 text-primary" : "bg-muted/30 text-muted-foreground hover:bg-muted/50"
            )}
          >
            <Repeat className="w-3.5 h-3.5" />
            <span>{isRecurring ? 'Repeating' : 'Repeat?'}</span>
          </button>

          {/* Recurring options */}
          {isRecurring && (
            <div className="space-y-2 pl-2 border-l-2 border-primary/20">
              <div className="flex gap-2">
                <Select value={frequency} onValueChange={(v) => setFrequency(v as 'daily' | 'weekly')}>
                  <SelectTrigger className="h-8 flex-1 text-xs rounded-md bg-muted/30 border-border/40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-lg">
                    <SelectItem value="daily" className="text-xs">Daily</SelectItem>
                    <SelectItem value="weekly" className="text-xs">Weekly</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  type="date"
                  value={repeatEndDate}
                  onChange={(e) => setRepeatEndDate(e.target.value)}
                  min={date}
                  className="flex-1 h-8 text-xs rounded-md bg-muted/30 border-border/40"
                />
              </div>
              <div className="text-xs text-primary font-medium">
                {sessionCount} sessions
              </div>
            </div>
          )}

          {/* Advanced toggle */}
          <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
            <CollapsibleTrigger asChild>
              <button
                type="button"
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <ChevronDown className={cn("w-3 h-3 transition-transform", showAdvanced && "rotate-180")} />
                More options
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-2 space-y-2">
              {/* Spots */}
              <div className="flex items-center gap-2">
                <Users className="w-3.5 h-3.5 text-muted-foreground" />
                <Input
                  type="number"
                  min={1}
                  value={spots}
                  onChange={(e) => setSpots(parseInt(e.target.value) || 1)}
                  className="h-8 w-20 text-xs rounded-md bg-muted/30 border-border/40"
                />
                <span className="text-xs text-muted-foreground">spots</span>
              </div>
              
              {/* Price override */}
              <div className="flex items-center gap-2">
                <Euro className="w-3.5 h-3.5 text-muted-foreground" />
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={customPrice}
                  onChange={(e) => setCustomPrice(e.target.value)}
                  placeholder={selectedExperience ? ((selectedExperience.price_cents || 0) / 100).toFixed(0) : '—'}
                  className="h-8 w-20 text-xs rounded-md bg-muted/30 border-border/40"
                />
                <span className="text-xs text-muted-foreground">per person</span>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Submit */}
          <Button
            type="submit"
            className="w-full h-9 rounded-xl font-medium"
            disabled={!experienceId}
          >
            {isRecurring ? `Create ${sessionCount}` : 'Create'}
          </Button>
        </form>
      </div>
    </>
  );
}
