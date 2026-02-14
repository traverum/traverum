import { useState, useEffect, useLayoutEffect, useRef } from 'react';
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
import { X, ChevronDown, Users, Euro, Repeat, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';
import { generateRecurringSessions, type Experience } from '@/hooks/useExperienceSessions';
import { getLanguageName } from '@/components/LanguageSelector';

interface SessionData {
  single: true;
  experienceId: string;
  date: string;
  time: string;
  spotsTotal: number;
  spotsAvailable: number;
  priceOverrideCents: number | null;
  priceNote: string | null;
  sessionLanguage: string | null;
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
  sessionLanguage: string | null;
}

interface SessionCreatePopupProps {
  isOpen: boolean;
  onClose: () => void;
  initialDate?: Date;
  initialTime?: string;
  initialExperienceId?: string;
  initialSpots?: number;
  initialPriceOverride?: string;
  initialLanguage?: string;
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
  initialExperienceId,
  initialSpots,
  initialPriceOverride,
  initialLanguage,
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
  
  // Language
  const [sessionLanguage, setSessionLanguage] = useState<string>('');
  
  // Advanced
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [customPrice, setCustomPrice] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  
  const popupRef = useRef<HTMLDivElement>(null);
  const hasPositioned = useRef(false);
  const selectedExperience = experiences.find(e => e.id === experienceId);
  const availableLanguages = (selectedExperience as any)?.available_languages as string[] | undefined;

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

  // Update end time and language when experience changes
  useEffect(() => {
    if (selectedExperience) {
      setSpots(selectedExperience.max_participants || 8);
      const duration = selectedExperience.duration_minutes || 60;
      setEndTime(calculateEndTime(startTime, duration));
      // Auto-fill language if experience has exactly one
      const langs = (selectedExperience as any)?.available_languages as string[] | undefined;
      if (langs && langs.length === 1) {
        setSessionLanguage(langs[0]);
      } else {
        setSessionLanguage('');
      }
    }
  }, [selectedExperience]);

  // Update end time when start time changes (maintain duration)
  const handleStartTimeChange = (newStartTime: string) => {
    if (selectedExperience) {
      const duration = selectedExperience.duration_minutes || 60;
      setEndTime(calculateEndTime(newStartTime, duration));
    }
    setStartTime(newStartTime);
    setValidationError(null);
  };

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      if (initialDate) setDate(format(initialDate, 'yyyy-MM-dd'));
      if (initialTime) {
        setStartTime(initialTime);
        const defaultDuration = experiences.length > 0 
          ? (experiences[0].duration_minutes || 60) 
          : 60;
        setEndTime(calculateEndTime(initialTime, defaultDuration));
      }

      // Pre-select experience: explicit prop > single experience > blank
      const preselectedId = initialExperienceId || (experiences.length === 1 ? experiences[0].id : '');
      if (preselectedId) {
        setExperienceId(preselectedId);
        const exp = experiences.find(e => e.id === preselectedId);
        if (exp) {
          setSpots(initialSpots ?? exp.max_participants ?? 8);
          const duration = exp.duration_minutes || 60;
          setEndTime(calculateEndTime(initialTime || '09:00', duration));
        }
      } else {
        setExperienceId('');
      }

      setShowAdvanced(!!initialPriceOverride);
      setIsRecurring(false);
      setCustomPrice(initialPriceOverride || '');
      setSessionLanguage(initialLanguage || '');
      setValidationError(null);
    }
  }, [isOpen, initialDate, initialTime, initialExperienceId, initialSpots, initialPriceOverride, initialLanguage, experiences]);

  // Reset positioning flag when popup closes
  useEffect(() => {
    if (!isOpen) hasPositioned.current = false;
  }, [isOpen]);

  // Position popup — useLayoutEffect prevents visible flicker
  useLayoutEffect(() => {
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

      if (!hasPositioned.current) {
        hasPositioned.current = true;
        popup.style.opacity = '1';
      }
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

    // Validate: prevent creating sessions in the past
    const now = new Date();
    const todayLocal = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const [startH, startM] = startTime.split(':').map(Number);
    const nowHours = now.getHours();
    const nowMinutes = now.getMinutes();
    
    const isPast = date < todayLocal || 
      (date === todayLocal && (startH < nowHours || (startH === nowHours && startM < nowMinutes)));
    
    if (isPast) {
      setValidationError('Cannot create sessions in the past');
      return;
    }

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
        sessionLanguage: sessionLanguage || null,
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
        sessionLanguage: sessionLanguage || null,
      });
    }
    onClose();
  };

  // Input styling following design system - borderless with beige tint
  const inputClass = "h-8 rounded-sm bg-[rgba(242,241,238,0.6)] border-0 focus-visible:ring-1 focus-visible:ring-primary/30";
  const selectTriggerClass = "h-9 rounded-sm bg-[rgba(242,241,238,0.6)] border-0 focus:ring-1 focus:ring-primary/30";

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      
      <div
        ref={popupRef}
        className="fixed z-50 w-72 bg-background border border-border rounded-lg shadow-lg"
        style={{
          left: position?.x ?? '50%',
          top: position?.y ?? '50%',
          transform: position ? 'none' : 'translate(-50%, -50%)',
          opacity: position ? 0 : 1,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-border">
          <span className="font-medium text-sm">New Session</span>
          <button 
            type="button"
            onClick={onClose} 
            className="h-6 w-6 flex items-center justify-center rounded-sm text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-ui"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-3 space-y-3">
          {/* Experience */}
          <Select value={experienceId} onValueChange={setExperienceId} required>
            <SelectTrigger className={selectTriggerClass}>
              <SelectValue placeholder="Select experience" />
            </SelectTrigger>
            <SelectContent className="rounded-sm">
              {experiences.map((exp) => (
                <SelectItem key={exp.id} value={exp.id} className="rounded-sm text-sm">
                  {exp.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Date */}
          <Input
            type="date"
            value={date}
            onChange={(e) => { setDate(e.target.value); setValidationError(null); }}
            min={format(new Date(), 'yyyy-MM-dd')}
            className={cn(inputClass, "h-9")}
            required
          />

          {/* Time: Start → End */}
          <div className="flex items-center gap-2">
            <Input
              type="time"
              value={startTime}
              onChange={(e) => handleStartTimeChange(e.target.value)}
              className={cn(inputClass, "flex-1 h-9 text-center")}
              required
            />
            <span className="text-muted-foreground text-sm">→</span>
            <Input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className={cn(inputClass, "flex-1 h-9 text-center")}
              required
            />
          </div>

          {/* Language selector - only show if experience has languages configured */}
          {availableLanguages && availableLanguages.length > 0 && (
            <div className="flex items-center gap-2">
              <Globe className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
              {availableLanguages.length === 1 ? (
                <span className="text-sm text-foreground">
                  {getLanguageName(availableLanguages[0])}
                </span>
              ) : (
                <Select value={sessionLanguage} onValueChange={setSessionLanguage}>
                  <SelectTrigger className={cn(selectTriggerClass, "flex-1 h-8")}>
                    <SelectValue placeholder="Session language" />
                  </SelectTrigger>
                  <SelectContent className="rounded-sm">
                    {availableLanguages.map((code) => (
                      <SelectItem key={code} value={code} className="rounded-sm text-sm">
                        {getLanguageName(code)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          )}

          {/* Repeat toggle */}
          <button
            type="button"
            onClick={() => setIsRecurring(!isRecurring)}
            className={cn(
              "flex items-center gap-2 w-full px-3 py-2 rounded-sm text-sm transition-ui",
              isRecurring 
                ? "bg-primary/10 text-primary" 
                : "bg-[rgba(242,241,238,0.6)] text-muted-foreground hover:bg-[rgba(242,241,238,0.8)]"
            )}
          >
            <Repeat className="w-3.5 h-3.5" />
            <span>{isRecurring ? 'Repeating' : 'Repeat?'}</span>
          </button>

          {/* Recurring options - animated */}
          <div 
            className="grid transition-all duration-150 ease-out"
            style={{ 
              gridTemplateRows: isRecurring ? '1fr' : '0fr',
              opacity: isRecurring ? 1 : 0,
            }}
          >
            <div className="overflow-hidden">
              <div className="space-y-2 pl-2 border-l-2 border-primary/20 pb-1">
                <div className="flex gap-2">
                  <Select value={frequency} onValueChange={(v) => setFrequency(v as 'daily' | 'weekly')}>
                    <SelectTrigger className={cn(selectTriggerClass, "h-8 flex-1 text-xs")}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-sm">
                      <SelectItem value="daily" className="text-xs rounded-sm">Daily</SelectItem>
                      <SelectItem value="weekly" className="text-xs rounded-sm">Weekly</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    type="date"
                    value={repeatEndDate}
                    onChange={(e) => setRepeatEndDate(e.target.value)}
                    min={date}
                    className={cn(inputClass, "flex-1 text-xs")}
                  />
                </div>
                <div className="text-xs text-primary font-medium">
                  {sessionCount} sessions
                </div>
              </div>
            </div>
          </div>

          {/* Advanced toggle */}
          <div>
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronDown className={cn("w-3 h-3 transition-transform duration-150", showAdvanced && "rotate-180")} />
              More options
            </button>
            
            {/* Advanced content - animated */}
            <div 
              className="grid transition-all duration-150 ease-out"
              style={{ 
                gridTemplateRows: showAdvanced ? '1fr' : '0fr',
                opacity: showAdvanced ? 1 : 0,
              }}
            >
              <div className="overflow-hidden">
                <div className="pt-2 space-y-2">
                  {/* Max group size */}
                  <div className="flex items-center gap-2">
                    <Users className="w-3.5 h-3.5 text-muted-foreground" />
                    <Input
                      type="number"
                      min={1}
                      value={spots}
                      onChange={(e) => setSpots(parseInt(e.target.value) || 1)}
                      className={cn(inputClass, "w-20 text-xs")}
                    />
                    <span className="text-xs text-muted-foreground">max group</span>
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
                      className={cn(inputClass, "w-20 text-xs")}
                    />
                    <span className="text-xs text-muted-foreground">per person</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Validation error */}
          {validationError && (
            <p className="text-xs text-destructive">{validationError}</p>
          )}

          {/* Submit */}
          <Button
            type="submit"
            className="w-full h-8 rounded-sm font-medium"
            disabled={!experienceId}
          >
            {isRecurring ? `Create ${sessionCount}` : 'Create'}
          </Button>
        </form>
      </div>
    </>
  );
}
