import { useState, useMemo } from 'react';
import { format, getMonth, getYear } from 'date-fns';
import { Download, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
import { formatPrice } from '@/lib/pricing';
import {
  useSupplierAnalytics,
  type PeriodGranularity,
  type RankedItem,
  type MonthlyBooking,
} from '@/hooks/useSupplierAnalytics';
import { cn } from '@/lib/utils';

const GRANULARITIES: { value: PeriodGranularity; label: string }[] = [
  { value: 'year', label: 'Year' },
  { value: 'month', label: 'Month' },
  { value: 'week', label: 'Week' },
];

function RankedList({ title, items }: { title: string; items: RankedItem[] }) {
  if (items.length === 0) return null;

  return (
    <div className="space-y-2">
      <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">
        {title}
      </h2>
      <Card className="border border-border">
        <CardContent className="p-0 divide-y divide-border">
          {items.map((item, i) => (
            <div
              key={item.id}
              className="flex items-center justify-between px-4 py-3"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-xs text-muted-foreground w-4 text-right flex-shrink-0">
                  {i + 1}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {item.name}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {item.count} {item.count === 1 ? 'booking' : 'bookings'}
                  </p>
                </div>
              </div>
              <p className="text-sm font-semibold text-foreground flex-shrink-0">
                {formatPrice(item.revenueCents)}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function formatCentsForCSV(cents: number): string {
  return (cents / 100).toFixed(2).replace('.', ',');
}

function downloadMonthlyCSV(bookings: MonthlyBooking[], year: number, month: number) {
  const BOM = '\uFEFF';
  const header = 'Data;Esperienza;Cliente;Lordo (\u20AC);Commissione (\u20AC);Netto (\u20AC);Stato';
  const rows = bookings.map((b) =>
    [
      format(b.date, 'dd.MM.yyyy'),
      b.experienceTitle,
      b.guestName,
      formatCentsForCSV(b.grossCents),
      formatCentsForCSV(b.commissionCents),
      formatCentsForCSV(b.netCents),
      b.status === 'completed' ? 'Completato' : 'Confermato',
    ].join(';')
  );
  const csv = BOM + [header, ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `riepilogo-${year}-${String(month + 1).padStart(2, '0')}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function SupplierAnalytics() {
  const {
    totalBookings,
    totalRevenueCents,
    pendingPayoutsCents,
    totalCommissionsCentsThisMonth,
    availableMonths,
    monthlyBookings,
    revenueByPeriod,
    topExperiences,
    topHotels,
    isLoading,
    hasData,
  } = useSupplierAnalytics();

  const [granularity, setGranularity] = useState<PeriodGranularity>('month');

  const now = new Date();
  const defaultMonthKey = `${getYear(now)}-${String(getMonth(now)).padStart(2, '0')}`;
  const [selectedMonthKey, setSelectedMonthKey] = useState(defaultMonthKey);

  const selectedMonth = useMemo(() => {
    const found = availableMonths.find((m) => m.sortKey === selectedMonthKey);
    if (found) return found;
    if (availableMonths.length > 0) return availableMonths[0];
    return { year: getYear(now), month: getMonth(now), label: format(now, 'MMMM yyyy'), sortKey: defaultMonthKey };
  }, [availableMonths, selectedMonthKey]);

  const statementBookings = useMemo(
    () => monthlyBookings(selectedMonth.year, selectedMonth.month),
    [selectedMonth.year, selectedMonth.month, monthlyBookings]
  );

  const statementTotals = useMemo(() => {
    return statementBookings.reduce(
      (acc, b) => ({
        gross: acc.gross + b.grossCents,
        commission: acc.commission + b.commissionCents,
        net: acc.net + b.netCents,
      }),
      { gross: 0, commission: 0, net: 0 }
    );
  }, [statementBookings]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!hasData) {
    return (
      <div className="container max-w-6xl mx-auto px-4 py-6">
        <h1 className="text-lg font-semibold text-foreground mb-6">Financial overview</h1>
        <Card className="border border-border">
          <CardContent className="p-6 text-center">
            <p className="text-sm text-muted-foreground">
              No bookings yet. When guests book your experiences, your financial data will appear here.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const periods = revenueByPeriod(granularity);

  return (
    <div className="container max-w-6xl mx-auto px-4 py-6">
      <div className="space-y-8">
        <h1 className="text-lg font-semibold text-foreground">Financial overview</h1>

        {/* Section 1: Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="border border-border">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">Total bookings</p>
              <p className="text-xl font-semibold text-foreground">{totalBookings}</p>
            </CardContent>
          </Card>

          <Card className="border border-border">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">Revenue earned</p>
              <p className="text-xl font-semibold text-foreground">
                {formatPrice(totalRevenueCents)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">completed</p>
            </CardContent>
          </Card>

          <Card className="border border-border">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">Pending payouts</p>
              <p className="text-xl font-semibold text-foreground">
                {formatPrice(pendingPayoutsCents)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">pending transfer</p>
            </CardContent>
          </Card>

          <Card className="border border-border">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">Commissions</p>
              <p className="text-xl font-semibold text-foreground">
                {formatPrice(totalCommissionsCentsThisMonth)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">this month</p>
            </CardContent>
          </Card>
        </div>

        {/* Section 2: Monthly Statement */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Monthly statement
            </h2>
            <Select value={selectedMonthKey} onValueChange={setSelectedMonthKey}>
              <SelectTrigger className="w-[180px] h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableMonths.map((m) => (
                  <SelectItem key={m.sortKey} value={m.sortKey}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {statementBookings.length === 0 ? (
            <Card className="border border-border">
              <CardContent className="p-6 text-center">
                <p className="text-sm text-muted-foreground">
                  No bookings for this month.
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              <Card className="border border-border">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">Date</TableHead>
                        <TableHead className="text-xs">Experience</TableHead>
                        <TableHead className="text-xs">Guest</TableHead>
                        <TableHead className="text-xs text-right">Gross</TableHead>
                        <TableHead className="text-xs text-right">Commission</TableHead>
                        <TableHead className="text-xs text-right">Net to you</TableHead>
                        <TableHead className="text-xs">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {statementBookings.map((b) => (
                        <TableRow key={b.id}>
                          <TableCell className="text-sm whitespace-nowrap">
                            {format(b.date, 'dd.MM.yyyy')}
                          </TableCell>
                          <TableCell className="text-sm max-w-[200px] truncate">
                            {b.experienceTitle}
                          </TableCell>
                          <TableCell className="text-sm whitespace-nowrap">
                            {b.guestName}
                          </TableCell>
                          <TableCell className="text-sm text-right whitespace-nowrap">
                            {formatPrice(b.grossCents)}
                          </TableCell>
                          <TableCell className="text-sm text-right whitespace-nowrap">
                            {formatPrice(b.commissionCents)}
                          </TableCell>
                          <TableCell className="text-sm text-right whitespace-nowrap font-medium">
                            {formatPrice(b.netCents)}
                          </TableCell>
                          <TableCell>
                            <span
                              className={cn(
                                'text-xs px-1.5 py-0.5 rounded',
                                b.status === 'completed'
                                  ? 'bg-emerald-500/10 text-emerald-600'
                                  : 'bg-amber-500/10 text-amber-600'
                              )}
                            >
                              {b.status}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="border-t-2 border-border font-semibold">
                        <TableCell colSpan={3} className="text-sm">
                          Total
                        </TableCell>
                        <TableCell className="text-sm text-right">
                          {formatPrice(statementTotals.gross)}
                        </TableCell>
                        <TableCell className="text-sm text-right">
                          {formatPrice(statementTotals.commission)}
                        </TableCell>
                        <TableCell className="text-sm text-right">
                          {formatPrice(statementTotals.net)}
                        </TableCell>
                        <TableCell />
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </Card>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    downloadMonthlyCSV(statementBookings, selectedMonth.year, selectedMonth.month)
                  }
                >
                  <Download className="h-4 w-4 mr-1.5" />
                  Download CSV
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toast('Coming soon')}
                >
                  <FileText className="h-4 w-4 mr-1.5" />
                  Download PDF
                </Button>
              </div>
            </>
          )}

          <p className="text-xs text-muted-foreground italic px-1">
            Per ogni prenotazione, emetti corrispettivo/scontrino per l'importo nella colonna 'Lordo cliente'.
          </p>
        </div>

        {/* Section 3: Commission Invoices (placeholder) */}
        <div className="space-y-2">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">
            Commission invoices
          </h2>
          <Card className="border border-border">
            <CardContent className="p-6 text-center">
              <p className="text-sm text-muted-foreground">
                Le fatture commissioni verranno visualizzate qui. Attualmente inviate via SdI.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Section 4: Revenue by Period */}
        {periods.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Revenue by period
              </h2>
              <div className="flex gap-1">
                {GRANULARITIES.map((g) => (
                  <button
                    key={g.value}
                    onClick={() => setGranularity(g.value)}
                    className={cn(
                      'px-2 py-0.5 text-xs rounded-sm transition-colors',
                      granularity === g.value
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    {g.label}
                  </button>
                ))}
              </div>
            </div>
            <Card className="border border-border">
              <CardContent className="p-0 divide-y divide-border">
                {periods.map((p) => (
                  <div
                    key={p.sortKey}
                    className="flex items-center justify-between px-4 py-3"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground">
                        {p.label}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {p.count} {p.count === 1 ? 'booking' : 'bookings'}
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-foreground flex-shrink-0">
                      {formatPrice(p.revenueCents)}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Top Experiences & Hotels */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <RankedList title="Top experiences" items={topExperiences} />
          <RankedList title="Top hotels" items={topHotels} />
        </div>
      </div>
    </div>
  );
}
