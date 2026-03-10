import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { CreditCard, Plus, Check, Loader2, Search } from 'lucide-react';
import { format } from 'date-fns';

const WIDGET_API = import.meta.env.VITE_WIDGET_API_URL || 'https://book.veyond.eu';

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

interface Partner {
  id: string;
  name: string;
}

async function getAuthHeaders(): Promise<HeadersInit> {
  const { data: { session } } = await supabase.auth.getSession();
  return {
    'Content-Type': 'application/json',
    ...(session?.access_token ? { Cookie: `sb-access-token=${session.access_token}; sb-refresh-token=${session.refresh_token}` } : {}),
  };
}

function usePayouts() {
  return useQuery({
    queryKey: ['admin-payouts'],
    queryFn: async () => {
      // Fetch payouts and partners in parallel
      const [payoutsRes, partnersRes] = await Promise.all([
        supabase
          .from('hotel_payouts')
          .select('*')
          .order('created_at', { ascending: false }),
        supabase
          .from('partners')
          .select('id, name'),
      ]);

      if (payoutsRes.error) throw payoutsRes.error;

      const partnerMap = new Map(
        (partnersRes.data || []).map((p: any) => [p.id, p.name])
      );

      // Get booking counts per payout
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

function useHotelPartners() {
  return useQuery({
    queryKey: ['admin-hotel-partners'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('partners')
        .select('id, name')
        .eq('partner_type', 'hotel')
        .order('name');

      if (error) throw error;
      return (data || []) as Partner[];
    },
  });
}

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

      const res = await fetch(`${WIDGET_API}/api/admin/hotel-payouts/${payout.id}`, {
        method: 'PATCH',
        headers: await getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({
          status: 'paid',
          paymentRef: paymentRef || undefined,
          paymentMethod,
          notes: notes || undefined,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Failed' }));
        throw new Error(err.error || 'Failed to mark as paid');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-payouts'] });
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
              <Label className="text-xs">Payment reference (optional)</Label>
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

function CreatePayoutDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const { data: hotelPartners = [] } = useHotelPartners();
  const [partnerId, setPartnerId] = useState('');
  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`${WIDGET_API}/api/admin/hotel-payouts`, {
        method: 'POST',
        headers: await getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({ partnerId, periodStart, periodEnd }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Failed' }));
        throw new Error(err.error || 'Failed to create payout');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-payouts'] });
      queryClient.invalidateQueries({ queryKey: ['platform-stats'] });
      onOpenChange(false);
      setPartnerId('');
      setPeriodStart('');
      setPeriodEnd('');
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create hotel payout</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-xs text-muted-foreground">
            Finds all completed bookings in the selected period that have not yet been assigned to a payout.
          </p>

          <div className="space-y-1.5">
            <Label className="text-xs">Hotel partner</Label>
            <Select value={partnerId} onValueChange={setPartnerId}>
              <SelectTrigger>
                <SelectValue placeholder="Select hotel..." />
              </SelectTrigger>
              <SelectContent>
                {hotelPartners.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Period start</Label>
              <Input
                type="date"
                value={periodStart}
                onChange={(e) => setPeriodStart(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Period end</Label>
              <Input
                type="date"
                value={periodEnd}
                onChange={(e) => setPeriodEnd(e.target.value)}
              />
            </div>
          </div>

          {mutation.error && (
            <p className="text-xs text-destructive">
              {(mutation.error as Error).message}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending || !partnerId || !periodStart || !periodEnd}
          >
            {mutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Plus className="h-4 w-4 mr-1.5" />
                Create payout
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function Payouts() {
  const { data: payouts = [], isLoading } = usePayouts();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [markPaidPayout, setMarkPaidPayout] = useState<Payout | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

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

  const pendingTotal = useMemo(
    () => payouts.filter((p) => p.status === 'pending').reduce((s, p) => s + p.amount_cents, 0),
    [payouts]
  );

  const pendingCount = payouts.filter((p) => p.status === 'pending').length;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Hotel payouts</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage hotel commission payouts. Create payouts for a period, then mark them as paid after transferring.
          </p>
        </div>
        <Button size="sm" onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-1.5" />
          Create payout
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4 max-w-sm">
        <Card className="border border-border">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Pending</p>
            <p className="text-xl font-semibold">{formatPrice(pendingTotal)}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {pendingCount} {pendingCount === 1 ? 'payout' : 'payouts'}
            </p>
          </CardContent>
        </Card>
        <Card className="border border-border">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Total payouts</p>
            <p className="text-xl font-semibold">{payouts.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search partner..."
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

      {/* Payouts table */}
      <Card className="border border-border">
        <CardContent className="p-0">
          {isLoading ? (
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
                  : 'No payouts yet. Create one to get started.'}
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
                  <TableHead>Paid</TableHead>
                  <TableHead className="w-[100px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((payout) => (
                  <TableRow key={payout.id}>
                    <TableCell className="font-medium">{payout.partner_name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(payout.period_start)} — {formatDate(payout.period_end)}
                    </TableCell>
                    <TableCell className="text-sm">{payout.booking_count}</TableCell>
                    <TableCell className="font-medium">
                      {formatPrice(payout.amount_cents)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={payout.status === 'paid' ? 'default' : 'secondary'}
                        className={payout.status === 'paid' ? 'bg-success text-xs' : 'text-xs'}
                      >
                        {payout.status === 'paid' ? 'Paid' : 'Pending'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {payout.paid_at ? formatDate(payout.paid_at) : '—'}
                    </TableCell>
                    <TableCell>
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
                      {payout.status === 'paid' && payout.payment_ref && (
                        <span className="text-xs text-muted-foreground">
                          {payout.payment_ref}
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <MarkPaidDialog
        payout={markPaidPayout}
        open={!!markPaidPayout}
        onOpenChange={(open) => !open && setMarkPaidPayout(null)}
      />

      <CreatePayoutDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
      />
    </div>
  );
}
