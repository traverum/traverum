import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useActivePartner } from '@/hooks/useActivePartner';
import { useActiveHotelConfig } from '@/hooks/useActiveHotelConfig';

export interface PropertyCommission {
  hotelConfigId: string;
  displayName: string;
  owedCents: number;
  owedCount: number;
}

export interface PayoutRecord {
  id: string;
  periodStart: string;
  periodEnd: string;
  amountCents: number;
  currency: string;
  status: 'pending' | 'paid';
  paidAt: string | null;
  createdAt: string;
}

export interface HotelCommissionData {
  totalOwedCents: number;
  totalOwedCount: number;
  totalReceivedCents: number;
  totalReceivedCount: number;
  byProperty: PropertyCommission[];
  payouts: PayoutRecord[];
}

export function useHotelCommission() {
  const { activePartnerId } = useActivePartner();
  const { hotelConfigs } = useActiveHotelConfig();

  const { data: rawBookings = [], isLoading: bookingsLoading } = useQuery({
    queryKey: ['hotel-commission', activePartnerId],
    queryFn: async () => {
      if (!activePartnerId) return [];

      const { data, error } = await supabase
        .from('bookings')
        .select(`
          id,
          hotel_amount_cents,
          booking_status,
          hotel_payout_id,
          reservation:reservations!inner(
            hotel_config_id,
            hotel_id
          )
        `)
        .eq('reservation.hotel_id', activePartnerId)
        .eq('booking_status', 'completed');

      if (error) throw error;
      return (data || []) as any[];
    },
    enabled: !!activePartnerId,
  });

  const { data: rawPayouts = [], isLoading: payoutsLoading } = useQuery({
    queryKey: ['hotel-payouts', activePartnerId],
    queryFn: async () => {
      if (!activePartnerId) return [];

      const { data, error } = await supabase
        .from('hotel_payouts')
        .select('*')
        .eq('partner_id', activePartnerId)
        .order('period_start', { ascending: false });

      if (error) throw error;
      return (data || []) as any[];
    },
    enabled: !!activePartnerId,
  });

  const paidPayoutIds = useMemo(
    () => new Set(rawPayouts.filter((p: any) => p.status === 'paid').map((p: any) => p.id)),
    [rawPayouts]
  );

  const commissionData = useMemo<HotelCommissionData>(() => {
    const configMap = new Map(
      hotelConfigs.map(c => [c.id, c.display_name || c.slug])
    );

    const fallbackConfigId = hotelConfigs.length > 0 ? hotelConfigs[0].id : null;

    const propertyMap = new Map<string, PropertyCommission>();

    let totalReceivedCents = 0;
    let totalReceivedCount = 0;

    for (const booking of rawBookings) {
      const reservation = booking.reservation;
      const configId = reservation?.hotel_config_id || fallbackConfigId;
      if (!configId) continue;

      const amountCents = booking.hotel_amount_cents || 0;

      if (booking.hotel_payout_id && paidPayoutIds.has(booking.hotel_payout_id)) {
        totalReceivedCents += amountCents;
        totalReceivedCount += 1;
      } else {
        if (!propertyMap.has(configId)) {
          propertyMap.set(configId, {
            hotelConfigId: configId,
            displayName: configMap.get(configId) || 'Unknown Property',
            owedCents: 0,
            owedCount: 0,
          });
        }
        const prop = propertyMap.get(configId)!;
        prop.owedCents += amountCents;
        prop.owedCount += 1;
      }
    }

    const byProperty = Array.from(propertyMap.values()).sort(
      (a, b) => b.owedCents - a.owedCents
    );

    const payouts: PayoutRecord[] = rawPayouts.map((p: any) => ({
      id: p.id,
      periodStart: p.period_start,
      periodEnd: p.period_end,
      amountCents: p.amount_cents,
      currency: p.currency,
      status: p.status,
      paidAt: p.paid_at,
      createdAt: p.created_at,
    }));

    return {
      totalOwedCents: byProperty.reduce((s, p) => s + p.owedCents, 0),
      totalOwedCount: byProperty.reduce((s, p) => s + p.owedCount, 0),
      totalReceivedCents,
      totalReceivedCount,
      byProperty,
      payouts,
    };
  }, [rawBookings, hotelConfigs, rawPayouts, paidPayoutIds]);

  return { data: commissionData, isLoading: bookingsLoading || payoutsLoading };
}
