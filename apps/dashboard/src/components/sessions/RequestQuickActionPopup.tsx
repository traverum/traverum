import { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { X, Calendar, Clock, User, Users, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatPrice } from '@/lib/pricing';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { CalendarRequest } from '@/hooks/useCalendarRequests';

const WIDGET_BASE_URL = import.meta.env.VITE_WIDGET_URL || 'https://book.traverum.com';

/** Format YYYY-MM-DD to "Mon 20 Feb" */
function fmtDate(dateStr: string): string {
  return format(new Date(dateStr + 'T12:00:00'), 'EEE d MMM');
}

interface RequestQuickActionPopupProps {
  isOpen: boolean;
  onClose: () => void;
  requests: CalendarRequest[];
  dateKey: string;
  position?: { x: number; y: number };
  onRequestAction?: () => void;
}

// Single request card within the popup
function RequestCard({
  request,
  onAction,
}: {
  request: CalendarRequest;
  onAction: () => void;
}) {
  const { toast } = useToast();
  const [isAccepting, setIsAccepting] = useState(false);
  const [isDeclining, setIsDeclining] = useState(false);
  const [showDeclineConfirm, setShowDeclineConfirm] = useState(false);
  const [isProcessed, setIsProcessed] = useState(false);
  const [declineSuggestion, setDeclineSuggestion] = useState('');

  const canAccept = request.isRental
    ? !!request.requested_date
    : !!(request.requested_date && request.requested_time);

  const handleAccept = async () => {
    if (!canAccept) {
      toast({ title: 'Cannot accept', description: 'This request has no specific time. Please decline and suggest alternatives.', variant: 'destructive' });
      return;
    }

    setIsAccepting(true);
    try {
      const { data: { session: authSession } } = await supabase.auth.getSession();
      if (!authSession?.access_token) throw new Error('Not authenticated');

      const response = await fetch(`${WIDGET_BASE_URL}/api/dashboard/requests/${request.id}/accept`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authSession.access_token}`,
        },
        body: JSON.stringify({}),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to accept request');

      toast({ title: 'Request accepted', description: `${request.guest_name} will receive a payment link.` });
      setIsProcessed(true);
      onAction();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setIsAccepting(false);
    }
  };

  const handleDecline = async () => {
    setIsDeclining(true);
    try {
      const { data: { session: authSession } } = await supabase.auth.getSession();
      if (!authSession?.access_token) throw new Error('Not authenticated');

      const response = await fetch(`${WIDGET_BASE_URL}/api/dashboard/requests/${request.id}/decline`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authSession.access_token}`,
        },
        body: JSON.stringify({ message: declineSuggestion || undefined }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to decline request');

      toast({ title: 'Request declined', description: `${request.guest_name} has been notified.` });
      setShowDeclineConfirm(false);
      setIsProcessed(true);
      onAction();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setIsDeclining(false);
    }
  };

  if (isProcessed) {
    return (
      <div className="p-3 bg-muted/30 rounded-lg text-center text-sm text-muted-foreground">
        Processed
      </div>
    );
  }

  // Compute rental days
  const rentalDays = (request.rental_start_date && request.rental_end_date)
    ? Math.max(1, Math.round(
        (new Date(request.rental_end_date + 'T12:00:00').getTime() - new Date(request.rental_start_date + 'T12:00:00').getTime()) / (1000 * 60 * 60 * 24)
      ))
    : 0;

  const deadlineShort = request.response_deadline
    ? format(new Date(request.response_deadline), 'd.M HH:mm')
    : null;

  return (
    <>
      <div className="border border-border rounded-lg bg-background overflow-hidden">
        {/* Header: experience title */}
        <div className="px-3 pt-3 pb-2">
          <h4 className="text-sm font-semibold text-foreground truncate">{request.experience.title}</h4>
        </div>

        {/* Details rows */}
        <div className="px-3 space-y-1.5 text-sm">
          {/* When */}
          {request.isRental ? (
            <div className="flex items-center gap-2 text-foreground">
              <Calendar className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
              {request.rental_start_date && request.rental_end_date ? (
                <span>
                  {fmtDate(request.rental_start_date)}
                  <span className="text-muted-foreground mx-1">&rarr;</span>
                  {fmtDate(request.rental_end_date)}
                  <span className="text-muted-foreground ml-1.5">({rentalDays} {rentalDays === 1 ? 'day' : 'days'})</span>
                </span>
              ) : (
                <span>{fmtDate(request.requested_date)}</span>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-foreground">
              <Calendar className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
              <span>
                {fmtDate(request.requested_date)}
                {request.requested_time && (
                  <span className="ml-1.5">
                    <span className="text-muted-foreground">at</span> {request.requested_time.slice(0, 5)}
                  </span>
                )}
              </span>
            </div>
          )}

          {/* Who */}
          <div className="flex items-center gap-2 text-foreground">
            <User className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
            <span className="truncate">{request.guest_name}</span>
          </div>

          {/* How many */}
          <div className="flex items-center gap-2 text-foreground">
            <Users className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
            <span>
              {request.participants} {request.isRental
                ? (request.participants === 1 ? 'unit' : 'units')
                : (request.participants === 1 ? 'person' : 'people')
              }
            </span>
          </div>
        </div>

        {/* Footer: price + deadline + actions */}
        <div className="px-3 pb-3 pt-2.5 mt-2 border-t border-border space-y-2.5">
          {/* Price row + deadline */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-foreground">{formatPrice(request.total_cents, request.experience.currency)}</span>
            {deadlineShort && (
              <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                <span>by {deadlineShort}</span>
              </div>
            )}
          </div>

          {/* Actions */}
          {!canAccept && (
            <p className="text-[11px] text-muted-foreground">No specific time — decline to suggest alternatives</p>
          )}
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              className="flex-1 h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={handleAccept}
              disabled={isAccepting || !canAccept}
            >
              {isAccepting ? 'Accepting...' : 'Accept'}
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="flex-1 h-8 text-xs text-destructive hover:text-destructive border-destructive/30 hover:border-destructive/50 hover:bg-destructive/5"
              onClick={() => setShowDeclineConfirm(true)}
              disabled={isDeclining}
            >
              Decline
            </Button>
          </div>
        </div>
      </div>

      {/* Decline Confirmation — adapted for rental vs session */}
      <AlertDialog open={showDeclineConfirm} onOpenChange={(open) => { setShowDeclineConfirm(open); if (!open) setDeclineSuggestion(''); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{request.isRental ? 'Decline this rental request?' : 'Decline or propose other times?'}</AlertDialogTitle>
            <AlertDialogDescription>
              {request.isRental
                ? `${request.guest_name} will be notified that their rental request was declined. You can include a message below.`
                : `${request.guest_name} will be notified. You can propose times that work for you — the guest will see your message and can request again or pick an existing session.`
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="px-1">
            <label className="text-sm font-medium text-foreground mb-1.5 block">
              {request.isRental ? 'Message to guest (optional)' : 'Propose alternative times (optional)'}
            </label>
            <textarea
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              rows={2}
              placeholder={request.isRental
                ? 'e.g. We only have 1 unit available for those dates, or suggest different dates'
                : 'e.g. We have availability on Thursday at 10:00 or Friday at 14:00'
              }
              value={declineSuggestion}
              onChange={(e) => setDeclineSuggestion(e.target.value)}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeclining}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDecline}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeclining}
            >
              {isDeclining ? 'Declining...' : 'Decline Request'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export function RequestQuickActionPopup({
  isOpen,
  onClose,
  requests,
  dateKey,
  position,
  onRequestAction,
}: RequestQuickActionPopupProps) {
  const popupRef = useRef<HTMLDivElement>(null);
  const hasPositioned = useRef(false);

  // Reset positioning flag when popup closes
  useEffect(() => {
    if (!isOpen) hasPositioned.current = false;
  }, [isOpen]);

  // Position popup
  useLayoutEffect(() => {
    if (isOpen && position && popupRef.current) {
      const popup = popupRef.current;
      const rect = popup.getBoundingClientRect();
      const vw = window.innerWidth;
      const vh = window.innerHeight;

      let x = position.x - 170;
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
  }, [isOpen, position]);

  // Escape to close
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen || requests.length === 0) return null;

  const formattedDate = dateKey
    ? format(new Date(dateKey), 'EEEE, d MMM yyyy')
    : '';

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />

      <div
        ref={popupRef}
        className="fixed z-50 w-[340px] bg-background border border-border rounded-lg shadow-lg"
        style={{
          left: position?.x ?? '50%',
          top: position?.y ?? '50%',
          transform: position ? 'none' : 'translate(-50%, -50%)',
          opacity: position ? 0 : 1,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-amber-50 dark:bg-amber-900/20 rounded-t-lg">
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-medium text-sm text-amber-800 dark:text-amber-200">
              {requests.length} {requests.length === 1 ? 'request' : 'requests'}
            </span>
            <span className="text-xs text-amber-600 dark:text-amber-400">
              {formattedDate}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-6 w-6 flex items-center justify-center rounded-sm text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-all flex-shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Scrollable request list */}
        <div className="p-3 space-y-3 max-h-[400px] overflow-y-auto">
          {requests.map((request) => (
            <RequestCard
              key={request.id}
              request={request}
              onAction={() => onRequestAction?.()}
            />
          ))}
        </div>
      </div>
    </>
  );
}
