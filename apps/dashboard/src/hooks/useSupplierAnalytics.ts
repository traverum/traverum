import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useActivePartner } from './useActivePartner';
import {
  format,
  parseISO,
  startOfWeek,
  startOfMonth,
  startOfYear,
  getMonth,
  getYear,
} from 'date-fns';

export type PeriodGranularity = 'year' | 'month' | 'week';

interface AnalyticsBooking {
  id: string;
  booking_status: string;
  amount_cents: number;
  supplier_amount_cents: number;
  payment_mode: string | null;
  paid_at: string | null;
  completed_at: string | null;
  session: {
    session_date: string;
  } | null;
  reservation: {
    experience_id: string;
    hotel_id: string;
    guest_name: string;
    guest_company_name: string | null;
    invoice_requested: boolean | null;
    requested_date: string | null;
    experience: { id: string; title: string };
    hotel: { id: string; name: string };
  };
}

export interface PeriodRevenue {
  label: string;
  sortKey: string;
  revenueCents: number;
  count: number;
}

export interface RankedItem {
  id: string;
  name: string;
  count: number;
  revenueCents: number;
}

export interface MonthlyBooking {
  id: string;
  date: Date;
  experienceTitle: string;
  guestName: string;
  guestCompanyName: string | null;
  invoiceRequested: boolean;
  grossCents: number;
  commissionCents: number;
  netCents: number;
  status: 'completed';
}

function periodKey(date: Date, granularity: PeriodGranularity): { label: string; sortKey: string } {
  switch (granularity) {
    case 'year':
      return { label: format(date, 'yyyy'), sortKey: format(date, 'yyyy') };
    case 'month':
      return {
        label: format(startOfMonth(date), 'MMMM yyyy'),
        sortKey: format(startOfMonth(date), 'yyyy-MM'),
      };
    case 'week': {
      const weekStart = startOfWeek(date, { weekStartsOn: 1 });
      return {
        label: `Week of ${format(weekStart, 'dd.MM.yyyy')}`,
        sortKey: format(weekStart, 'yyyy-MM-dd'),
      };
    }
  }
}

function bookingDate(b: AnalyticsBooking): Date {
  const dateStr =
    b.session?.session_date ??
    b.reservation?.requested_date ??
    b.completed_at ??
    b.paid_at ??
    new Date().toISOString();
  return parseISO(dateStr);
}

export function useSupplierAnalytics() {
  const { activePartner } = useActivePartner();
  const partnerId = activePartner?.partner_id || null;

  const { data: experienceIds = [], isLoading: expLoading } = useQuery({
    queryKey: ['supplierAnalytics:experiences', partnerId],
    queryFn: async () => {
      if (!partnerId) return [];
      const { data, error } = await supabase
        .from('experiences')
        .select('id')
        .eq('partner_id', partnerId);
      if (error) throw error;
      return data.map((e) => e.id) as string[];
    },
    enabled: !!partnerId,
  });

  const { data: rawBookings = [], isLoading: bookingsLoading } = useQuery({
    queryKey: ['supplierAnalytics:bookings', partnerId, experienceIds],
    queryFn: async () => {
      if (!partnerId || experienceIds.length === 0) return [];

      const { data, error } = await supabase
        .from('bookings')
        .select(`
          id,
          booking_status,
          amount_cents,
          supplier_amount_cents,
          payment_mode,
          paid_at,
          completed_at,
          session:experience_sessions(
            session_date
          ),
          reservation:reservations(
            experience_id,
            hotel_id,
            guest_name,
            guest_company_name,
            invoice_requested,
            requested_date,
            experience:experiences!reservations_experience_fk(id, title),
            hotel:partners!reservations_hotel_fk(id, name)
          )
        `)
        .in('booking_status', ['confirmed', 'completed'])
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).filter(
        (b) =>
          b.reservation?.experience &&
          experienceIds.includes(
            (b.reservation.experience as unknown as { id: string }).id
          )
      ) as unknown as AnalyticsBooking[];
    },
    enabled: !!partnerId && experienceIds.length > 0,
  });

  const analytics = useMemo(() => {
    const completedBookings = rawBookings.filter(
      (b) => b.booking_status === 'completed'
    );
    const confirmedBookings = rawBookings.filter(
      (b) => b.booking_status === 'confirmed'
    );

    const totalBookings = rawBookings.length;
    const totalRevenueCents = completedBookings.reduce(
      (sum, b) => sum + (b.amount_cents || 0),
      0
    );

    const pendingPayoutsCents = confirmedBookings
      .filter((b) => b.payment_mode !== 'pay_on_site')
      .reduce((sum, b) => sum + (b.supplier_amount_cents || 0), 0);

    const now = new Date();
    const currentMonth = getMonth(now);
    const currentYear = getYear(now);

    const totalCommissionsCentsThisMonth = completedBookings
      .filter((b) => {
        if (!b.completed_at) return false;
        const d = parseISO(b.completed_at);
        return getMonth(d) === currentMonth && getYear(d) === currentYear;
      })
      .reduce(
        (sum, b) => sum + ((b.amount_cents || 0) - (b.supplier_amount_cents || 0)),
        0
      );

    const availableMonths: { year: number; month: number; label: string; sortKey: string }[] = (() => {
      const seen = new Set<string>();
      const months: { year: number; month: number; label: string; sortKey: string }[] = [];
      for (const b of completedBookings) {
        const d = bookingDate(b);
        const y = getYear(d);
        const m = getMonth(d);
        const key = `${y}-${String(m).padStart(2, '0')}`;
        if (!seen.has(key)) {
          seen.add(key);
          months.push({
            year: y,
            month: m,
            label: format(d, 'MMMM yyyy'),
            sortKey: key,
          });
        }
      }
      return months.sort((a, b) => b.sortKey.localeCompare(a.sortKey));
    })();

    const monthlyBookings = (year: number, month: number): MonthlyBooking[] => {
      return completedBookings
        .map((b) => {
          const d = bookingDate(b);
          if (getYear(d) !== year || getMonth(d) !== month) return null;
          return {
            id: b.id,
            date: d,
            experienceTitle: b.reservation?.experience?.title ?? 'Unknown',
            guestName: b.reservation?.guest_name ?? 'Unknown',
            guestCompanyName: b.reservation?.guest_company_name ?? null,
            invoiceRequested: b.reservation?.invoice_requested ?? false,
            grossCents: b.amount_cents || 0,
            commissionCents: (b.amount_cents || 0) - (b.supplier_amount_cents || 0),
            netCents: b.supplier_amount_cents || 0,
            status: 'completed' as const,
          };
        })
        .filter((b): b is MonthlyBooking => b !== null)
        .sort((a, b) => b.date.getTime() - a.date.getTime());
    };

    const revenueByPeriod = (granularity: PeriodGranularity): PeriodRevenue[] => {
      const map = new Map<string, PeriodRevenue>();
      for (const b of completedBookings) {
        const dateStr = b.paid_at ?? b.completed_at;
        if (!dateStr) continue;
        const date = parseISO(dateStr);
        const { label, sortKey } = periodKey(date, granularity);
        const existing = map.get(sortKey);
        if (existing) {
          existing.revenueCents += b.supplier_amount_cents || 0;
          existing.count += 1;
        } else {
          map.set(sortKey, {
            label,
            sortKey,
            revenueCents: b.supplier_amount_cents || 0,
            count: 1,
          });
        }
      }
      return Array.from(map.values()).sort((a, b) =>
        b.sortKey.localeCompare(a.sortKey)
      );
    };

    const topExperiences: RankedItem[] = (() => {
      const map = new Map<string, RankedItem>();
      for (const b of rawBookings) {
        const exp = b.reservation?.experience;
        if (!exp) continue;
        const existing = map.get(exp.id);
        const rev =
          b.booking_status === 'completed' ? b.supplier_amount_cents || 0 : 0;
        if (existing) {
          existing.count += 1;
          existing.revenueCents += rev;
        } else {
          map.set(exp.id, { id: exp.id, name: exp.title, count: 1, revenueCents: rev });
        }
      }
      return Array.from(map.values())
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
    })();

    const topHotels: RankedItem[] = (() => {
      const map = new Map<string, RankedItem>();
      for (const b of rawBookings) {
        const hotel = b.reservation?.hotel;
        if (!hotel) continue;
        const existing = map.get(hotel.id);
        const rev =
          b.booking_status === 'completed' ? b.supplier_amount_cents || 0 : 0;
        if (existing) {
          existing.count += 1;
          existing.revenueCents += rev;
        } else {
          map.set(hotel.id, { id: hotel.id, name: hotel.name, count: 1, revenueCents: rev });
        }
      }
      return Array.from(map.values())
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
    })();

    const completedCount = completedBookings.length;
    const completedThisMonth = completedBookings.filter((b) => {
      if (!b.completed_at) return false;
      const d = parseISO(b.completed_at);
      return getMonth(d) === currentMonth && getYear(d) === currentYear;
    }).length;

    return {
      totalBookings,
      totalRevenueCents,
      pendingPayoutsCents,
      totalCommissionsCentsThisMonth,
      availableMonths,
      monthlyBookings,
      revenueByPeriod,
      topExperiences,
      topHotels,
      guestsServedCount: completedCount,
      guestsServedThisMonth: completedThisMonth,
    };
  }, [rawBookings]);

  return {
    ...analytics,
    isLoading: expLoading || bookingsLoading,
    hasData: rawBookings.length > 0,
  };
}
