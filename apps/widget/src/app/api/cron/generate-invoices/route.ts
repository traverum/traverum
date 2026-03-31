import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/email/index'
import { partnerCommissionInvoice } from '@/lib/email/templates'
import { PAYMENT_MODES, INVOICE_STATUSES, formatPrice } from '@traverum/shared'
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns'

function verifyCronSecret(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) return true
  return authHeader === `Bearer ${cronSecret}`
}

export async function POST(request: NextRequest) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()

  const now = new Date()
  const previousMonth = subMonths(now, 1)
  const periodStart = format(startOfMonth(previousMonth), 'yyyy-MM-dd')
  const periodEnd = format(endOfMonth(previousMonth), 'yyyy-MM-dd')
  const periodLabel = format(previousMonth, 'MMMM yyyy')

  // 1. Find all partners with payment_mode = 'pay_on_site'
  const { data: partners, error: partnersErr } = await (supabase
    .from('partners') as any)
    .select('id, name, email')
    .eq('payment_mode', PAYMENT_MODES.PAY_ON_SITE) as { data: { id: string; name: string; email: string }[] | null; error: any }

  if (partnersErr) {
    console.error('Error fetching pay_on_site partners:', partnersErr)
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }

  if (!partners || partners.length === 0) {
    return NextResponse.json({
      success: true,
      processed: 0,
      message: 'No pay_on_site partners found',
    })
  }

  let processed = 0
  let skipped = 0
  const errors: string[] = []

  for (const partner of partners) {
    try {
      // Check for duplicate: skip if invoice already exists for this period + partner
      const { data: existing } = await supabase
        .from('commission_invoices')
        .select('id')
        .eq('partner_id', partner.id)
        .eq('period_start', periodStart)
        .eq('period_end', periodEnd)
        .limit(1)

      if (existing && existing.length > 0) {
        skipped++
        continue
      }

      // 2. Find completed pay_on_site bookings for this partner in the period
      const { data: bookings, error: bookingsErr } = await supabase
        .from('bookings')
        .select(`
          id,
          amount_cents,
          supplier_amount_cents,
          hotel_amount_cents,
          platform_amount_cents,
          completed_at,
          reservation:reservations!inner(
            experience:experiences!inner(
              partner_id
            )
          )
        `)
        .eq('booking_status', 'completed')
        .eq('payment_mode', PAYMENT_MODES.PAY_ON_SITE)
        .gte('completed_at', `${periodStart}T00:00:00.000Z`)
        .lte('completed_at', `${periodEnd}T23:59:59.999Z`)

      if (bookingsErr) {
        console.error(`Error fetching bookings for partner ${partner.id}:`, bookingsErr)
        errors.push(partner.id)
        continue
      }

      // Filter to bookings belonging to this partner (experience owner)
      const partnerBookings = (bookings || []).filter((b: any) => {
        const experience = b.reservation?.experience
        return experience?.partner_id === partner.id
      })

      if (partnerBookings.length === 0) {
        skipped++
        continue
      }

      // 3. Sum commission owed (platform + hotel share)
      const commissionAmountCents = partnerBookings.reduce((sum: number, b: any) => {
        return sum + (b.platform_amount_cents || 0) + (b.hotel_amount_cents || 0)
      }, 0)

      // 4. Sum cancellation credits (supplier's share of charges Traverum collected)
      const bookingIds = partnerBookings.map((b: any) => b.id)
      let cancellationCreditCents = 0

      if (bookingIds.length > 0) {
        const { data: charges } = await supabase
          .from('cancellation_charges')
          .select('commission_split_cents')
          .in('booking_id', bookingIds)
          .eq('status', 'succeeded')

        if (charges) {
          cancellationCreditCents = charges.reduce((sum: number, c: any) => {
            const split = c.commission_split_cents as { supplier?: number } | null
            return sum + (split?.supplier || 0)
          }, 0)
        }
      }

      // 5. Net the two amounts
      const netAmountCents = Math.max(0, commissionAmountCents - cancellationCreditCents)

      // Skip if net amount is zero
      if (netAmountCents === 0 && commissionAmountCents === 0) {
        skipped++
        continue
      }

      // 6. Create commission_invoices record
      const { data: invoice, error: insertErr }: { data: any; error: any } = await (supabase
        .from('commission_invoices') as any)
        .insert({
          partner_id: partner.id,
          period_start: periodStart,
          period_end: periodEnd,
          commission_amount_cents: commissionAmountCents,
          cancellation_credit_cents: cancellationCreditCents,
          net_amount_cents: netAmountCents,
          status: INVOICE_STATUSES.SENT,
          sent_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (insertErr) {
        console.error(`Error creating invoice for partner ${partner.id}:`, insertErr)
        errors.push(partner.id)
        continue
      }

      // 7. Send invoice email
      if (partner.email) {
        try {
          await sendEmail({
            to: partner.email,
            subject: `Commission invoice — ${periodLabel}`,
            html: partnerCommissionInvoice({
              partnerName: partner.name,
              periodLabel,
              bookingCount: partnerBookings.length,
              totalBookingValueCents: partnerBookings.reduce(
                (sum: number, b: any) => sum + (b.amount_cents || 0),
                0
              ),
              commissionAmountCents,
              cancellationCreditCents,
              netAmountCents,
              invoiceId: invoice.id,
            }),
          })
        } catch (emailErr) {
          console.error(`Failed to send invoice email to ${partner.email}:`, emailErr)
        }
      }

      processed++
    } catch (err) {
      console.error(`Error processing partner ${partner.id}:`, err)
      errors.push(partner.id)
    }
  }

  return NextResponse.json({
    success: true,
    processed,
    skipped,
    errors: errors.length,
    message: `Generated ${processed} invoices for ${periodLabel}` +
      (skipped > 0 ? `, skipped ${skipped}` : '') +
      (errors.length > 0 ? `, ${errors.length} errors` : ''),
  })
}

export async function GET(request: NextRequest) {
  return POST(request)
}
