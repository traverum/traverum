import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Suspense } from 'react'
import { createAdminClient } from '@/lib/supabase/server'
import { formatDate, formatTime, formatPrice, cn } from '@/lib/utils'
import { TranslatedText } from '@/components/TranslatedText'
import { SetupIntentConfirmer } from '@/components/SetupIntentConfirmer'

export const dynamic = 'force-dynamic'

interface ReservationPageProps {
  params: Promise<{ id: string }>
}

export default async function DirectReservationPage({ params }: ReservationPageProps) {
  const { id } = await params

  const supabase = createAdminClient()

  const { data: reservationData } = await supabase
    .from('reservations')
    .select(`
      *,
      experience:experiences(id, title, slug, duration_minutes, meeting_point, currency),
      session:experience_sessions(session_date, start_time)
    `)
    .eq('id', id)
    .single()

  if (!reservationData) {
    notFound()
  }

  const reservation = reservationData as any
  const date = reservation.session?.session_date || reservation.requested_date || ''
  const time = reservation.session?.start_time || reservation.requested_time || ''
  const experience = reservation.experience

  const { data: bookingData } = await supabase
    .from('bookings')
    .select('id, payment_mode, booking_status')
    .eq('reservation_id', id)
    .single()

  const booking = bookingData as any
  const isPayOnSiteConfirmed = booking?.payment_mode === 'pay_on_site' && booking?.booking_status === 'confirmed'

  return (
        <div className="max-w-2xl mx-auto">
          <div className="bg-card rounded-card border border-border p-8 text-center">
            {/* Status icon */}
            <div className={cn(
              'w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center',
              isPayOnSiteConfirmed && 'bg-success/10',
              !isPayOnSiteConfirmed && reservation.reservation_status === 'pending' && 'bg-warning/10',
              !isPayOnSiteConfirmed && reservation.reservation_status === 'approved' && 'bg-success/10',
              reservation.reservation_status === 'declined' && 'bg-destructive/10',
              reservation.reservation_status === 'expired' && 'bg-muted',
            )}>
              {(isPayOnSiteConfirmed || reservation.reservation_status === 'approved') && (
                <svg className="w-10 h-10 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
              {!isPayOnSiteConfirmed && reservation.reservation_status === 'pending' && (
                <svg className="w-10 h-10 text-warning" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
              {reservation.reservation_status === 'declined' && (
                <svg className="w-10 h-10 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
              {reservation.reservation_status === 'expired' && (
                <svg className="w-10 h-10 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
            </div>

            {/* Status title */}
            <h1 className="text-3xl text-heading-foreground mb-3">
              {isPayOnSiteConfirmed && 'Reservation Confirmed!'}
              {!isPayOnSiteConfirmed && reservation.reservation_status === 'pending' && (reservation.is_request ? 'Request Sent!' : 'Booking Processing!')}
              {!isPayOnSiteConfirmed && reservation.reservation_status === 'approved' && 'Booking Approved!'}
              {reservation.reservation_status === 'declined' && 'Booking Unavailable'}
              {reservation.reservation_status === 'expired' && (reservation.is_request ? 'Request Expired' : 'Booking Expired')}
            </h1>

            {/* Status message */}
            <p className="text-muted-foreground mb-8 text-base">
              {isPayOnSiteConfirmed &&
                'Your reservation is confirmed. You\'ll pay the provider directly when you arrive.'}
              {!isPayOnSiteConfirmed && reservation.reservation_status === 'pending' && reservation.is_request &&
                'Your booking request has been sent to the experience provider. They will respond within 48 hours.'}
              {!isPayOnSiteConfirmed && reservation.reservation_status === 'pending' && !reservation.is_request &&
                'Your booking is being processed. You will be redirected to payment shortly.'}
              {!isPayOnSiteConfirmed && reservation.reservation_status === 'approved' && reservation.stripe_payment_link_url &&
                'Great news! Your booking has been approved. Check your email for the payment link.'}
              {!isPayOnSiteConfirmed && reservation.reservation_status === 'approved' && !reservation.stripe_payment_link_url &&
                'Great news! Your booking has been approved. Check your email to confirm your reservation.'}
              {reservation.reservation_status === 'declined' &&
                'Unfortunately, the provider was unable to accept your booking for this time.'}
              {reservation.reservation_status === 'expired' && reservation.is_request &&
                'This booking request has expired. The provider did not respond in time.'}
              {reservation.reservation_status === 'expired' && !reservation.is_request &&
                'This booking has expired. The payment window has closed.'}
            </p>

            {/* Pay on site reminder */}
            {isPayOnSiteConfirmed && (
              <div className="flex items-start gap-3 p-4 rounded-button bg-accent/5 border border-accent/10 text-left mb-8">
                <svg className="w-5 h-5 text-accent mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="text-sm">
                  <p className="font-medium text-foreground">Pay on site</p>
                  <p className="text-muted-foreground mt-0.5">
                    Your card is on file as a guarantee for the cancellation policy. No charge has been made.
                  </p>
                </div>
              </div>
            )}

            {/* Booking details */}
            <div className="bg-background-alt rounded-card p-6 text-left mb-8">
              <h3 className="font-body text-foreground mb-4">Booking Details</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Experience</span>
                  <span className="font-medium text-foreground"><TranslatedText experienceId={experience.id} field="title" fallback={experience.title} /></span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Date</span>
                  <span className="font-medium text-foreground">
                    {date ? formatDate(date) : 'Custom request'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Time</span>
                  <span className="font-medium text-foreground">
                    {time ? formatTime(time) : 'Custom request'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Participants</span>
                  <span className="font-medium text-foreground">{reservation.participants}</span>
                </div>
                <div className="flex justify-between pt-3 border-t border-border">
                  <span className="font-semibold text-foreground">Total</span>
                  <span className="text-xl font-bold text-accent">
                    {formatPrice(reservation.total_cents, experience.currency)}
                  </span>
                </div>
              </div>
            </div>

            {/* Payment link for approved (stripe mode only) */}
            {!isPayOnSiteConfirmed && reservation.reservation_status === 'approved' && reservation.stripe_payment_link_url && (
              <a
                href={reservation.stripe_payment_link_url}
                className="inline-flex items-center justify-center px-8 py-3.5 bg-accent text-accent-foreground font-medium rounded-button hover:opacity-90 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2"
              >
                Complete Payment
              </a>
            )}

            {/* Back link */}
            <div className="mt-6">
              <Link
                href="/experiences"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to experiences
              </Link>
            </div>
          </div>

          <p className="text-center text-sm text-muted-foreground mt-6">
            We&apos;ve sent a confirmation email to <strong className="text-foreground">{reservation.guest_email}</strong>
          </p>

          <Suspense fallback={null}>
            <SetupIntentConfirmer reservationId={id} />
          </Suspense>
        </div>
  )
}
