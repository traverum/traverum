import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Building2, ExternalLink, Pencil, ReceiptText, Search, Wallet } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { fetchAdminJson } from '@/lib/adminApi';
import { formatDate, formatPrice } from '@/lib/utils';
import { PayoutStatusBadge } from '@/components/payouts/PayoutStatusBadge';

const DASHBOARD_URL =
  import.meta.env.VITE_DASHBOARD_URL || 'https://dashboard.traverum.com';
const STRIPE_DASHBOARD_URL =
  import.meta.env.VITE_STRIPE_DASHBOARD_URL || 'https://dashboard.stripe.com';

type DetailTab = 'overview' | 'commissions' | 'payment-log' | 'payouts' | 'analytics';

interface Partner {
  id: string;
  name: string;
  email: string;
  partner_type: string;
  has_hotel_config?: boolean;
  has_experiences?: boolean;
  city: string | null;
  country: string | null;
  stripe_account_id: string | null;
  stripe_onboarding_complete: boolean | null;
  created_at: string | null;
}

interface PartnerSummary {
  earnedCents: number;
  paidCents: number;
  pendingCents: number;
  pendingFromEarningsCents: number;
  completedBookingCount: number;
  unassignedBookingCount: number;
  payoutCount: number;
  paidPayoutCount: number;
  pendingPayoutCount: number;
  reconciliationMismatchCount: number;
}

interface CommissionRate {
  experienceId: string | null;
  experienceTitle: string;
  supplier: number;
  hotel: number;
  platform: number;
}

interface DistributionRow {
  id: string;
  experienceId: string;
  experienceTitle: string;
  experiencePartnerId: string | null;
  hotelConfigId: string | null;
  hotelConfigName: string;
  hotelId: string;
  commissionSupplier: number;
  commissionHotel: number;
  commissionPlatform: number;
  isActive: boolean;
  sortOrder: number | null;
}

interface DistributionsResponse {
  distributions: DistributionRow[];
}

interface SummaryResponse {
  partner: Partner;
  summary: PartnerSummary;
  commissionRates: CommissionRate[];
}

interface PayoutRow {
  id: string;
  period_start: string;
  period_end: string;
  amount_cents: number;
  currency: string;
  status: string;
  paid_at: string | null;
  payment_ref: string | null;
  payment_method: string | null;
  notes: string | null;
  created_at: string | null;
  booking_count: number;
}

interface PayoutsResponse {
  payouts: PayoutRow[];
}

interface PaymentLogRow {
  id: string;
  amount_cents: number;
  supplier_amount_cents: number;
  hotel_amount_cents: number;
  platform_amount_cents: number;
  booking_status: string;
  paid_at: string | null;
  stripe_charge_id: string | null;
  stripe_payment_intent_id: string | null;
  stripe_transfer_id: string | null;
  stripe_refund_id: string | null;
  hotel_payout_id: string | null;
  split_matches_total: boolean;
  reservation?: {
    requested_date: string | null;
    session?: {
      session_date: string;
      start_time: string;
    } | null;
    experience?: {
      id: string;
      title: string;
    } | null;
  } | null;
  payout?: {
    id: string;
    status: string;
    payment_ref: string | null;
    paid_at: string | null;
    period_start: string;
    period_end: string;
  } | null;
}

interface PaymentLogResponse {
  rows: PaymentLogRow[];
  count: number;
  limit: number;
}

function getSessionDate(row: PaymentLogRow): string | null {
  return row.reservation?.session?.session_date || row.reservation?.requested_date || null;
}

export default function PartnerDetail() {
  const { partnerId } = useParams<{ partnerId: string }>();
  const [activeTab, setActiveTab] = useState<DetailTab>('overview');
  const [paymentSearch, setPaymentSearch] = useState('');
  const [linkedFilter, setLinkedFilter] = useState<'all' | 'linked' | 'unlinked'>('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paidFrom, setPaidFrom] = useState('');
  const [paidTo, setPaidTo] = useState('');

  const { data: summaryData, isLoading: summaryLoading, error: summaryError } = useQuery({
    queryKey: ['admin-partner-summary', partnerId],
    queryFn: () =>
      fetchAdminJson<SummaryResponse>(`/api/admin/partners/${partnerId}/summary`),
    enabled: !!partnerId,
  });

  const { data: payoutsData, isLoading: payoutsLoading } = useQuery({
    queryKey: ['admin-partner-payouts', partnerId],
    queryFn: () =>
      fetchAdminJson<PayoutsResponse>(`/api/admin/partners/${partnerId}/payouts`),
    enabled: !!partnerId,
  });

  const {
    data: distributionsData,
    isLoading: distributionsLoading,
    error: distributionsError,
  } = useQuery({
    queryKey: ['admin-partner-distributions', partnerId],
    queryFn: () =>
      fetchAdminJson<DistributionsResponse>(`/api/admin/partners/${partnerId}/distributions`),
    enabled: !!partnerId,
  });

  const queryClient = useQueryClient();
  const [editDistribution, setEditDistribution] = useState<DistributionRow | null>(null);
  const [editSupplier, setEditSupplier] = useState('');
  const [editHotel, setEditHotel] = useState('');
  const [editPlatform, setEditPlatform] = useState('');

  const updateDistributionMutation = useMutation({
    mutationFn: async ({
      distributionId,
      commissionSupplier,
      commissionHotel,
      commissionPlatform,
    }: {
      distributionId: string;
      commissionSupplier: number;
      commissionHotel: number;
      commissionPlatform: number;
    }) =>
      fetchAdminJson<{ distribution: unknown }>(
        `/api/admin/partners/${partnerId}/distributions/${distributionId}`,
        {
          method: 'PATCH',
          body: JSON.stringify({
            commissionSupplier,
            commissionHotel,
            commissionPlatform,
          }),
        }
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-partner-distributions', partnerId] });
      queryClient.invalidateQueries({ queryKey: ['admin-partner-summary', partnerId] });
      setEditDistribution(null);
    },
  });

  const openEditCommission = (row: DistributionRow) => {
    setEditDistribution(row);
    setEditSupplier(String(row.commissionSupplier));
    setEditHotel(String(row.commissionHotel));
    setEditPlatform(String(row.commissionPlatform));
  };

  const handleSaveCommission = () => {
    if (!editDistribution) return;
    const s = Number(editSupplier);
    const h = Number(editHotel);
    const p = Number(editPlatform);
    if (s + h + p !== 100) return;
    updateDistributionMutation.mutate({
      distributionId: editDistribution.id,
      commissionSupplier: s,
      commissionHotel: h,
      commissionPlatform: p,
    });
  };

  const distributions = distributionsData?.distributions ?? [];

  const paymentLogPath = useMemo(() => {
    const params = new URLSearchParams();
    if (statusFilter !== 'all') params.set('status', statusFilter);
    if (linkedFilter !== 'all') params.set('linked', linkedFilter);
    if (paidFrom) params.set('paidFrom', paidFrom);
    if (paidTo) params.set('paidTo', paidTo);
    return `/api/admin/partners/${partnerId}/payment-log?${params.toString()}`;
  }, [linkedFilter, paidFrom, paidTo, partnerId, statusFilter]);

  const { data: paymentLogData, isLoading: paymentLogLoading } = useQuery({
    queryKey: [
      'admin-partner-payment-log',
      partnerId,
      statusFilter,
      linkedFilter,
      paidFrom,
      paidTo,
    ],
    queryFn: () => fetchAdminJson<PaymentLogResponse>(paymentLogPath),
    enabled: !!partnerId,
  });

  const partner = summaryData?.partner;
  const summary = summaryData?.summary;
  const payouts = payoutsData?.payouts || [];
  const paymentRows = paymentLogData?.rows || [];

  const filteredPaymentRows = paymentRows.filter((row) => {
    if (!paymentSearch) return true;
    const q = paymentSearch.toLowerCase();
    const title = row.reservation?.experience?.title?.toLowerCase() || '';
    return (
      row.id.toLowerCase().includes(q) ||
      (row.stripe_charge_id || '').toLowerCase().includes(q) ||
      (row.stripe_payment_intent_id || '').toLowerCase().includes(q) ||
      title.includes(q)
    );
  });

  const tabButton = (id: DetailTab, label: string) => (
    <Button
      key={id}
      variant={activeTab === id ? 'default' : 'outline'}
      size="sm"
      onClick={() => setActiveTab(id)}
      className="text-xs"
    >
      {label}
    </Button>
  );

  if (summaryLoading) {
    return (
      <div className="p-6 max-w-6xl mx-auto space-y-4">
        <Skeleton className="h-8 w-52" />
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!partner || !summary) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <Card className="border border-border">
          <CardContent className="p-8 text-center">
            <Building2 className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              {summaryError instanceof Error
                ? summaryError.message
                : 'Partner not found or unavailable.'}
            </p>
            <Button asChild variant="outline" size="sm" className="mt-4">
              <Link to="/partners">Back to partners</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const openInDashboard = () => {
    window.open(`${DASHBOARD_URL}/dashboard?partner=${partner.id}`, '_blank');
  };

  const isHotel = partner.has_hotel_config === true || partner.partner_type === 'hotel';
  const derivedTypeLabel =
    partner.has_hotel_config && partner.has_experiences
      ? 'Hotel & experiences'
      : partner.has_hotel_config
        ? 'Hotel'
        : partner.has_experiences
          ? 'Experiences'
          : partner.partner_type;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs text-muted-foreground mb-1">
            <Link to="/partners" className="hover:text-foreground transition-ui">
              Partners
            </Link>{' '}
            / {partner.name}
          </p>
          <h1 className="text-lg font-semibold text-foreground">{partner.name}</h1>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            <Badge
              variant={isHotel ? 'secondary' : 'default'}
              className="text-xs"
            >
              {derivedTypeLabel}
            </Badge>
            <span className="text-xs text-muted-foreground">{partner.email}</span>
            <span className="text-xs text-muted-foreground">
              {[partner.city, partner.country].filter(Boolean).join(', ') || '—'}
            </span>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={openInDashboard}>
          <ExternalLink className="h-4 w-4 mr-1.5" />
          Open in dashboard
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {tabButton('overview', 'Overview')}
        {tabButton('commissions', 'Commissions')}
        {isHotel && tabButton('payment-log', 'Payment log')}
        {isHotel && tabButton('payouts', 'Payouts')}
        {tabButton('analytics', 'Analytics')}
      </div>

      {(activeTab === 'overview' || activeTab === 'commissions') && isHotel && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border border-border">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">Hotel earned</p>
              <p className="text-xl font-semibold">{formatPrice(summary.earnedCents)}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {summary.completedBookingCount} completed bookings
              </p>
            </CardContent>
          </Card>
          <Card className="border border-border">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">Paid out</p>
              <p className="text-xl font-semibold">{formatPrice(summary.paidCents)}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {summary.paidPayoutCount} paid payouts
              </p>
            </CardContent>
          </Card>
          <Card className="border border-border">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">Pending payouts</p>
              <p className="text-xl font-semibold">{formatPrice(summary.pendingCents)}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {summary.pendingPayoutCount} pending payouts
              </p>
            </CardContent>
          </Card>
          <Card className="border border-border">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">Unassigned bookings</p>
              <p className="text-xl font-semibold">{summary.unassignedBookingCount}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {summary.reconciliationMismatchCount} split mismatches
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'overview' && (
        <Card className="border border-border">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Wallet className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm font-medium">Partner billing snapshot</p>
            </div>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-1">
                <p className="text-muted-foreground">Stripe account</p>
                <p>
                  {partner.stripe_account_id ? (
                    <span className="font-mono text-xs">{partner.stripe_account_id}</span>
                  ) : (
                    '—'
                  )}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-muted-foreground">Onboarding</p>
                <p>
                  {partner.stripe_onboarding_complete
                    ? 'Complete'
                    : partner.stripe_account_id
                      ? 'Incomplete'
                      : 'No account'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'commissions' && (
        <Card className="border border-border">
          <CardContent className="p-0">
            {!isHotel ? (
              <div className="p-6 text-center">
                <p className="text-sm text-muted-foreground">
                  Commission splits are configured per hotel. This partner has no hotel configs, so there is no commission table here.
                </p>
              </div>
            ) : (
              <>
            <p className="text-sm text-muted-foreground px-4 pt-4">
              Commission split per experience and property. You can edit custom splits below (must sum to 100%).
            </p>
            {distributionsError && (
              <div className="mx-4 mt-2 p-3 rounded-md bg-destructive/10 text-destructive text-sm">
                Failed to load distributions: {(distributionsError as Error).message}
              </div>
            )}
            {distributionsLoading ? (
              <div className="p-6 space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Property</TableHead>
                    <TableHead>Experience</TableHead>
                    <TableHead>Supplier %</TableHead>
                    <TableHead>Hotel %</TableHead>
                    <TableHead>Platform %</TableHead>
                    <TableHead>Active</TableHead>
                    <TableHead className="w-[80px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {distributions.length === 0 ? (
                    <>
                      <TableRow>
                        <TableCell colSpan={7} className="text-sm text-muted-foreground py-6 text-center">
                          No commission distributions for this hotel yet. Rates are set when the hotel adds experiences in the dashboard.
                        </TableCell>
                      </TableRow>
                      {summaryData?.commissionRates && summaryData.commissionRates.length > 0 && (
                        <TableRow>
                          <TableCell colSpan={7} className="text-xs text-muted-foreground py-2 text-center border-t">
                            Summary shows {summaryData.commissionRates.length} active rate(s):{' '}
                            {summaryData.commissionRates.map((r) => `${r.experienceTitle} (${r.supplier}/${r.hotel}/${r.platform}%)`).join('; ')}
                          </TableCell>
                        </TableRow>
                      )}
                    </>
                  ) : (
                    distributions.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell className="text-sm text-muted-foreground">{row.hotelConfigName}</TableCell>
                        <TableCell className="font-medium">{row.experienceTitle}</TableCell>
                        <TableCell>{row.commissionSupplier}%</TableCell>
                        <TableCell>{row.commissionHotel}%</TableCell>
                        <TableCell>{row.commissionPlatform}%</TableCell>
                        <TableCell>
                          <Badge variant={row.isActive ? 'default' : 'secondary'} className="text-xs">
                            {row.isActive ? 'Yes' : 'No'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs h-8"
                            onClick={() => openEditCommission(row)}
                          >
                            <Pencil className="h-3.5 w-3.5 mr-1" />
                            Edit
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
              </>
            )}
          </CardContent>
        </Card>
      )}

      <Dialog open={!!editDistribution} onOpenChange={(open) => !open && setEditDistribution(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Edit commission split</DialogTitle>
          </DialogHeader>
          {editDistribution && (
            <>
              <p className="text-sm text-muted-foreground">
                {editDistribution.hotelConfigName} — {editDistribution.experienceTitle}
              </p>
              <div className="grid grid-cols-3 gap-3 pt-2">
                <div className="space-y-1.5">
                  <Label className="text-xs">Supplier %</Label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={editSupplier}
                    onChange={(e) => setEditSupplier(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Hotel %</Label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={editHotel}
                    onChange={(e) => setEditHotel(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Platform %</Label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={editPlatform}
                    onChange={(e) => setEditPlatform(e.target.value)}
                  />
                </div>
              </div>
              {Number(editSupplier) + Number(editHotel) + Number(editPlatform) !== 100 && (
                <p className="text-xs text-destructive">Percentages must sum to 100.</p>
              )}
              {updateDistributionMutation.error && (
                <p className="text-xs text-destructive">{(updateDistributionMutation.error as Error).message}</p>
              )}
            </>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDistribution(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveCommission}
              disabled={
                updateDistributionMutation.isPending ||
                Number(editSupplier) + Number(editHotel) + Number(editPlatform) !== 100
              }
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {activeTab === 'payouts' && isHotel && (
        <Card className="border border-border">
          <CardContent className="p-0">
            {payoutsLoading ? (
              <div className="p-6 space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Period</TableHead>
                    <TableHead>Bookings</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Paid</TableHead>
                    <TableHead>Reference</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payouts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-sm text-muted-foreground py-8 text-center">
                        No payouts for this partner yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    payouts.map((payout) => (
                      <TableRow key={payout.id}>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(payout.period_start)} — {formatDate(payout.period_end)}
                        </TableCell>
                        <TableCell>{payout.booking_count}</TableCell>
                        <TableCell className="font-medium">
                          {formatPrice(payout.amount_cents)}
                        </TableCell>
                        <TableCell>
                          <PayoutStatusBadge status={payout.status} />
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {payout.paid_at ? formatDate(payout.paid_at) : '—'}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {payout.payment_ref || '—'}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 'payment-log' && isHotel && (
        <Card className="border border-border">
          <CardContent className="space-y-4 p-4">
            <div className="grid md:grid-cols-5 gap-3">
              <div className="relative md:col-span-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search booking ID, Stripe ID, experience..."
                  value={paymentSearch}
                  onChange={(event) => setPaymentSearch(event.target.value)}
                  className="pl-9"
                />
              </div>
              <Input
                type="date"
                value={paidFrom}
                onChange={(event) => setPaidFrom(event.target.value)}
              />
              <Input
                type="date"
                value={paidTo}
                onChange={(event) => setPaidTo(event.target.value)}
              />
              <div className="flex gap-2">
                <Button
                  variant={linkedFilter === 'all' ? 'default' : 'outline'}
                  size="sm"
                  className="text-xs"
                  onClick={() => setLinkedFilter('all')}
                >
                  All
                </Button>
                <Button
                  variant={linkedFilter === 'linked' ? 'default' : 'outline'}
                  size="sm"
                  className="text-xs"
                  onClick={() => setLinkedFilter('linked')}
                >
                  Linked
                </Button>
                <Button
                  variant={linkedFilter === 'unlinked' ? 'default' : 'outline'}
                  size="sm"
                  className="text-xs"
                  onClick={() => setLinkedFilter('unlinked')}
                >
                  Unlinked
                </Button>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant={statusFilter === 'all' ? 'default' : 'outline'}
                size="sm"
                className="text-xs"
                onClick={() => setStatusFilter('all')}
              >
                All statuses
              </Button>
              <Button
                variant={statusFilter === 'confirmed' ? 'default' : 'outline'}
                size="sm"
                className="text-xs"
                onClick={() => setStatusFilter('confirmed')}
              >
                Confirmed
              </Button>
              <Button
                variant={statusFilter === 'completed' ? 'default' : 'outline'}
                size="sm"
                className="text-xs"
                onClick={() => setStatusFilter('completed')}
              >
                Completed
              </Button>
              <Button
                variant={statusFilter === 'cancelled' ? 'default' : 'outline'}
                size="sm"
                className="text-xs"
                onClick={() => setStatusFilter('cancelled')}
              >
                Cancelled
              </Button>
            </div>

            <div className="border border-border rounded-sm overflow-hidden">
              {paymentLogLoading ? (
                <div className="p-6 space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Experience / date</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Supplier</TableHead>
                      <TableHead>Hotel</TableHead>
                      <TableHead>Platform</TableHead>
                      <TableHead>Payout</TableHead>
                      <TableHead>Stripe</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPaymentRows.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-sm text-muted-foreground py-8 text-center">
                          No payment logs match the current filters.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredPaymentRows.map((row) => (
                        <TableRow key={row.id}>
                          <TableCell>
                            <p className="font-medium text-sm">
                              {row.reservation?.experience?.title || 'Unknown experience'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {getSessionDate(row) ? formatDate(getSessionDate(row) as string) : '—'}
                            </p>
                            <p className="text-[11px] text-muted-foreground font-mono mt-0.5">
                              {row.id}
                            </p>
                          </TableCell>
                          <TableCell className="font-medium">{formatPrice(row.amount_cents)}</TableCell>
                          <TableCell>{formatPrice(row.supplier_amount_cents)}</TableCell>
                          <TableCell>{formatPrice(row.hotel_amount_cents)}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span>{formatPrice(row.platform_amount_cents)}</span>
                              {!row.split_matches_total && (
                                <Badge variant="secondary" className="text-[10px]">
                                  Mismatch
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {row.payout ? (
                              <div className="space-y-1">
                                <PayoutStatusBadge status={row.payout.status} />
                                <p className="font-mono text-[10px]">{row.payout.id}</p>
                              </div>
                            ) : (
                              'Unlinked'
                            )}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {row.stripe_charge_id ? (
                              <a
                                href={`${STRIPE_DASHBOARD_URL}/payments/${row.stripe_charge_id}`}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 hover:text-foreground"
                              >
                                {row.stripe_charge_id.slice(0, 16)}...
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            ) : (
                              '—'
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'analytics' && (
        <div className="grid md:grid-cols-3 gap-4">
          <Card className="border border-border">
            <CardContent className="p-4">
              <p className="text-sm font-medium">Website analytics</p>
              <p className="text-xs text-muted-foreground mt-1">
                Traffic source breakdown and visits per page are planned here.
              </p>
            </CardContent>
          </Card>
          <Card className="border border-border">
            <CardContent className="p-4">
              <p className="text-sm font-medium">Booking analytics</p>
              <p className="text-xs text-muted-foreground mt-1">
                Request, acceptance, conversion, and cancellation analytics are planned here.
              </p>
            </CardContent>
          </Card>
          <Card className="border border-border">
            <CardContent className="p-4">
              <p className="text-sm font-medium">Transaction analytics</p>
              <p className="text-xs text-muted-foreground mt-1">
                Most booked experiences, average order value, and partner ranking are planned here.
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {!isHotel && (
        <Card className="border border-border">
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">
              Supplier-specific commission and analytics sections will be added in a future phase.
            </p>
          </CardContent>
        </Card>
      )}

      {isHotel && (
        <p className="text-xs text-muted-foreground inline-flex items-center gap-1 max-w-xl">
          <ReceiptText className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
          <span>
            <strong>Split mismatch</strong> (in Payment log): when the three amounts — supplier, hotel, and platform — do not add up to the booking total. That can indicate a rounding or data error; we flag it so you can check.
          </span>
        </p>
      )}
    </div>
  );
}
