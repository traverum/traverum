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
  Users,
  Mail,
  Copy,
  Check,
  X,
  CalendarClock,
  Plus,
  Trash2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatPrice } from '@/lib/pricing';
import { getLanguageName, getLanguageFlag } from '@/components/LanguageSelector';
import { useBookingManagement, type SessionWithGuests, type SessionGuest, type PendingRequest } from '@/hooks/useBookingManagement';
import { useToast } from '@/hooks/use-toast';

// --- Propose New Time Form ---

function ProposeNewTimeForm({
  request,
  onSubmit,
  onCancel,
  isPending,
}: {
  request: PendingRequest;
  onSubmit: (times: Array<{ date: string; time: string }>) => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  const [slots, setSlots] = useState<Array<{ date: string; time: string }>>([
    { date: '', time: '' },
  ]);

  const addSlot = () => {
    if (slots.length < 3) {
      setSlots([...slots, { date: '', time: '' }]);
    }
  };

  const removeSlot = (index: number) => {
    if (slots.length > 1) {
      setSlots(slots.filter((_, i) => i !== index));
    }
  };

  const updateSlot = (index: number, field: 'date' | 'time', value: string) => {
    const updated = [...slots];
    updated[index] = { ...updated[index], [field]: value };
    setSlots(updated);
  };

  const isValid = slots.every(s => s.date && s.time);

  const handleSubmit = () => {
    if (isValid) {
      onSubmit(slots);
    }
  };

  return (
    <div className="mt-3 p-3 bg-muted/30 rounded-lg border border-border space-y-3">
      <p className="text-xs font-medium text-muted-foreground">Propose alternative time(s)</p>
      {slots.map((slot, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground w-4">{i + 1}.</span>
          <Input
            type="date"
            value={slot.date}
            onChange={(e) => updateSlot(i, 'date', e.target.value)}
            className="h-8 text-xs flex-1"
            min={new Date().toISOString().split('T')[0]}
          />
          <Input
            type="time"
            value={slot.time}
            onChange={(e) => updateSlot(i, 'time', e.target.value)}
            className="h-8 text-xs w-28"
          />
          {slots.length > 1 && (
            <Button
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
              onClick={() => removeSlot(i)}
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          )}
        </div>
      ))}
      {slots.length < 3 && (
        <button
          onClick={addSlot}
          className="flex items-center gap-1 text-xs text-primary hover:underline"
        >
          <Plus className="w-3 h-3" />
          Add another option
        </button>
      )}
      <div className="flex gap-2 pt-1">
        <Button
          size="sm"
          className="h-7 text-xs"
          onClick={handleSubmit}
          disabled={!isValid || isPending}
        >
          {isPending ? 'Sending...' : 'Send Proposal'}
        </Button>
        <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

// --- Pending Request Card ---

function PendingRequestCard({
  request,
  onAccept,
  onDecline,
  onPropose,
  isAccepting,
  isDeclining,
  isProposing,
}: {
  request: PendingRequest;
  onAccept: () => void;
  onDecline: () => void;
  onPropose: (times: Array<{ date: string; time: string }>) => void;
  isAccepting: boolean;
  isDeclining: boolean;
  isProposing: boolean;
}) {
  const [showPropose, setShowPropose] = useState(false);
  const [showDeclineConfirm, setShowDeclineConfirm] = useState(false);

  const deadline = parseISO(request.response_deadline);
  const isUrgent = deadline.getTime() - Date.now() < 12 * 60 * 60 * 1000;
  const isProposed = request.reservation_status === 'proposed';

  return (
    <>
      <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row sm:items-start gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1.5">
                <h4 className="font-medium text-sm">{request.guest_name}</h4>
                {isUrgent && !isProposed && (
                  <Badge variant="destructive" className="text-[10px] h-4 px-1.5">
                    Urgent
                  </Badge>
                )}
                {isProposed && (
                  <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-200 text-[10px] h-4 px-1.5">
                    Awaiting guest
                  </Badge>
                )}
              </div>

              <p className="text-sm text-muted-foreground mb-1">{request.experience.title}</p>

              <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground mb-2">
                <span className="flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  {request.participants} {request.participants === 1 ? 'person' : 'people'}
                </span>
                <span>{formatPrice(request.total_cents)}</span>
                {request.preferred_language && (
                  <span>
                    {getLanguageFlag(request.preferred_language)} {getLanguageName(request.preferred_language)}
                  </span>
                )}
              </div>

              {/* Date info */}
              <div className="text-xs text-muted-foreground mb-2">
                {request.is_request && request.requested_date ? (
                  <span>
                    Requested: {format(parseISO(request.requested_date), 'dd/MM/yyyy')}
                    {request.requested_time && ` at ${request.requested_time.slice(0, 5)}`}
                  </span>
                ) : request.session ? (
                  <span>
                    Session: {format(parseISO(request.session.session_date), 'dd/MM/yyyy')} at {request.session.start_time.slice(0, 5)}
                  </span>
                ) : null}
              </div>

              {/* Proposed times display */}
              {isProposed && request.proposed_times && (
                <div className="bg-amber-50 border border-amber-200 rounded-md p-2 mb-2">
                  <p className="text-xs font-medium text-amber-800 mb-1">Proposed times:</p>
                  {request.proposed_times.map((slot, i) => (
                    <p key={i} className="text-xs text-amber-700">
                      {format(parseISO(slot.date), 'dd/MM/yyyy')} at {slot.time.slice(0, 5)}
                    </p>
                  ))}
                </div>
              )}

              {/* Deadline */}
              <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <Clock className="w-3 h-3" />
                {isProposed ? 'Guest responds within' : 'Respond within'} {formatDistanceToNow(deadline)}
              </div>
            </div>

            {/* Actions */}
            {!isProposed && (
              <div className="flex gap-2 sm:flex-col sm:items-end flex-shrink-0">
                <Button
                  size="sm"
                  className="h-7 text-xs"
                  onClick={onAccept}
                  disabled={isAccepting}
                >
                  {isAccepting ? 'Accepting...' : 'Accept'}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs"
                  onClick={() => setShowDeclineConfirm(true)}
                  disabled={isDeclining}
                >
                  Decline
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 text-xs text-primary"
                  onClick={() => setShowPropose(prev => !prev)}
                >
                  <CalendarClock className="w-3 h-3 mr-1" />
                  Propose Time
                </Button>
              </div>
            )}
          </div>

          {/* Propose New Time Form */}
          {showPropose && !isProposed && (
            <ProposeNewTimeForm
              request={request}
              onSubmit={(times) => {
                onPropose(times);
                setShowPropose(false);
              }}
              onCancel={() => setShowPropose(false)}
              isPending={isProposing}
            />
          )}
        </CardContent>
      </Card>

      {/* Decline Confirmation */}
      <AlertDialog open={showDeclineConfirm} onOpenChange={setShowDeclineConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Decline request?</AlertDialogTitle>
            <AlertDialogDescription>
              The guest will be notified that this time is not available.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => { onDecline(); setShowDeclineConfirm(false); }}
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
    if (session.spots_available === 0) return <Badge className="bg-warning/10 text-warning text-[10px] h-4 px-1.5">Full</Badge>;
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
                  <span className="font-medium text-sm">
                    {format(parseISO(session.session_date), 'dd/MM/yyyy')}
                  </span>
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
                  {session.bookingsCount}/{session.spots_total}
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
            {format(parseISO(date), 'EEEE, d MMMM yyyy')}
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
    proposeNewTimes,
    cancelSession,
    pendingCount,
  } = useBookingManagement();

  // Determine initial tab based on URL params
  const getInitialTab = () => {
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
      toast({ title: 'Request accepted' });
    } catch {
      toast({ title: 'Error', description: 'Failed to accept request.', variant: 'destructive' });
    }
  };

  const handleDecline = async (reservationId: string) => {
    try {
      await declineRequest.mutateAsync(reservationId);
      toast({ title: 'Request declined' });
    } catch {
      toast({ title: 'Error', description: 'Failed to decline request.', variant: 'destructive' });
    }
  };

  const handlePropose = async (reservationId: string, times: Array<{ date: string; time: string }>) => {
    try {
      await proposeNewTimes.mutateAsync({ reservationId, proposedTimes: times });
      toast({ title: 'Proposal sent', description: 'The guest will be notified via email.' });
    } catch {
      toast({ title: 'Error', description: 'Failed to send proposal.', variant: 'destructive' });
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
                    onDecline={() => handleDecline(request.id)}
                    onPropose={(times) => handlePropose(request.id, times)}
                    isAccepting={acceptRequest.isPending}
                    isDeclining={declineRequest.isPending}
                    isProposing={proposeNewTimes.isPending}
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
