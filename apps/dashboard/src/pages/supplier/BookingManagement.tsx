import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { format, parseISO, formatDistanceToNow } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  ChevronDown,
  ChevronRight,
  Clock,
  Mail,
  Copy,
  Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatPrice } from '@/lib/pricing';
import { getLanguageName, getLanguageFlag } from '@/components/LanguageSelector';
import { useBookingManagement, type SessionWithGuests, type SessionGuest, type PendingRequest } from '@/hooks/useBookingManagement';
import { useToast } from '@/hooks/use-toast';

// --- Pending Request Card ---

function PendingRequestCard({
  request,
  onAccept,
  onDecline,
  isAccepting,
  isDeclining,
}: {
  request: PendingRequest;
  onAccept: () => void;
  onDecline: (message?: string) => void;
  isAccepting: boolean;
  isDeclining: boolean;
}) {
  const [showDeclineConfirm, setShowDeclineConfirm] = useState(false);
  const [declineSuggestion, setDeclineSuggestion] = useState('');
  const canAccept = !!(request.requested_date && request.requested_time);

  const deadline = parseISO(request.response_deadline);
  const isUrgent = deadline.getTime() - Date.now() < 12 * 60 * 60 * 1000;

  return (
    <>
      <Card className={cn(
        'border shadow-sm',
        isUrgent ? 'border-destructive/40' : 'border-border'
      )}>
        <CardContent className="p-4 space-y-3">
          {/* Row 1: Experience + date + participants */}
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h4 className="text-sm font-medium truncate">{request.experience.title}</h4>
              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                <span>Requested {formatDistanceToNow(parseISO(request.created_at), { addSuffix: true })}</span>
                <span>·</span>
                <span>{request.participants} {request.participants === 1 ? 'person' : 'people'}</span>
              </div>
            </div>
            {isUrgent && (
              <Badge variant="destructive" className="text-[10px] h-4 px-1.5 flex-shrink-0">
                Urgent
              </Badge>
            )}
          </div>

          {/* Row 2: Accept / Decline actions */}
          {!canAccept && (
            <p className="text-[11px] text-muted-foreground">No specific time — decline to suggest alternatives</p>
          )}
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              className="h-8 text-xs px-4"
              onClick={() => onAccept()}
              disabled={isAccepting || !canAccept}
            >
              {isAccepting ? 'Accepting...' : 'Accept'}
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-xs"
              onClick={() => setShowDeclineConfirm(true)}
              disabled={isDeclining}
            >
              Decline or propose alternatives
            </Button>
          </div>

          {/* Deadline */}
          <p className="text-[11px] text-muted-foreground">
            Respond within {formatDistanceToNow(deadline)}
          </p>
        </CardContent>
      </Card>

      {/* Decline Confirmation */}
      <AlertDialog open={showDeclineConfirm} onOpenChange={(open) => { setShowDeclineConfirm(open); if (!open) setDeclineSuggestion(''); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Decline or propose other times?</AlertDialogTitle>
            <AlertDialogDescription>
              The guest will be notified. You can propose times that work for you — they'll see your message and can request again or pick an existing session.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="px-1">
            <label className="text-sm font-medium text-foreground mb-1.5 block">
              Propose alternative times (optional)
            </label>
            <textarea
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              rows={3}
              placeholder="e.g. We have availability on Thursday at 10:00 or Friday at 14:00"
              value={declineSuggestion}
              onChange={(e) => setDeclineSuggestion(e.target.value)}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => { onDecline(declineSuggestion || undefined); setShowDeclineConfirm(false); }}
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

// --- Session Card with Guest List ---

function SessionCard({
  session,
  isPast,
  isExpanded,
  onToggle,
  onCancelSession,
}: {
  session: SessionWithGuests;
  isPast: boolean;
  isExpanded: boolean;
  onToggle: () => void;
  onCancelSession?: () => void;
}) {
  const [copiedEmails, setCopiedEmails] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const isCancelled = session.session_status === 'cancelled';

  // Paid guests = those with a booking status of confirmed or completed
  const paidGuests = session.guests.filter(
    g => g.booking && ['confirmed', 'completed'].includes(g.booking.booking_status)
  );

  const handleCopyEmails = () => {
    const emails = paidGuests.map(g => g.guest_email).filter(Boolean);
    if (emails.length > 0) {
      navigator.clipboard.writeText(emails.join(', '));
      setCopiedEmails(true);
      setTimeout(() => setCopiedEmails(false), 2000);
    }
  };

  const getStatusBadge = () => {
    if (isCancelled) return <Badge variant="secondary" className="text-[10px] h-4 px-1.5">Cancelled</Badge>;
    if (isPast) return <Badge variant="secondary" className="text-[10px] h-4 px-1.5 text-muted-foreground">Past</Badge>;
    if (session.session_status === 'booked') return <Badge className="bg-primary/10 text-primary text-[10px] h-4 px-1.5">Booked</Badge>;
    return <Badge className="bg-success/10 text-success text-[10px] h-4 px-1.5">Available</Badge>;
  };

  const getGuestStatusBadge = (guest: SessionGuest) => {
    if (guest.booking) {
      const bs = guest.booking.booking_status;
      if (bs === 'confirmed') return <Badge className="bg-success/10 text-success text-[10px] h-4 px-1.5">Paid</Badge>;
      if (bs === 'completed') return <Badge className="bg-primary/10 text-primary text-[10px] h-4 px-1.5">Completed</Badge>;
      if (bs === 'cancelled') {
        const isRefunded = !!guest.booking.stripe_refund_id;
        return <Badge variant="secondary" className="text-[10px] h-4 px-1.5">{isRefunded ? 'Refunded' : 'Cancelled'}</Badge>;
      }
    }
    return <Badge variant="outline" className="text-[10px] h-4 px-1.5">{guest.reservation_status}</Badge>;
  };

  const canShowContact = (guest: SessionGuest) => {
    // Only show email/phone after payment
    return guest.booking && ['confirmed', 'completed'].includes(guest.booking.booking_status);
  };

  return (
    <>
      <Collapsible open={isExpanded} onOpenChange={onToggle}>
        <div className={cn(
          'bg-card rounded-lg border border-border overflow-hidden',
          isCancelled && 'opacity-60'
        )}>
          {/* Session Header */}
          <CollapsibleTrigger asChild>
            <button className="w-full flex items-center gap-3 p-3 hover:bg-accent/30 transition-colors text-left">
              {isExpanded ? (
                <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              ) : (
                <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    {session.start_time.slice(0, 5)}
                  </span>
                  <span className="text-xs text-muted-foreground">·</span>
                  <span className="text-sm text-muted-foreground truncate">
                    {session.experience.title}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {getStatusBadge()}
                <span className="text-xs text-muted-foreground">
                  {session.bookingsCount} booking{session.bookingsCount !== 1 ? 's' : ''}
                </span>
              </div>
            </button>
          </CollapsibleTrigger>

          {/* Expanded Guest List */}
          <CollapsibleContent>
            <div className="border-t border-border">
              {session.guests.length === 0 ? (
                <p className="text-sm text-muted-foreground p-3">No guests yet</p>
              ) : (
                <div className="divide-y divide-border">
                  {session.guests.map(guest => (
                    <div key={guest.id} className="flex items-center justify-between p-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium">{guest.guest_name}</p>
                          {getGuestStatusBadge(guest)}
                        </div>
                        <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground mt-0.5">
                          <span>{guest.participants} {guest.participants === 1 ? 'person' : 'people'}</span>
                          {guest.preferred_language && (
                            <span>{getLanguageFlag(guest.preferred_language)} {getLanguageName(guest.preferred_language)}</span>
                          )}
                          {canShowContact(guest) && (
                            <>
                              <span className="flex items-center gap-0.5">
                                <Mail className="w-3 h-3" />
                                {guest.guest_email}
                              </span>
                              {guest.guest_phone && <span>{guest.guest_phone}</span>}
                            </>
                          )}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-medium">{formatPrice(guest.total_cents)}</p>
                        {isPast && guest.booking?.booking_status === 'cancelled' && guest.booking?.stripe_refund_id && (
                          <p className="text-[10px] text-muted-foreground">Refunded</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Session actions */}
              <div className="flex items-center justify-between p-3 border-t border-border bg-muted/20">
                <div className="flex gap-2">
                  {paidGuests.length > 0 && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs"
                      onClick={handleCopyEmails}
                    >
                      {copiedEmails ? (
                        <><Check className="w-3 h-3 mr-1" /> Copied!</>
                      ) : (
                        <><Copy className="w-3 h-3 mr-1" /> Copy emails ({paidGuests.length})</>
                      )}
                    </Button>
                  )}
                </div>
                {!isPast && !isCancelled && onCancelSession && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs text-destructive hover:text-destructive"
                    onClick={() => setShowCancelConfirm(true)}
                  >
                    Cancel Session
                  </Button>
                )}
              </div>
            </div>
          </CollapsibleContent>
        </div>
      </Collapsible>

      {/* Cancel Session Confirmation */}
      <AlertDialog open={showCancelConfirm} onOpenChange={setShowCancelConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel session?</AlertDialogTitle>
            <AlertDialogDescription>
              {session.bookingsCount > 0 ? (
                <>This session has {session.bookingsCount} guest{session.bookingsCount !== 1 ? 's' : ''} booked. They will be notified and refunded.</>
              ) : (
                <>This session will be cancelled. This action cannot be undone.</>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Session</AlertDialogCancel>
            <AlertDialogAction onClick={() => { onCancelSession?.(); setShowCancelConfirm(false); }}>
              Cancel Session
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// --- Session List ---

function SessionList({
  sessions,
  isPast,
  highlightSessionId,
  onCancelSession,
}: {
  sessions: SessionWithGuests[];
  isPast: boolean;
  highlightSessionId?: string | null;
  onCancelSession?: (sessionId: string) => void;
}) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => {
    if (highlightSessionId) return new Set([highlightSessionId]);
    return new Set<string>();
  });

  const toggleSession = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Group sessions by date
  const grouped = useMemo(() => {
    const groups: Array<{ date: string; sessions: SessionWithGuests[] }> = [];
    let currentDate = '';
    let currentGroup: SessionWithGuests[] = [];

    sessions.forEach(s => {
      if (s.session_date !== currentDate) {
        if (currentGroup.length > 0) {
          groups.push({ date: currentDate, sessions: currentGroup });
        }
        currentDate = s.session_date;
        currentGroup = [s];
      } else {
        currentGroup.push(s);
      }
    });
    if (currentGroup.length > 0) {
      groups.push({ date: currentDate, sessions: currentGroup });
    }
    return groups;
  }, [sessions]);

  if (sessions.length === 0) {
    return (
      <Card className="border-0 shadow-sm">
        <CardContent className="p-8 text-center">
          <p className="text-sm text-muted-foreground">
            {isPast ? 'No past sessions yet.' : 'No upcoming sessions.'}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {grouped.map(({ date, sessions: dateSessions }) => (
        <div key={date}>
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">
            {format(parseISO(date), 'dd.MM.yyyy')}
          </h3>
          <div className="space-y-2">
            {dateSessions.map(session => (
              <SessionCard
                key={session.id}
                session={session}
                isPast={isPast}
                isExpanded={expandedIds.has(session.id)}
                onToggle={() => toggleSession(session.id)}
                onCancelSession={
                  !isPast ? () => onCancelSession?.(session.id) : undefined
                }
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// --- Main Page ---

export default function BookingManagement() {
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const sessionFilter = searchParams.get('session');

  const {
    pendingRequests,
    upcomingSessions,
    pastSessions,
    isLoading,
    acceptRequest,
    declineRequest,
    cancelSession,
    pendingCount,
  } = useBookingManagement();

  // Determine initial tab based on URL params
  const getInitialTab = () => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'pending' || tabParam === 'upcoming' || tabParam === 'past') return tabParam;
    if (sessionFilter) {
      // Check if it's an upcoming or past session
      const isUpcoming = upcomingSessions.some(s => s.id === sessionFilter);
      if (isUpcoming) return 'upcoming';
      const isPast = pastSessions.some(s => s.id === sessionFilter);
      if (isPast) return 'past';
    }
    if (pendingCount > 0) return 'pending';
    return 'upcoming';
  };

  const [activeTab, setActiveTab] = useState<string | null>(null);

  // Set initial tab once data loads
  const tab = activeTab || getInitialTab();

  const handleAccept = async (reservationId: string) => {
    try {
      await acceptRequest.mutateAsync(reservationId);
      toast({ title: 'Request accepted', description: 'The guest will receive a payment link.' });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to accept request.', variant: 'destructive' });
    }
  };

  const handleDecline = async (reservationId: string, message?: string) => {
    try {
      await declineRequest.mutateAsync({ reservationId, message });
      toast({ title: 'Request declined', description: 'The guest has been notified.' });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to decline request.', variant: 'destructive' });
    }
  };

  const handleCancelSession = async (sessionId: string) => {
    try {
      await cancelSession.mutateAsync(sessionId);
      toast({ title: 'Session cancelled' });
    } catch {
      toast({ title: 'Error', description: 'Failed to cancel session.', variant: 'destructive' });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-alt">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-alt">
      <main className="container max-w-4xl mx-auto px-4 py-4">
        <Tabs value={tab} onValueChange={setActiveTab}>
          <TabsList className="mb-4 h-9">
            <TabsTrigger value="pending" className="text-xs">
              Pending Requests
              {pendingCount > 0 && (
                <span className="ml-1.5 flex items-center justify-center min-w-[18px] h-4 px-1 rounded-full text-[10px] font-medium bg-destructive text-destructive-foreground">
                  {pendingCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="upcoming" className="text-xs">
              Upcoming Sessions
              <span className="ml-1.5 text-[10px] text-muted-foreground">
                ({upcomingSessions.length})
              </span>
            </TabsTrigger>
            <TabsTrigger value="past" className="text-xs">
              Past Sessions
            </TabsTrigger>
          </TabsList>

          {/* Pending Requests Tab */}
          <TabsContent value="pending" className="mt-0">
            {pendingRequests.length === 0 ? (
              <Card className="border-0 shadow-sm">
                <CardContent className="p-8 text-center">
                  <h4 className="font-medium mb-2">No pending requests</h4>
                  <p className="text-sm text-muted-foreground">
                    When guests request a booking, you'll see it here.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {pendingRequests.map(request => (
                  <PendingRequestCard
                    key={request.id}
                    request={request}
                    onAccept={() => handleAccept(request.id)}
                    onDecline={(message) => handleDecline(request.id, message)}
                    isAccepting={acceptRequest.isPending}
                    isDeclining={declineRequest.isPending}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Upcoming Sessions Tab */}
          <TabsContent value="upcoming" className="mt-0">
            <SessionList
              sessions={upcomingSessions}
              isPast={false}
              highlightSessionId={sessionFilter}
              onCancelSession={handleCancelSession}
            />
          </TabsContent>

          {/* Past Sessions Tab */}
          <TabsContent value="past" className="mt-0">
            <SessionList
              sessions={pastSessions}
              isPast={true}
              highlightSessionId={sessionFilter}
            />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
