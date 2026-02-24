import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { formatPrice } from '@/lib/pricing';
import { useHotelCommission } from '@/hooks/useHotelCommission';
import { format, parseISO } from 'date-fns';

function formatPeriodLabel(start: string, end: string): string {
  const startDate = parseISO(start);
  const endDate = parseISO(end);
  const startMonth = format(startDate, 'MMMM yyyy');
  const endMonth = format(endDate, 'MMMM yyyy');
  if (startMonth === endMonth) return startMonth;
  return `${format(startDate, 'MMM yyyy')} – ${format(endDate, 'MMM yyyy')}`;
}

export default function HotelAnalytics() {
  const { data, isLoading } = useHotelCommission();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const hasData = data.totalOwedCount > 0 || data.totalReceivedCount > 0;

  return (
    <div className="container max-w-6xl mx-auto px-4 py-6">
      <div className="space-y-6">
        <h1 className="text-lg font-semibold text-foreground">Commission</h1>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="border border-border">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">Next payout</p>
              <p className="text-xl font-semibold text-foreground">
                {formatPrice(data.totalOwedCents)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {data.totalOwedCount} {data.totalOwedCount === 1 ? 'booking' : 'bookings'}
              </p>
            </CardContent>
          </Card>

          <Card className="border border-border">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">Received</p>
              <p className="text-xl font-semibold text-foreground">
                {formatPrice(data.totalReceivedCents)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {data.payouts.filter(p => p.status === 'paid').length} {data.payouts.filter(p => p.status === 'paid').length === 1 ? 'payout' : 'payouts'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Per-Property Breakdown */}
        {data.byProperty.length > 0 && (
          <div className="space-y-2">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">
              Next payout by property
            </h2>

            <Card className="border border-border">
              <CardContent className="p-0 divide-y divide-border">
                {data.byProperty.map((prop) => (
                  <div
                    key={prop.hotelConfigId}
                    className="flex items-center justify-between px-4 py-3"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {prop.displayName}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {prop.owedCount} {prop.owedCount === 1 ? 'booking' : 'bookings'}
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-foreground flex-shrink-0">
                      {formatPrice(prop.owedCents)}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Payout History */}
        <div className="space-y-2">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">
            Payout history
          </h2>

          {data.payouts.length === 0 ? (
            <Card className="border border-border">
              <CardContent className="p-6 text-center">
                <p className="text-sm text-muted-foreground">
                  {hasData
                    ? 'No payouts yet. Commission is paid monthly.'
                    : 'No commission data yet. When guests book through your widget and experiences are completed, your commission will appear here.'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card className="border border-border">
              <CardContent className="p-0 divide-y divide-border">
                {data.payouts.map((payout) => (
                  <div
                    key={payout.id}
                    className="flex items-center justify-between px-4 py-3"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground">
                        {formatPeriodLabel(payout.periodStart, payout.periodEnd)}
                      </p>
                      {payout.paidAt && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Paid {format(parseISO(payout.paidAt), 'dd.MM.yyyy')}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge
                        variant={payout.status === 'paid' ? 'default' : 'secondary'}
                        className={cn(
                          'text-xs',
                          payout.status === 'paid'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        )}
                      >
                        {payout.status === 'paid' ? 'Paid' : 'Processing'}
                      </Badge>
                      <p className="text-sm font-semibold text-foreground">
                        {formatPrice(payout.amountCents)}
                      </p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Footer note */}
        {hasData && (
          <p className="text-xs text-muted-foreground px-1">
            Commission is paid monthly via bank transfer.
          </p>
        )}
      </div>
    </div>
  );
}
