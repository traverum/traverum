import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useActivePartner } from '@/hooks/useActivePartner';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { FileText, Check, Clock, Send } from 'lucide-react';

const euroFormatter = new Intl.NumberFormat('it-IT', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 2,
});

function formatPrice(cents: number): string {
  return euroFormatter.format(cents / 100);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function formatPeriod(start: string, end: string): string {
  const d = new Date(start);
  return d.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
}

function InvoiceStatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'paid':
      return (
        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800">
          <Check className="h-3 w-3 mr-1" />
          Paid
        </Badge>
      );
    case 'sent':
      return (
        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800">
          <Send className="h-3 w-3 mr-1" />
          Pending
        </Badge>
      );
    case 'draft':
      return (
        <Badge variant="outline" className="bg-gray-50 text-gray-500 border-gray-200 dark:bg-gray-950/30 dark:text-gray-400 dark:border-gray-800">
          <Clock className="h-3 w-3 mr-1" />
          Draft
        </Badge>
      );
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

interface CommissionInvoice {
  id: string;
  partner_id: string;
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

function useSupplierInvoices() {
  const { activePartnerId } = useActivePartner();

  return useQuery({
    queryKey: ['supplier-invoices', activePartnerId],
    queryFn: async () => {
      if (!activePartnerId) return [];

      const { data, error } = await supabase
        .from('commission_invoices')
        .select('*')
        .eq('partner_id', activePartnerId)
        .order('period_start', { ascending: false });

      if (error) throw error;
      return (data || []) as CommissionInvoice[];
    },
    enabled: !!activePartnerId,
  });
}

export default function Invoices() {
  const { data: invoices = [], isLoading } = useSupplierInvoices();

  const totalOwed = useMemo(
    () =>
      invoices
        .filter((i) => i.status === 'sent')
        .reduce((sum, i) => sum + i.net_amount_cents, 0),
    [invoices]
  );

  const totalPaid = useMemo(
    () =>
      invoices
        .filter((i) => i.status === 'paid')
        .reduce((sum, i) => sum + i.net_amount_cents, 0),
    [invoices]
  );

  return (
    <DashboardLayout>
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Invoices</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Monthly commission invoices for pay-on-site bookings.
          </p>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 gap-4 max-w-md">
          <Card className="border border-border">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">Outstanding</p>
              <p className="text-xl font-semibold text-foreground">
                {isLoading ? <Skeleton className="h-7 w-24" /> : formatPrice(totalOwed)}
              </p>
            </CardContent>
          </Card>
          <Card className="border border-border">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">Total paid</p>
              <p className="text-xl font-semibold text-foreground">
                {isLoading ? <Skeleton className="h-7 w-24" /> : formatPrice(totalPaid)}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Invoice table */}
        <Card className="border border-border">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6 space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : invoices.length === 0 ? (
              <div className="p-12 text-center">
                <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm font-medium text-foreground mb-1">No invoices yet</p>
                <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                  Commission invoices are generated monthly for pay-on-site bookings. They'll appear here once generated.
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Period</TableHead>
                    <TableHead>Commission</TableHead>
                    <TableHead>Credits</TableHead>
                    <TableHead>Net amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">
                        {formatPeriod(invoice.period_start, invoice.period_end)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
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
                        {invoice.paid_at
                          ? `Paid ${formatDate(invoice.paid_at)}`
                          : invoice.sent_at
                            ? `Sent ${formatDate(invoice.sent_at)}`
                            : formatDate(invoice.created_at)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
