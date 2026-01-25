import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/server'
import { getHotelBySlug } from '@/lib/hotels'
import { formatDate, formatTime, formatPrice, cn } from '@/lib/utils'
import { Header } from '@/components/Header'

// Force dynamic rendering so hotel config changes take effect immediately
export const dynamic = 'force-dynamic'

interface ReservationPageProps {
  params: Promise<{ hotelSlug: string; id: string }>
  searchParams: Promise<{ embed?: string; returnUrl?: string }>
}

export default async function ReservationPage({ params, searchParams }: ReservationPageProps) {
  const { hotelSlug, id } = await params
  const search = await searchParams
  const returnUrl = search.returnUrl
  
  const hotel = await getHotelBySlug(hotelSlug)
  if (!hotel) {
    notFound()
  }
  
  const supabase = createAdminClient()
  
  const { data: reservationData } = await supabase
    .from('reservations')
    .select(`
      *,
      experience:experiences(title, slug, duration_minutes, meeting_point, currency),
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
  
  return (
    <div className="embed-full">
      <Header 
        hotelName={hotel.display_name}
        logoUrl={hotel.logo_url}
        hotelSlug={hotelSlug}
        showBack={true}
        backTo={returnUrl ? `/${hotelSlug}?embed=full&returnUrl=${encodeURIComponent(returnUrl)}` : `/${hotelSlug}?embed=full`}
      />
      
      <main className="container px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-card rounded-card border border-border p-8 text-center">
            {/* Status icon */}
            <div className={cn(
              'w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center',
              reservation.reservation_status === 'pending' && 'bg-warning/10',
              reservation.reservation_status === 'approved' && 'bg-success/10',
              reservation.reservation_status === 'declined' && 'bg-destructive/10',
              reservation.reservation_status === 'expired' && 'bg-muted',
            )}>
              {reservation.reservation_status === 'pending' && (
                <svg className="w-10 h-10 text-warning" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
              {reservation.reservation_status === 'approved' && (
                <svg className="w-10 h-10 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
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
            <h1 className="text-3xl text-card-foreground mb-3">
              {reservation.reservation_status === 'pending' && 'Request Sent!'}
              {reservation.reservation_status === 'approved' && 'Booking Approved!'}
              {reservation.reservation_status === 'declined' && 'Booking Unavailable'}
              {reservation.reservation_status === 'expired' && 'Request Expired'}
            </h1>
            
            {/* Status message */}
            <p className="text-muted-foreground mb-8 text-base">
              {reservation.reservation_status === 'pending' && 
                'Your booking request has been sent to the experience provider. They will respond within 48 hours.'}
              {reservation.reservation_status === 'approved' && 
                'Great news! Your booking has been approved. Check your email for the payment link.'}
              {reservation.reservation_status === 'declined' && 
                'Unfortunately, the provider was unable to accept your booking for this time.'}
              {reservation.reservation_status === 'expired' && 
                'This booking request has expired. The provider did not respond in time.'}
            </p>
            
            {/* Booking details */}
            <div className="bg-background-alt rounded-card p-6 text-left mb-8">
              <h3 className="font-body text-foreground mb-4">Booking Details</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Experience</span>
                  <span className="font-medium text-foreground">{experience.title}</span>
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
            
            {/* Payment link for approved */}
            {reservation.reservation_status === 'approved' && reservation.stripe_payment_link_url && (
              <a
                href={reservation.stripe_payment_link_url}
                className="inline-flex items-center justify-center px-8 py-3.5 bg-accent text-accent-foreground font-medium rounded-button hover:bg-accent-hover transition-colors focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
              >
                Complete Payment
              </a>
            )}
            
            {/* Back link */}
            <div className="mt-6">
              <Link
                href={
                  returnUrl
                    ? `/${hotelSlug}?returnUrl=${encodeURIComponent(returnUrl)}`
                    : `/${hotelSlug}`
                }
                className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to experiences
              </Link>
            </div>
          </div>
          
          {/* Email notice */}
          <p className="text-center text-sm text-muted-foreground mt-6">
            We've sent a confirmation email to <strong className="text-foreground">{reservation.guest_email}</strong>
          </p>
        </div>
      </main>
    </div>
  )
}
