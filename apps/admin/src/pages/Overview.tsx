import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatPrice } from '@/lib/utils';
import { Building2, CreditCard, Users, TrendingUp } from 'lucide-react';

interface PlatformStats {
  partnerCount: number;
  supplierCount: number;
  hotelCount: number;
  pendingPayoutsCents: number;
  pendingPayoutsCount: number;
  totalBookings: number;
  completedBookings: number;
}

function usePlatformStats() {
  return useQuery({
    queryKey: ['platform-stats'],
    queryFn: async (): Promise<PlatformStats> => {
      const [
        { count: partnerCount },
        { count: supplierCount },
        { count: hotelCount },
        { data: pendingPayouts },
        { count: totalBookings },
        { count: completedBookings },
      ] = await Promise.all([
        supabase.from('partners').select('*', { count: 'exact', head: true }),
        supabase.from('partners').select('*', { count: 'exact', head: true }).eq('partner_type', 'supplier'),
        supabase.from('partners').select('*', { count: 'exact', head: true }).eq('partner_type', 'hotel'),
        supabase.from('hotel_payouts').select('amount_cents').eq('status', 'pending') as any,
        supabase.from('bookings').select('*', { count: 'exact', head: true }),
        supabase.from('bookings').select('*', { count: 'exact', head: true }).eq('booking_status', 'completed'),
      ]);

      const pendingPayoutsCents = (pendingPayouts || []).reduce(
        (sum: number, p: any) => sum + (p.amount_cents || 0),
        0
      );

      return {
        partnerCount: partnerCount || 0,
        supplierCount: supplierCount || 0,
        hotelCount: hotelCount || 0,
        pendingPayoutsCents,
        pendingPayoutsCount: (pendingPayouts || []).length,
        totalBookings: totalBookings || 0,
        completedBookings: completedBookings || 0,
      };
    },
    staleTime: 30 * 1000,
  });
}

const statCards = [
  {
    key: 'partners',
    label: 'Total partners',
    icon: Building2,
    getValue: (s: PlatformStats) => s.partnerCount.toString(),
    getSub: (s: PlatformStats) => `${s.supplierCount} suppliers, ${s.hotelCount} hotels`,
  },
  {
    key: 'pendingPayouts',
    label: 'Pending hotel payouts',
    icon: CreditCard,
    getValue: (s: PlatformStats) => formatPrice(s.pendingPayoutsCents),
    getSub: (s: PlatformStats) =>
      `${s.pendingPayoutsCount} ${s.pendingPayoutsCount === 1 ? 'payout' : 'payouts'} to process`,
  },
  {
    key: 'bookings',
    label: 'Total bookings',
    icon: TrendingUp,
    getValue: (s: PlatformStats) => s.totalBookings.toString(),
    getSub: (s: PlatformStats) => `${s.completedBookings} completed`,
  },
];

export default function Overview() {
  const { data: stats, isLoading } = usePlatformStats();

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-foreground">Platform overview</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Traverum admin dashboard.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {isLoading
          ? Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="border border-border">
                <CardContent className="p-5 space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-7 w-16" />
                  <Skeleton className="h-3 w-32" />
                </CardContent>
              </Card>
            ))
          : stats &&
            statCards.map((card) => (
              <Card key={card.key} className="border border-border">
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <card.icon className="h-4 w-4 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">{card.label}</p>
                  </div>
                  <p className="text-2xl font-semibold text-foreground">
                    {card.getValue(stats)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {card.getSub(stats)}
                  </p>
                </CardContent>
              </Card>
            ))}
      </div>
    </div>
  );
}
