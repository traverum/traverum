import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { format, parseISO, formatDistanceToNow } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  Clock,
  Calendar,
  User,
  Users,
  AlertTriangle,
  Mail,
  Phone,
  Copy,
  Check,
  Hourglass,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatPrice } from '@/lib/pricing';
import { getLanguageName } from '@/components/LanguageSelector';
import { useBookingManagement, type PendingRequest, type AwaitingPaymentItem, type BookingItem } from '@/hooks/useBookingManagement';
import { useToast } from '@/hooks/use-toast';

function fmtDate(dateStr: string): string {
  return format(new Date(dateStr + 'T12:00:00'), 'd.M.yyyy');
}

function fmtDateHeading(dateStr: string): string {
  return format(parseISO(dateStr), 'd.M.yyyy');
}

// --- Pending Request Card (unchanged core, same as before) ---

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

  const isRental = request.isRental;
  const canAccept = isRental
    ? !!request.requested_date
    : !!(request.requested_date && request.requested_time);

  const deadline = parseISO(request.response_deadline);
  const isUrgent = deadline.getTime() - Date.now() < 12 * 60 * 60 * 1000;

  const rentalDays = isRental && request.rental_start_date && request.rental_end_date
    ? Math.round(
        (new Date(request.rental_end_date + 'T12:00:00').getTime() -
          new Date(request.rental_start_date + 'T12:00:00').getTime()) /
          (1000 * 60 * 60 * 24)
      )
    : null;

  const whenText = (() => {
    if (isRental && request.rental_start_date && request.rental_end_date && rentalDays) {
      return `${fmtDate(request.rental_start_date)} → ${fmtDate(request.rental_end_date)} (${rentalDays} day${rentalDays !== 1 ? 's' : ''})`;
    }
    if (request.requested_date) {
      const datePart = fmtDate(request.requested_date);
      return request.requested_time
        ? `${datePart} at ${request.requested_time.slice(0, 5)}`
        : datePart;
    }
    return 'No date specified';
  })();

  return (
    <>
      <Card className={cn(
        'border shadow-sm overflow-hidden',
        isUrgent ? 'border-destructive/40' : 'border-border'
      )}>
        <CardContent className="p-0">
          <div className="px-4 pt-4 pb-2">
            <h4 className="text-sm font-semibold leading-tight">{request.experience.title}</h4>
          </div>

          <div className="px-4 space-y-1.5 pb-3">
            <div className="flex items-center gap-2 text-sm">
              {isRental
                ? <Calendar className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                : <Clock className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
              }
              <span>{whenText}</span>
            </div>

            <div className="flex items-center gap-2 text-sm">
              <User className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
              <span>{request.guest_name}</span>
            </div>

            <div className="flex items-center gap-2 text-sm">
              <Users className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
              <span>
                {request.participants}{' '}
                {isRental
                  ? (request.participants === 1 ? 'unit' : 'units')
                  : (request.participants === 1 ? 'person' : 'people')
                }
              </span>
            </div>
          </div>

          <div className="border-t border-border px-4 py-3 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold">{formatPrice(request.total_cents)}</span>
              <span className={cn(
                'text-xs',
                isUrgent ? 'text-destructive font-medium' : 'text-muted-foreground'
              )}>
                {isUrgent && <AlertTriangle className="w-3 h-3 inline mr-1" />}
                Respond by {format(deadline, 'd.M HH:mm')}
              </span>
            </div>

            {!canAccept && (
              <p className="text-xs text-muted-foreground">
                {isRental
                  ? 'No rental dates specified — decline to suggest alternatives'
                  : 'No specific time — decline to suggest alternatives'
                }
              </p>
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
                Decline
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={showDeclineConfirm} onOpenChange={(open) => { setShowDeclineConfirm(open); if (!open) setDeclineSuggestion(''); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isRental ? 'Decline rental request?' : 'Decline or propose other times?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isRental
                ? 'The guest will be notified that this rental is not available. You can suggest alternative dates or quantities.'
                : 'The guest will be notified. You can propose times that work for you — they\'ll see your message and can request again or pick an existing session.'
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="px-1">
            <label className="text-sm font-medium text-foreground mb-1.5 block">
              {isRental ? 'Message to guest (optional)' : 'Propose alternative times (optional)'}
            </label>
            <textarea
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              rows={3}
              placeholder={isRental
                ? 'e.g. We only have 2 units available for those dates, or try starting from Thursday'
                : 'e.g. We have availability on Thursday at 10:00 or Friday at 14:00'
              }
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

// --- Awaiting Payment Card ---

function AwaitingPaymentCard({ item }: { item: AwaitingPaymentItem }) {
  const isRental = item.isRental;

  const rentalDays = isRental && item.rental_start_date && item.rental_end_date
    ? Math.round(
        (new Date(item.rental_end_date + 'T12:00:00').getTime() -
          new Date(item.rental_start_date + 'T12:00:00').getTime()) /
          (1000 * 60 * 60 * 24)
      )
    : null;

  const whenText = (() => {
    if (isRental && item.rental_start_date && item.rental_end_date && rentalDays) {
      return `${fmtDate(item.rental_start_date)} → ${fmtDate(item.rental_end_date)} (${rentalDays} day${rentalDays !== 1 ? 's' : ''})`;
    }
    if (item.session) {
      return `${fmtDate(item.session.session_date)} at ${item.session.start_time.slice(0, 5)}`;
    }
    if (item.requested_date) {
      const datePart = fmtDate(item.requested_date);
      return item.requested_time
        ? `${datePart} at ${item.requested_time.slice(0, 5)}`
        : datePart;
    }
    return 'Date pending';
  })();

  const deadline = item.payment_deadline ? parseISO(item.payment_deadline) : null;
  const timeLeft = deadline
    ? formatDistanceToNow(deadline, { addSuffix: false })
    : null;

  return (
    <Card className="border border-border shadow-sm overflow-hidden">
      <CardContent className="p-0">
        <div className="px-4 pt-4 pb-2">
          <h4 className="text-sm font-semibold leading-tight">{item.experience.title}</h4>
        </div>

        <div className="px-4 space-y-1.5 pb-3">
          <div className="flex items-center gap-2 text-sm">
            {isRental
              ? <Calendar className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
              : <Clock className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
            }
            <span>{whenText}</span>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <User className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
            <span>{item.guest_name}</span>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <Users className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
            <span>
              {item.participants}{' '}
              {isRental
                ? (item.participants === 1 ? 'unit' : 'units')
                : (item.participants === 1 ? 'person' : 'people')
              }
            </span>
          </div>
        </div>

        <div className="border-t border-border px-4 py-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold">{formatPrice(item.total_cents)}</span>
            {timeLeft && (
              <span className="text-xs text-warning flex items-center gap-1">
                <Hourglass className="w-3 h-3" />
                Payment link expires in {timeLeft}
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-1.5">
            Payment link sent to guest.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

// --- Booking Card (for Upcoming and Past) ---

function BookingCard({
  booking,
  isPast,
  onCancel,
  isCancelling,
}: {
  booking: BookingItem;
  isPast: boolean;
  onCancel?: () => void;
  isCancelling?: boolean;
}) {
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const isRental = booking.isRental;
  const isRefunded = booking.bookingStatus === 'cancelled' && !!booking.stripeRefundId;
  const isCancelled = booking.bookingStatus === 'cancelled' && !booking.stripeRefundId;

  const rentalDays = isRental && booking.rentalStartDate && booking.rentalEndDate
    ? Math.round(
        (new Date(booking.rentalEndDate + 'T12:00:00').getTime() -
          new Date(booking.rentalStartDate + 'T12:00:00').getTime()) /
          (1000 * 60 * 60 * 24)
      )
    : null;

  const whenText = (() => {
    if (isRental && booking.rentalStartDate && booking.rentalEndDate && rentalDays) {
      return `${fmtDate(booking.rentalStartDate)} → ${fmtDate(booking.rentalEndDate)} (${rentalDays} day${rentalDays !== 1 ? 's' : ''})`;
    }
    if (booking.date && booking.time) {
      return `${booking.time.slice(0, 5)}`;
    }
    return '';
  })();

  const handleCopyEmail = () => {
    if (booking.guestEmail) {
      navigator.clipboard.writeText(booking.guestEmail);
      setCopiedEmail(true);
      setTimeout(() => setCopiedEmail(false), 2000);
    }
  };

  return (
    <>
      <div className={cn(
        'bg-card rounded-lg border border-border p-4',
        (isRefunded || isCancelled) && 'opacity-60'
      )}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            {/* Time + Experience */}
            <div className="flex items-center gap-2 mb-1.5">
              {whenText && (
                <span className="text-sm text-muted-foreground">{whenText}</span>
              )}
              {whenText && (
                <span className="text-xs text-muted-foreground">·</span>
              )}
              <span className="text-sm truncate">{booking.experience.title}</span>
            </div>

            {/* Guest name + participants */}
            <div className="flex items-center gap-3 mb-1">
              <p className="text-sm font-medium">{booking.guestName}</p>
              <span className="text-xs text-muted-foreground">
                {booking.participants} {isRental
                  ? (booking.participants === 1 ? 'unit' : 'units')
                  : (booking.participants === 1 ? 'person' : 'people')
                }
              </span>
              {booking.preferredLanguage && (
                <span className="text-xs text-muted-foreground">
                  {getLanguageName(booking.preferredLanguage)}
                </span>
              )}
            </div>

            {/* Contact info (always visible — these are paid bookings) */}
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs mt-1">
              <a href={`mailto:${booking.guestEmail}`} className="flex items-center gap-1 text-foreground hover:text-primary transition-colors">
                <Mail className="w-3 h-3 text-muted-foreground" />
                {booking.guestEmail}
              </a>
              {booking.guestPhone && (
                <a href={`tel:${booking.guestPhone}`} className="flex items-center gap-1 text-foreground hover:text-primary transition-colors">
                  <Phone className="w-3 h-3 text-muted-foreground" />
                  {booking.guestPhone}
                </a>
              )}
              <button
                onClick={handleCopyEmail}
                className="flex items-center gap-1 text-muted-foreground hover:text-primary transition-colors"
              >
                {copiedEmail ? (
                  <><Check className="w-3 h-3" /> Copied</>
                ) : (
                  <><Copy className="w-3 h-3" /> Copy email</>
                )}
              </button>
            </div>
          </div>

          {/* Right side: amount + status + cancel */}
          <div className="text-right flex-shrink-0 space-y-1.5">
            <p className="text-sm font-semibold">{formatPrice(booking.amountCents)}</p>
            {isPast && isRefunded && (
              <Badge variant="secondary" className="text-[10px] h-4 px-1.5">Refunded</Badge>
            )}
            {isPast && isCancelled && (
              <Badge variant="secondary" className="text-[10px] h-4 px-1.5">Cancelled</Badge>
            )}
            {onCancel && !isPast && booking.bookingStatus === 'confirmed' && (
              <Button
                size="sm"
                variant="outline"
                className="h-6 text-[10px] px-2 text-destructive border-destructive/30 hover:bg-destructive/10"
                onClick={() => setShowCancelConfirm(true)}
                disabled={isCancelling}
              >
                Cancel & Refund
              </Button>
            )}
          </div>
        </div>
      </div>

      <AlertDialog open={showCancelConfirm} onOpenChange={setShowCancelConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel this booking?</AlertDialogTitle>
            <AlertDialogDescription>
              A full refund of {formatPrice(booking.amountCents)} will be processed and {booking.guestName} will be notified by email. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Booking</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => { onCancel(); setShowCancelConfirm(false); }}
              disabled={isCancelling}
            >
              {isCancelling ? 'Cancelling...' : 'Cancel & Refund'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// --- Booking List (groups bookings by date) ---

function BookingList({
  bookings,
  isPast,
  onCancel,
  isCancelling,
}: {
  bookings: BookingItem[];
  isPast: boolean;
  onCancel?: (bookingId: string) => void;
  isCancelling?: boolean;
}) {
  const grouped = useMemo(() => {
    const groups: Array<{ date: string; bookings: BookingItem[] }> = [];
    let currentDate = '';
    let currentGroup: BookingItem[] = [];

    for (const b of bookings) {
      if (b.date !== currentDate) {
        if (currentGroup.length > 0) {
          groups.push({ date: currentDate, bookings: currentGroup });
        }
        currentDate = b.date;
        currentGroup = [b];
      } else {
        currentGroup.push(b);
      }
    }
    if (currentGroup.length > 0) {
      groups.push({ date: currentDate, bookings: currentGroup });
    }
    return groups;
  }, [bookings]);

  if (bookings.length === 0) {
    return (
      <Card className="border-0 shadow-sm">
        <CardContent className="p-8 text-center">
          <p className="text-sm text-muted-foreground">
            {isPast ? 'No past bookings yet.' : 'No upcoming bookings.'}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {grouped.map(({ date, bookings: dateBookings }) => (
        <div key={date}>
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">
            {date ? fmtDateHeading(date) : 'No date'}
          </h3>
          <div className="space-y-2">
            {dateBookings.map(booking => (
              <BookingCard
                key={booking.id}
                booking={booking}
                isPast={isPast}
                onCancel={onCancel ? () => onCancel(booking.id) : undefined}
                isCancelling={isCancelling}
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

  const {
    pendingRequests,
    awaitingPayment,
    upcomingBookings,
    pastBookings,
    isLoading,
    acceptRequest,
    declineRequest,
    cancelBooking,
    pendingCount,
    awaitingPaymentCount,
  } = useBookingManagement();

  const getInitialTab = () => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'requests' || tabParam === 'awaiting' || tabParam === 'upcoming' || tabParam === 'past') return tabParam;
    // Legacy tab param support
    if (tabParam === 'pending') return 'requests';
    if (pendingCount > 0) return 'requests';
    if (awaitingPaymentCount > 0) return 'awaiting';
    return 'upcoming';
  };

  const [activeTab, setActiveTab] = useState<string | null>(null);
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

  const handleCancelBooking = async (bookingId: string) => {
    try {
      await cancelBooking.mutateAsync(bookingId);
      toast({ title: 'Booking cancelled', description: 'A full refund has been issued and the guest notified.' });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to cancel booking.', variant: 'destructive' });
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
            <TabsTrigger value="requests" className="text-xs">
              Requests
              {pendingCount > 0 && (
                <span className="ml-1.5 flex items-center justify-center min-w-[18px] h-4 px-1 rounded-full text-[10px] font-medium bg-destructive text-destructive-foreground">
                  {pendingCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="awaiting" className="text-xs">
              Awaiting Payment
              {awaitingPaymentCount > 0 && (
                <span className="ml-1.5 flex items-center justify-center min-w-[18px] h-4 px-1 rounded-full text-[10px] font-medium bg-warning/20 text-warning">
                  {awaitingPaymentCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="upcoming" className="text-xs">
              Upcoming
              {upcomingBookings.length > 0 && (
                <span className="ml-1.5 text-[10px] text-muted-foreground">
                  ({upcomingBookings.length})
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="past" className="text-xs">
              Past
            </TabsTrigger>
          </TabsList>

          {/* Pending Requests Tab */}
          <TabsContent value="requests" className="mt-0">
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

          {/* Awaiting Payment Tab */}
          <TabsContent value="awaiting" className="mt-0">
            {awaitingPayment.length === 0 ? (
              <Card className="border-0 shadow-sm">
                <CardContent className="p-8 text-center">
                  <h4 className="font-medium mb-2">No bookings awaiting payment</h4>
                  <p className="text-sm text-muted-foreground">
                    When you accept a request, the guest receives a payment link. They'll appear here until they pay.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {awaitingPayment.map(item => (
                  <AwaitingPaymentCard key={item.id} item={item} />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Upcoming Bookings Tab */}
          <TabsContent value="upcoming" className="mt-0">
            <BookingList
              bookings={upcomingBookings}
              isPast={false}
              onCancel={handleCancelBooking}
              isCancelling={cancelBooking.isPending}
            />
          </TabsContent>

          {/* Past Bookings Tab */}
          <TabsContent value="past" className="mt-0">
            <BookingList bookings={pastBookings} isPast={true} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
