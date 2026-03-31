import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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
  FileText,
  Check,
  Loader2,
  Search,
  Undo2,
} from 'lucide-react';
import { fetchAdminJson } from '@/lib/adminApi';

// ─── Types ──────────────────────────────────────────────────

interface CommissionInvoice {
  id: string;
  partner_id: string;
  partner_name: string;
  period_start: string;
  period_end: string;
  commission_amount_cents: number;
  cancellation_credit_cents: number;
  net_amount_cents: number;
  status: string;
  sent_at: string | null;
  paid_at: string | null;
  created_at: string;
}

// ─── Hooks ──────────────────────────────────────────────────

function useCommissionInvoices() {
  return useQuery({
    queryKey: ['admin-commission-invoices'],
    queryFn: async () => {
      const result = await fetchAdminJson<{ invoices: CommissionInvoice[] }>(
        '/api/admin/commission-invoices'
      );
      return result.invoices;
    },
  });
}

// ─── Status Badge ───────────────────────────────────────────

function InvoiceStatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'paid':
      return <Badge className="bg-emerald-100 text-emerald-800 text-xs border-0">Paid</Badge>;
    case 'sent':
      return <Badge className="bg-amber-100 text-amber-800 text-xs border-0">Pending</Badge>;
    case 'draft':
      return <Badge variant="secondary" className="text-xs">Draft</Badge>;
    default:
      return <Badge variant="secondary" className="text-xs">{status}</Badge>;
  }
}

// ─── Mark Paid Dialog ───────────────────────────────────────

function MarkPaidDialog({
  invoice,
  open,
  onOpenChange,
}: {
  invoice: CommissionInvoice | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const [notes, setNotes] = useState('');

  const mutation = useMutation({
    mutationFn: async () => {
      if (!invoice) return;
      await fetchAdminJson(`/api/admin/commission-invoices/${invoice.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: 'paid',
          notes: notes || undefined,
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-commission-invoices'] });
      onOpenChange(false);
      setNotes('');
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Mark invoice as paid</DialogTitle>
        </DialogHeader>

        {invoice && (
          <div className="space-y-4">
            <div className="bg-accent/50 rounded-sm p-3 space-y-1">
              <p className="text-sm font-medium">{invoice.partner_name}</p>
              <p className="text-xs text-muted-foreground">
                {formatPeriodLabel(invoice.period_start)}
              </p>
              <p className="text-lg font-semibold">{formatPrice(invoice.net_amount_cents)}</p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Notes (optional)</Label>
              <Input
                placeholder="Payment reference, bank transfer ID..."
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

// ─── Revert Dialog ──────────────────────────────────────────

function RevertDialog({
  invoice,
  open,
  onOpenChange,
}: {
  invoice: CommissionInvoice | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async () => {
      if (!invoice) return;
      await fetchAdminJson(`/api/admin/commission-invoices/${invoice.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'sent' }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-commission-invoices'] });
      onOpenChange(false);
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Revert to pending?</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          This will mark the invoice as unpaid. The paid date will be cleared.
        </p>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={() => mutation.mutate()} disabled={mutation.isPending}>
            {mutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              'Revert to pending'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Helpers ────────────────────────────────────────────────

function formatPeriodLabel(periodStart: string): string {
  const d = new Date(periodStart);
  return d.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
}

// ─── Main Page ──────────────────────────────────────────────

export default function Invoices() {
  const { data: invoices = [], isLoading } = useCommissionInvoices();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [markPaidInvoice, setMarkPaidInvoice] = useState<CommissionInvoice | null>(null);
  const [revertInvoice, setRevertInvoice] = useState<CommissionInvoice | null>(null);

  const filtered = useMemo(() => {
    return invoices.filter((inv) => {
      if (statusFilter !== 'all' && inv.status !== statusFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!(inv.partner_name || '').toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [invoices, statusFilter, search]);

  const pendingTotal = useMemo(
    () =>
      invoices
        .filter((i) => i.status === 'sent')
        .reduce((s, i) => s + i.net_amount_cents, 0),
    [invoices]
  );

  const paidTotal = useMemo(
    () =>
      invoices
        .filter((i) => i.status === 'paid')
        .reduce((s, i) => s + i.net_amount_cents, 0),
    [invoices]
  );

  const pendingCount = invoices.filter((i) => i.status === 'sent').length;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-foreground">Commission invoices</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Monthly commission invoices for pay-on-site partners.
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4 max-w-2xl">
        <Card className="border border-border">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Pending collection</p>
            <p className="text-xl font-semibold text-foreground">{formatPrice(pendingTotal)}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {pendingCount} invoice{pendingCount !== 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>
        <Card className="border border-border">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Total collected</p>
            <p className="text-xl font-semibold text-foreground">{formatPrice(paidTotal)}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {invoices.filter((i) => i.status === 'paid').length} paid
            </p>
          </CardContent>
        </Card>
        <Card className="border border-border">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Total invoices</p>
            <p className="text-xl font-semibold text-foreground">{invoices.length}</p>
            <p className="text-xs text-muted-foreground mt-0.5">all time</p>
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
            <SelectItem value="sent">Pending</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
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
              <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                {search || statusFilter !== 'all'
                  ? 'No invoices match your filters.'
                  : 'No commission invoices yet. They are generated on the 1st of each month.'}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Partner</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead>Commission</TableHead>
                  <TableHead>Credits</TableHead>
                  <TableHead>Net</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Paid on</TableHead>
                  <TableHead className="w-[120px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">{invoice.partner_name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatPeriodLabel(invoice.period_start)}
                    </TableCell>
                    <TableCell className="text-sm">
                      {formatPrice(invoice.commission_amount_cents)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {invoice.cancellation_credit_cents > 0
                        ? `-${formatPrice(invoice.cancellation_credit_cents)}`
                        : '—'}
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatPrice(invoice.net_amount_cents)}
                    </TableCell>
                    <TableCell>
                      <InvoiceStatusBadge status={invoice.status} />
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {invoice.paid_at ? formatDate(invoice.paid_at) : '—'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {invoice.status === 'sent' && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs"
                            onClick={() => setMarkPaidInvoice(invoice)}
                          >
                            <Check className="h-3.5 w-3.5 mr-1" />
                            Pay
                          </Button>
                        )}
                        {invoice.status === 'paid' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs text-amber-600"
                            onClick={() => setRevertInvoice(invoice)}
                          >
                            <Undo2 className="h-3.5 w-3.5 mr-1" />
                            Revert
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <MarkPaidDialog
        invoice={markPaidInvoice}
        open={!!markPaidInvoice}
        onOpenChange={(open) => !open && setMarkPaidInvoice(null)}
      />

      <RevertDialog
        invoice={revertInvoice}
        open={!!revertInvoice}
        onOpenChange={(open) => !open && setRevertInvoice(null)}
      />
    </div>
  );
}
