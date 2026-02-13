import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { useToast } from '@/hooks/use-toast';
import { useSessionDetail, type SessionUpdate } from '@/hooks/useSessionDetail';
import { formatPrice } from '@/lib/pricing';
import { getLanguageName, getLanguageFlag } from '@/components/LanguageSelector';

export default function SessionDetail() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const {
    session,
    experience,
    guests,
    bookingsCount,
    isLoading,
    isLoadingGuests,
    error,
    updateSession,
    deleteSession,
    cancelSession,
  } = useSessionDetail(sessionId || '');

  // Edit states
  const [isEditingPricing, setIsEditingPricing] = useState(false);
  const [editPriceEuros, setEditPriceEuros] = useState('');
  const [editPriceNote, setEditPriceNote] = useState('');

  // Confirmation dialogs
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [pendingUpdate, setPendingUpdate] = useState<SessionUpdate | null>(null);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-alt">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (error || !session || !experience) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-alt">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Session not found</p>
          <Button onClick={() => navigate('/supplier/dashboard')}>
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const hasBookings = bookingsCount > 0;
  const hasCustomPrice = session.price_override_cents !== null;
  const currentPrice = hasCustomPrice ? session.price_override_cents! : experience.price_cents;
  const isCancelled = session.session_status === 'cancelled';

  const getStatusBadge = () => {
    switch (session.session_status) {
      case 'available':
        return <Badge className="bg-success/10 text-success hover:bg-success/20">Available</Badge>;
      case 'booked':
        return <Badge className="bg-primary/10 text-primary hover:bg-primary/20">Booked</Badge>;
      case 'cancelled':
        return <Badge variant="secondary">Cancelled</Badge>;
      default:
        return null;
    }
  };

  // Pricing editing
  const handleStartEditPricing = () => {
    setEditPriceEuros(hasCustomPrice ? (session.price_override_cents! / 100).toString() : '');
    setEditPriceNote(session.price_note || '');
    setIsEditingPricing(true);
  };

  const handleSavePricing = () => {
    const updates: SessionUpdate = {
      price_override_cents: editPriceEuros ? Math.round(parseFloat(editPriceEuros) * 100) : null,
      price_note: editPriceNote || null,
    };

    if (hasBookings) {
      setPendingUpdate(updates);
      setShowSaveConfirm(true);
    } else {
      confirmUpdate(updates);
    }
  };

  const handleClearPricing = () => {
    const updates: SessionUpdate = {
      price_override_cents: null,
      price_note: null,
    };

    if (hasBookings) {
      setPendingUpdate(updates);
      setShowSaveConfirm(true);
    } else {
      confirmUpdate(updates);
    }
  };

  const confirmUpdate = async (updates: SessionUpdate) => {
    try {
      await updateSession.mutateAsync(updates);
      toast({ title: 'Session updated' });
      setIsEditingCapacity(false);
      setIsEditingPricing(false);
      setShowSaveConfirm(false);
      setPendingUpdate(null);
    } catch (error) {
      toast({
        title: 'Error updating session',
        description: 'Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async () => {
    try {
      await deleteSession.mutateAsync();
      toast({ title: 'Session deleted' });
      navigate(`/supplier/experiences/${session.experience_id}`);
    } catch (error: any) {
      toast({
        title: 'Error deleting session',
        description: error?.message || 'Cannot delete. Refund guests and remove all bookings first.',
        variant: 'destructive',
      });
    }
  };

  const handleCancel = async () => {
    try {
      await cancelSession.mutateAsync();
      toast({ title: 'Session cancelled' });
      setShowCancelConfirm(false);
    } catch (error) {
      toast({
        title: 'Error cancelling session',
        description: 'Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="min-h-screen bg-background-alt">
      {/* Header */}
      <header className="bg-background border-b sticky top-0 z-10">
        <div className="container max-w-3xl mx-auto px-4 py-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/supplier/experiences/${session.experience_id}`)}
            className="mb-3"
          >
            Back to {experience.title}
          </Button>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-xl font-semibold">
                {format(new Date(session.session_date), 'EEEE, d MMMM yyyy')}
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                {session.start_time.slice(0, 5)} · {experience.duration_minutes} min
              </p>
            </div>
            {getStatusBadge()}
          </div>
        </div>
      </header>

      <main className="container max-w-3xl mx-auto px-4 py-6 space-y-6">
        {/* Capacity Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
              Capacity
            </CardTitle>
          </CardHeader>
          <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Bookings</span>
                  <span className="text-2xl font-semibold">{bookingsCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <span className="text-lg font-semibold">
                    {session.session_status === 'booked' ? 'Booked' : session.session_status === 'cancelled' ? 'Cancelled' : 'Available'}
                  </span>
                </div>
                <div className="pt-3 border-t border-border">
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>Max participants</span>
                    <span>{experience.max_participants}</span>
                  </div>
                </div>
              </div>
          </CardContent>
        </Card>

        {/* Pricing Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
              Pricing
            </CardTitle>
            {!isCancelled && !isEditingPricing && (
              <Button variant="ghost" size="sm" onClick={handleStartEditPricing}>
                Edit
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {isEditingPricing ? (
              <div className="space-y-4">
                {hasBookings && (
                  <div className="bg-warning/10 border border-warning/20 rounded-lg p-3">
                    <p className="text-sm text-warning">
                      This session has {bookingsCount} booking{bookingsCount !== 1 ? 's' : ''}. 
                      Price changes affect future bookings only.
                    </p>
                  </div>
                )}
                <div>
                  <Label htmlFor="priceEuros">Price per person (€)</Label>
                  <Input
                    id="priceEuros"
                    type="number"
                    min={0}
                    step={0.01}
                    value={editPriceEuros}
                    onChange={(e) => setEditPriceEuros(e.target.value)}
                    placeholder={`Default: ${(experience.price_cents / 100).toFixed(2)}`}
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="priceNote">Note (optional)</Label>
                  <Input
                    id="priceNote"
                    type="text"
                    value={editPriceNote}
                    onChange={(e) => setEditPriceNote(e.target.value)}
                    placeholder="e.g. Last spots!"
                    className="mt-1.5"
                  />
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleSavePricing} disabled={updateSession.isPending}>
                    {updateSession.isPending ? 'Saving...' : 'Save'}
                  </Button>
                  {hasCustomPrice && (
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={handleClearPricing}
                      disabled={updateSession.isPending}
                    >
                      Use default
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" onClick={() => setIsEditingPricing(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-semibold">{formatPrice(currentPrice)}</span>
                  <span className="text-muted-foreground">per person</span>
                </div>
                {session.price_note && (
                  <p className="text-sm text-muted-foreground">{session.price_note}</p>
                )}
                {hasCustomPrice && (
                  <p className="text-xs text-muted-foreground pt-2">
                    Default: {formatPrice(experience.price_cents)}
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Guests Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
              Guests ({guests.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingGuests ? (
              <div className="py-8 text-center">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto" />
              </div>
            ) : guests.length === 0 ? (
              <p className="text-muted-foreground text-sm py-4">No guests yet</p>
            ) : (
              <div className="space-y-3">
                {guests.map((guest) => (
                  <div 
                    key={guest.id} 
                    className="flex items-center justify-between py-3 border-b border-border last:border-0"
                  >
                    <div>
                      <p className="font-medium">{guest.guest_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {guest.participants} person{guest.participants !== 1 ? 's' : ''}
                        {guest.preferred_language && (
                          <> • {getLanguageFlag(guest.preferred_language)} {getLanguageName(guest.preferred_language)}</>
                        )}
                      </p>
                    </div>
                    <div className="text-right">
                      {guest.booking ? (
                        <>
                          <Badge 
                            className={
                              guest.booking.booking_status === 'confirmed' 
                                ? 'bg-success/10 text-success' 
                                : 'bg-muted text-muted-foreground'
                            }
                          >
                            {guest.booking.booking_status === 'confirmed' ? 'Paid' : guest.booking.booking_status}
                          </Badge>
                          <p className="text-sm font-medium mt-1">
                            {formatPrice(guest.booking.amount_cents)}
                          </p>
                        </>
                      ) : (
                        <Badge variant="outline">{guest.reservation_status}</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Danger Zone */}
        {!isCancelled && (
          <Card className="border-destructive/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
                Danger Zone
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!hasBookings ? (
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Permanently delete this session.
                  </p>
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    onClick={() => setShowDeleteConfirm(true)}
                    disabled={deleteSession.isPending}
                  >
                    Delete Session
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="bg-warning/10 border border-warning/20 rounded-lg p-3">
                    <p className="text-sm text-muted-foreground">
                      Cannot delete session with bookings. Cancel it instead to notify and refund guests.
                    </p>
                  </div>
                  <div className="flex justify-end">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setShowCancelConfirm(true)}
                      disabled={cancelSession.isPending}
                    >
                      Cancel Session
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </main>

      {/* Save Confirmation Dialog (for sessions with bookings) */}
      <AlertDialog open={showSaveConfirm} onOpenChange={setShowSaveConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm changes</AlertDialogTitle>
            <AlertDialogDescription>
              This session has {bookingsCount} guest{bookingsCount !== 1 ? 's' : ''} booked. 
              These changes will affect future visibility of this session.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingUpdate(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => pendingUpdate && confirmUpdate(pendingUpdate)}
              disabled={updateSession.isPending}
            >
              {updateSession.isPending ? 'Saving...' : 'Confirm Changes'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={(open) => { setShowDeleteConfirm(open); if (!open) setDeleteConfirmText(''); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete session?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove this session. This action cannot be undone.
              Type <strong>delete</strong> below to confirm.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Input
            placeholder="Type delete to confirm"
            value={deleteConfirmText}
            onChange={(e) => setDeleteConfirmText(e.target.value)}
            className="mt-2"
            autoComplete="off"
          />
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteSession.isPending || deleteConfirmText !== 'delete'}
            >
              {deleteSession.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Cancel Confirmation Dialog */}
      <AlertDialog open={showCancelConfirm} onOpenChange={setShowCancelConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel session?</AlertDialogTitle>
            <AlertDialogDescription>
              Guests will be notified and refunded. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Session</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleCancel}
              disabled={cancelSession.isPending}
            >
              {cancelSession.isPending ? 'Cancelling...' : 'Cancel Session'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}
