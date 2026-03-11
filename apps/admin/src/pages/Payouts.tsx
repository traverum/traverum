import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatPrice, formatDate } from '@/lib/utils';
import {
  CreditCard,
  Plus,
  Check,
  Loader2,
  Search,
  AlertCircle,
  ArrowRight,
  Pencil,
  Trash2,
  Undo2,
} from 'lucide-react';
import { fetchAdminJson } from '@/lib/adminApi';
import { PayoutStatusBadge } from '@/components/payouts/PayoutStatusBadge';

// ─── Types ──────────────────────────────────────────────────

interface Payout {
  id: string;
  partner_id: string;
  period_start: string;
  period_end: string;
  amount_cents: number;
  currency: string;
  status: string;
  paid_at: string | null;
  payment_ref: string | null;
  payment_method: string | null;
  notes: string | null;
  created_at: string;
  booking_count: number;
  partner_name?: string;
}

interface PendingObligation {
  hotelId: string;
  hotelName: string;
  month: string;
  monthLabel: string;
  amountCents: number;
  bookingCount: number;
  periodStart: string;
  periodEnd: string;
}

interface PendingResponse {
  pending: PendingObligation[];
  totalOwedCents: number;
  totalBookings: number;
}

// ─── Hooks ──────────────────────────────────────────────────

function usePendingObligations() {
  return useQuery({
    queryKey: ['admin-pending-obligations'],
    queryFn: () => fetchAdminJson<PendingResponse>('/api/admin/hotel-payouts/pending'),
  });
}

function usePayouts() {
  return useQuery({
    queryKey: ['admin-payouts'],
    queryFn: async () => {
      const [payoutsRes, partnersRes] = await Promise.all([
        supabase
          .from('hotel_payouts')
          .select('*')
          .order('created_at', { ascending: false }),
        supabase.from('partners').select('id, name'),
      ]);

      if (payoutsRes.error) throw payoutsRes.error;

      const partnerMap = new Map(
        (partnersRes.data || []).map((p: any) => [p.id, p.name])
      );

      const payoutIds = (payoutsRes.data || []).map((p: any) => p.id);
      let bookingCounts: Record<string, number> = {};

      if (payoutIds.length > 0) {
        const { data: bookings } = await supabase
          .from('bookings')
          .select('hotel_payout_id')
          .in('hotel_payout_id', payoutIds);

        for (const row of bookings || []) {
          const pid = (row as any).hotel_payout_id;
          bookingCounts[pid] = (bookingCounts[pid] || 0) + 1;
        }
      }

      return (payoutsRes.data || []).map((p: any) => ({
        ...p,
        partner_name: partnerMap.get(p.partner_id) || 'Unknown',
        booking_count: bookingCounts[p.id] || 0,
      })) as Payout[];
    },
  });
}

// ─── Dialogs ────────────────────────────────────────────────

function MarkPaidDialog({
  payout,
  open,
  onOpenChange,
}: {
  payout: Payout | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const [paymentRef, setPaymentRef] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('bank_transfer');
  const [notes, setNotes] = useState('');

  const mutation = useMutation({
    mutationFn: async () => {
      if (!payout) return;

      await fetchAdminJson(`/api/admin/hotel-payouts/${payout.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: 'paid',
          paymentRef: paymentRef || undefined,
          paymentMethod,
          notes: notes || undefined,
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-payouts'] });
      queryClient.invalidateQueries({ queryKey: ['admin-pending-obligations'] });
      queryClient.invalidateQueries({ queryKey: ['platform-stats'] });
      onOpenChange(false);
      setPaymentRef('');
      setNotes('');
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Mark payout as paid</DialogTitle>
        </DialogHeader>

        {payout && (
          <div className="space-y-4">
            <div className="bg-accent/50 rounded-sm p-3 space-y-1">
              <p className="text-sm font-medium">{payout.partner_name}</p>
              <p className="text-xs text-muted-foreground">
                {formatDate(payout.period_start)} — {formatDate(payout.period_end)}
              </p>
              <p className="text-lg font-semibold">{formatPrice(payout.amount_cents)}</p>
              <p className="text-xs text-muted-foreground">
                {payout.booking_count} {payout.booking_count === 1 ? 'booking' : 'bookings'}
              </p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Payment method</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bank_transfer">Bank transfer</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Payment reference</Label>
              <Input
                placeholder="e.g. transfer ID, IBAN ref..."
                value={paymentRef}
                onChange={(e) => setPaymentRef(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Notes (optional)</Label>
              <Input
                placeholder="Internal notes..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            {mutation.error && (
              <p className="text-xs text-destructive">
                {(mutation.error as Error).message}
              </p>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={() => mutation.mutate()} disabled={mutation.isPending}>
            {mutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Check className="h-4 w-4 mr-1.5" />
                Mark as paid
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EditPayoutDialog({
  payout,
  open,
  onOpenChange,
}: {
  payout: Payout | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const [paymentRef, setPaymentRef] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('bank_transfer');
  const [notes, setNotes] = useState('');

  // Sync form when dialog opens with a payout
  useEffect(() => {
    if (open && payout) {
      setPaymentRef(payout.payment_ref || '');
      setPaymentMethod(payout.payment_method || 'bank_transfer');
      setNotes(payout.notes || '');
    }
  }, [open, payout?.id, payout?.payment_ref, payout?.payment_method, payout?.notes]);

  const mutation = useMutation({
    mutationFn: async () => {
      if (!payout) return;

      await fetchAdminJson(`/api/admin/hotel-payouts/${payout.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          paymentRef,
          paymentMethod,
          notes,
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-payouts'] });
      onOpenChange(false);
    },
  });

  const revertMutation = useMutation({
    mutationFn: async () => {
      if (!payout) return;

      await fetchAdminJson(`/api/admin/hotel-payouts/${payout.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'pending' }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-payouts'] });
      queryClient.invalidateQueries({ queryKey: ['admin-pending-obligations'] });
      queryClient.invalidateQueries({ queryKey: ['platform-stats'] });
      onOpenChange(false);
    },
  });

  const [showRevertConfirm, setShowRevertConfirm] = useState(false);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit payout</DialogTitle>
          </DialogHeader>

          {payout && (
            <div className="space-y-4">
              <div className="bg-accent/50 rounded-sm p-3 space-y-1">
                <p className="text-sm font-medium">{payout.partner_name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatDate(payout.period_start)} — {formatDate(payout.period_end)}
                </p>
                <p className="text-lg font-semibold">{formatPrice(payout.amount_cents)}</p>
                <div className="flex items-center gap-2 mt-1">
                  <PayoutStatusBadge status={payout.status} />
                  {payout.paid_at && (
                    <span className="text-xs text-muted-foreground">
                      paid {formatDate(payout.paid_at)}
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Payment method</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bank_transfer">Bank transfer</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Payment reference</Label>
                <Input
                  placeholder="e.g. transfer ID, IBAN ref..."
                  value={paymentRef}
                  onChange={(e) => setPaymentRef(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Notes</Label>
                <Input
                  placeholder="Internal notes..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              {payout.status === 'paid' && (
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs text-amber-600"
                  onClick={() => setShowRevertConfirm(true)}
                  disabled={revertMutation.isPending}
                >
                  <Undo2 className="h-3.5 w-3.5 mr-1" />
                  Revert to pending
                </Button>
              )}

              {(mutation.error || revertMutation.error) && (
                <p className="text-xs text-destructive">
                  {((mutation.error || revertMutation.error) as Error).message}
                </p>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={() => mutation.mutate()} disabled={mutation.isPending}>
              {mutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Check className="h-4 w-4 mr-1.5" />
                  Save changes
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showRevertConfirm} onOpenChange={setShowRevertConfirm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Revert to pending?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This will mark the payout as unpaid. The paid date will be cleared.
            The bookings will remain linked to this payout.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRevertConfirm(false)}>
              Cancel
            </Button>
            <Button
              variant="default"
              onClick={() => revertMutation.mutate()}
              disabled={revertMutation.isPending}
            >
              {revertMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Revert to pending'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function DeletePayoutDialog({
  payout,
  open,
  onOpenChange,
}: {
  payout: Payout | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async () => {
      if (!payout) return;

      await fetchAdminJson(`/api/admin/hotel-payouts/${payout.id}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-payouts'] });
      queryClient.invalidateQueries({ queryKey: ['admin-pending-obligations'] });
      queryClient.invalidateQueries({ queryKey: ['platform-stats'] });
      onOpenChange(false);
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Delete this payout?</DialogTitle>
        </DialogHeader>
        {payout && (
          <p className="text-sm text-muted-foreground">
            This will permanently delete the payout for{' '}
            <strong>{payout.partner_name}</strong> ({formatPrice(payout.amount_cents)},{' '}
            {formatDate(payout.period_start)} — {formatDate(payout.period_end)}).
            <br /><br />
            The {payout.booking_count} linked{' '}
            {payout.booking_count === 1 ? 'booking' : 'bookings'} will be unlinked
            and return to the pending obligations view.
          </p>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
          >
            {mutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-1.5" />
                Delete payout
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CreatePayoutFromPendingDialog({
  obligation,
  open,
  onOpenChange,
}: {
  obligation: PendingObligation | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const [paymentRef, setPaymentRef] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('bank_transfer');
  const [notes, setNotes] = useState('');
  const [step, setStep] = useState<'review' | 'paid'>('review');
  const [createdPayout, setCreatedPayout] = useState<Payout | null>(null);

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!obligation) return;

      return await fetchAdminJson<{ payout: any; bookingCount: number; amountCents: number }>(
        '/api/admin/hotel-payouts',
        {
          method: 'POST',
          body: JSON.stringify({
            partnerId: obligation.hotelId,
            periodStart: obligation.periodStart,
            periodEnd: obligation.periodEnd,
          }),
        }
      );
    },
    onSuccess: (result) => {
      if (result?.payout) {
        setCreatedPayout({
          ...result.payout,
          partner_name: obligation?.hotelName,
          booking_count: result.bookingCount,
        });
        setStep('paid');
      }
      queryClient.invalidateQueries({ queryKey: ['admin-payouts'] });
      queryClient.invalidateQueries({ queryKey: ['admin-pending-obligations'] });
      queryClient.invalidateQueries({ queryKey: ['platform-stats'] });
    },
  });

  const markPaidMutation = useMutation({
    mutationFn: async () => {
      if (!createdPayout) return;

      await fetchAdminJson(`/api/admin/hotel-payouts/${createdPayout.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: 'paid',
          paymentRef: paymentRef || undefined,
          paymentMethod,
          notes: notes || undefined,
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-payouts'] });
      queryClient.invalidateQueries({ queryKey: ['admin-pending-obligations'] });
      queryClient.invalidateQueries({ queryKey: ['platform-stats'] });
      handleClose();
    },
  });

  function handleClose() {
    onOpenChange(false);
    setStep('review');
    setCreatedPayout(null);
    setPaymentRef('');
    setNotes('');
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {step === 'review' ? 'Create payout' : 'Record payment'}
          </DialogTitle>
        </DialogHeader>

        {obligation && step === 'review' && (
          <div className="space-y-4">
            <div className="bg-accent/50 rounded-sm p-3 space-y-1">
              <p className="text-sm font-medium">{obligation.hotelName}</p>
              <p className="text-xs text-muted-foreground">{obligation.monthLabel}</p>
              <p className="text-lg font-semibold">{formatPrice(obligation.amountCents)}</p>
              <p className="text-xs text-muted-foreground">
                {obligation.bookingCount}{' '}
                {obligation.bookingCount === 1 ? 'booking' : 'bookings'}
              </p>
            </div>

            <p className="text-xs text-muted-foreground">
              This will create a payout record for {obligation.monthLabel} and link all
              {' '}{obligation.bookingCount} completed{' '}
              {obligation.bookingCount === 1 ? 'booking' : 'bookings'} to it.
              You can then mark it as paid with a payment reference.
            </p>

            {createMutation.error && (
              <p className="text-xs text-destructive">
                {(createMutation.error as Error).message}
              </p>
            )}
          </div>
        )}

        {step === 'paid' && createdPayout && (
          <div className="space-y-4">
            <div className="bg-emerald-50 dark:bg-emerald-950/20 rounded-sm p-3 space-y-1">
              <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">
                Payout created
              </p>
              <p className="text-sm font-medium">{obligation?.hotelName}</p>
              <p className="text-lg font-semibold">{formatPrice(createdPayout.amount_cents)}</p>
            </div>

            <p className="text-xs text-muted-foreground">
              Transfer the amount to the hotel, then record the payment details below.
              You can also do this later from the payouts table.
            </p>

            <div className="space-y-1.5">
              <Label className="text-xs">Payment method</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bank_transfer">Bank transfer</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Payment reference</Label>
              <Input
                placeholder="e.g. transfer ID, IBAN ref..."
                value={paymentRef}
                onChange={(e) => setPaymentRef(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Notes (optional)</Label>
              <Input
                placeholder="Internal notes..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            {markPaidMutation.error && (
              <p className="text-xs text-destructive">
                {(markPaidMutation.error as Error).message}
              </p>
            )}
          </div>
        )}

        <DialogFooter>
          {step === 'review' && (
            <>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                onClick={() => createMutation.mutate()}
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-1.5" />
                    Create payout
                  </>
                )}
              </Button>
            </>
          )}
          {step === 'paid' && (
            <>
              <Button variant="outline" onClick={handleClose}>
                Mark later
              </Button>
              <Button
                onClick={() => markPaidMutation.mutate()}
                disabled={markPaidMutation.isPending}
              >
                {markPaidMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-1.5" />
                    Mark as paid
                  </>
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Page ──────────────────────────────────────────────

export default function Payouts() {
  const { data: pendingData, isLoading: pendingLoading } = usePendingObligations();
  const { data: payouts = [], isLoading: payoutsLoading } = usePayouts();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [markPaidPayout, setMarkPaidPayout] = useState<Payout | null>(null);
  const [editPayout, setEditPayout] = useState<Payout | null>(null);
  const [deletePayout, setDeletePayout] = useState<Payout | null>(null);
  const [selectedObligation, setSelectedObligation] = useState<PendingObligation | null>(null);

  const filtered = useMemo(() => {
    return payouts.filter((p) => {
      if (statusFilter !== 'all' && p.status !== statusFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!(p.partner_name || '').toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [payouts, statusFilter, search]);

  const pendingPayoutsTotal = useMemo(
    () =>
      payouts
        .filter((p) => p.status === 'pending')
        .reduce((s, p) => s + p.amount_cents, 0),
    [payouts]
  );

  const pendingPayoutsCount = payouts.filter((p) => p.status === 'pending').length;
  const pending = pendingData?.pending || [];
  const totalOwedCents = pendingData?.totalOwedCents || 0;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-foreground">Hotel payouts</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Track hotel commission obligations, create payouts, and record payments.
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4 max-w-2xl">
        <Card className="border border-border">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Owed to hotels</p>
            <p className="text-xl font-semibold text-foreground">
              {formatPrice(totalOwedCents)}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {pendingData?.totalBookings || 0} completed bookings
            </p>
          </CardContent>
        </Card>
        <Card className="border border-border">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Payouts created</p>
            <p className="text-xl font-semibold text-foreground">
              {formatPrice(pendingPayoutsTotal)}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {pendingPayoutsCount} pending transfer{pendingPayoutsCount !== 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>
        <Card className="border border-border">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Total paid</p>
            <p className="text-xl font-semibold text-foreground">
              {formatPrice(
                payouts
                  .filter((p) => p.status === 'paid')
                  .reduce((s, p) => s + p.amount_cents, 0)
              )}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {payouts.filter((p) => p.status === 'paid').length} completed payout
              {payouts.filter((p) => p.status === 'paid').length !== 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Pending obligations */}
      <div className="space-y-2">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">
          Pending obligations
        </h2>

        {pendingLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : pending.length === 0 ? (
          <Card className="border border-border">
            <CardContent className="p-6 text-center">
              <Check className="h-6 w-6 text-emerald-500 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                No unpaid hotel commissions. All caught up.
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card className="border border-border">
            <CardContent className="p-0 divide-y divide-border">
              {pending.map((ob) => (
                <div
                  key={`${ob.hotelId}-${ob.month}`}
                  className="flex items-center justify-between px-4 py-3 hover:bg-accent/30 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" />
                      <p className="text-sm font-medium text-foreground truncate">
                        {ob.hotelName}
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 ml-5.5">
                      {ob.monthLabel} — {ob.bookingCount}{' '}
                      {ob.bookingCount === 1 ? 'booking' : 'bookings'}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <p className="text-sm font-semibold text-foreground">
                      {formatPrice(ob.amountCents)}
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs"
                      onClick={() => setSelectedObligation(ob)}
                    >
                      Create payout
                      <ArrowRight className="h-3.5 w-3.5 ml-1" />
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Payout history */}
      <div className="space-y-2">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">
          Payout history
        </h2>

        <div className="flex items-center gap-3">
          <div className="relative max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search hotel..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Card className="border border-border">
          <CardContent className="p-0">
            {payoutsLoading ? (
              <div className="p-6 space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="p-8 text-center">
                <CreditCard className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  {search || statusFilter !== 'all'
                    ? 'No payouts match your filters.'
                    : 'No payouts yet. Create one from the pending obligations above.'}
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Hotel</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead>Bookings</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Paid on</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead className="w-[100px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((payout) => (
                    <TableRow key={payout.id}>
                      <TableCell className="font-medium">
                        {payout.partner_name}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(payout.period_start)} —{' '}
                        {formatDate(payout.period_end)}
                      </TableCell>
                      <TableCell className="text-sm">
                        {payout.booking_count}
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatPrice(payout.amount_cents)}
                      </TableCell>
                      <TableCell>
                        <PayoutStatusBadge status={payout.status} />
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {payout.paid_at ? formatDate(payout.paid_at) : '—'}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[140px] truncate">
                        {payout.payment_ref || '—'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {payout.status === 'pending' && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs"
                              onClick={() => setMarkPaidPayout(payout)}
                            >
                              <Check className="h-3.5 w-3.5 mr-1" />
                              Pay
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs h-8 w-8 p-0"
                            onClick={() => setEditPayout(payout)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                            onClick={() => setDeletePayout(payout)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <MarkPaidDialog
        payout={markPaidPayout}
        open={!!markPaidPayout}
        onOpenChange={(open) => !open && setMarkPaidPayout(null)}
      />

      <EditPayoutDialog
        payout={editPayout}
        open={!!editPayout}
        onOpenChange={(open) => !open && setEditPayout(null)}
      />

      <DeletePayoutDialog
        payout={deletePayout}
        open={!!deletePayout}
        onOpenChange={(open) => !open && setDeletePayout(null)}
      />

      <CreatePayoutFromPendingDialog
        obligation={selectedObligation}
        open={!!selectedObligation}
        onOpenChange={(open) => !open && setSelectedObligation(null)}
      />
    </div>
  );
}
