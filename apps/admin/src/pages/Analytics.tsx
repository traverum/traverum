import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { fetchAdminJson } from '@/lib/adminApi';
import { formatPrice } from '@/lib/utils';
import { Eye, Building2, TrendingUp } from 'lucide-react';

interface GlobalAnalytics {
  totalWidgetViews: number;
  viewsBySource: { source: string; count: number }[];
  viewsByDay: { date: string; count: number }[];
  topHotelsByViews: { hotelConfigId: string; name: string; views: number }[];
  totalReservations: number;
  totalRequests: number;
  accepted: number;
  declined: number;
  expired: number;
  booked: number;
  cancelled: number;
  topExperiences: { experienceId: string; title: string; bookings: number; revenueCents: number }[];
  topHotelsByBookings: { partnerId: string; name: string; bookings: number; revenueCents: number }[];
  averageDealCents: number;
  totalRevenueCents: number;
}

export default function Analytics() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-global-analytics'],
    queryFn: () => fetchAdminJson<GlobalAnalytics>('/api/admin/analytics'),
  });

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-lg font-semibold text-foreground">Analytics</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Platform-wide traffic, booking, and transaction analytics.
        </p>
      </div>

      {isLoading ? (
        <div className="grid md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="border border-border">
              <CardContent className="p-4 space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-7 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : data ? (
        <>
          {/* Website traffic */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Eye className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm font-medium">Website traffic</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="border border-border">
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground mb-1">Total widget views</p>
                  <p className="text-xl font-semibold">{data.totalWidgetViews}</p>
                </CardContent>
              </Card>
              {data.viewsBySource.map((s) => (
                <Card key={s.source} className="border border-border">
                  <CardContent className="p-4">
                    <p className="text-xs text-muted-foreground mb-1 capitalize">{s.source}</p>
                    <p className="text-xl font-semibold">{s.count}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
            {data.topHotelsByViews.length > 0 && (
              <Card className="border border-border mt-4">
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Hotel</TableHead>
                        <TableHead className="text-right">Views</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.topHotelsByViews.map((h) => (
                        <TableRow key={h.hotelConfigId}>
                          <TableCell className="text-sm">{h.name}</TableCell>
                          <TableCell className="text-sm text-right">{h.views}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Booking funnel */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm font-medium">Booking performance</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
              <Card className="border border-border">
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground mb-1">Reservations</p>
                  <p className="text-xl font-semibold">{data.totalReservations}</p>
                </CardContent>
              </Card>
              <Card className="border border-border">
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground mb-1">Requests</p>
                  <p className="text-xl font-semibold">{data.totalRequests}</p>
                </CardContent>
              </Card>
              <Card className="border border-border">
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground mb-1">Accepted</p>
                  <p className="text-xl font-semibold">{data.accepted}</p>
                </CardContent>
              </Card>
              <Card className="border border-border">
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground mb-1">Declined</p>
                  <p className="text-xl font-semibold">{data.declined}</p>
                </CardContent>
              </Card>
              <Card className="border border-border">
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground mb-1">Expired</p>
                  <p className="text-xl font-semibold">{data.expired}</p>
                </CardContent>
              </Card>
              <Card className="border border-border">
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground mb-1">Booked</p>
                  <p className="text-xl font-semibold">{data.booked}</p>
                </CardContent>
              </Card>
              <Card className="border border-border">
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground mb-1">Cancelled</p>
                  <p className="text-xl font-semibold">{data.cancelled}</p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Transaction performance */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm font-medium">Transaction performance</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <Card className="border border-border">
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground mb-1">Total revenue</p>
                  <p className="text-xl font-semibold">{formatPrice(data.totalRevenueCents)}</p>
                </CardContent>
              </Card>
              <Card className="border border-border">
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground mb-1">Average deal</p>
                  <p className="text-xl font-semibold">{formatPrice(data.averageDealCents)}</p>
                </CardContent>
              </Card>
              <Card className="border border-border">
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground mb-1">Paid bookings</p>
                  <p className="text-xl font-semibold">{data.booked}</p>
                </CardContent>
              </Card>
            </div>

            {/* Top experiences */}
            {data.topExperiences.length > 0 && (
              <Card className="border border-border mt-4">
                <CardContent className="p-0">
                  <p className="text-xs text-muted-foreground px-4 pt-3 pb-1">Top experiences by revenue</p>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Experience</TableHead>
                        <TableHead className="text-right">Bookings</TableHead>
                        <TableHead className="text-right">Revenue</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.topExperiences.map((te) => (
                        <TableRow key={te.experienceId}>
                          <TableCell className="text-sm">{te.title}</TableCell>
                          <TableCell className="text-sm text-right">{te.bookings}</TableCell>
                          <TableCell className="text-sm text-right">{formatPrice(te.revenueCents)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}

            {/* Top hotels by bookings */}
            {data.topHotelsByBookings.length > 0 && (
              <Card className="border border-border mt-4">
                <CardContent className="p-0">
                  <p className="text-xs text-muted-foreground px-4 pt-3 pb-1">Top hotels by revenue</p>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Hotel</TableHead>
                        <TableHead className="text-right">Bookings</TableHead>
                        <TableHead className="text-right">Revenue</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.topHotelsByBookings.map((th) => (
                        <TableRow key={th.partnerId}>
                          <TableCell className="text-sm">{th.name}</TableCell>
                          <TableCell className="text-sm text-right">{th.bookings}</TableCell>
                          <TableCell className="text-sm text-right">{formatPrice(th.revenueCents)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </div>
        </>
      ) : (
        <p className="text-sm text-muted-foreground">No analytics data available.</p>
      )}
    </div>
  );
}
