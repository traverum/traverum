import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { getHotelBySlug } from '@/lib/hotels'
import { createAdminClient } from '@/lib/supabase/server'
import { getEmbedMode, cn } from '@/lib/utils'
import { isDemoHotel } from '@/lib/demo'
import { Header } from '@/components/Header'
import { CheckoutForm } from '@/components/CheckoutForm'
import { BookingSummary } from '@/components/BookingSummary'
import type { Experience, ExperienceSession } from '@/lib/supabase/types'

// Force dynamic rendering so hotel config changes take effect immediately
export const dynamic = 'force-dynamic'

interface CheckoutPageProps {
  params: Promise<{ hotelSlug: string }>
  searchParams: Promise<{
    embed?: string
    returnUrl?: string
    experienceId?: string
    sessionId?: string
    participants?: string
    total?: string
    isRequest?: string
    requestDate?: string
    requestTime?: string
  }>
}

export default async function CheckoutPage({ params, searchParams }: CheckoutPageProps) {
  const { hotelSlug } = await params
  const search = await searchParams
  const embedMode = getEmbedMode(search)
  const returnUrl = search.returnUrl
  
  // Validate required params
  const experienceId = search.experienceId
  const participantsStr = search.participants
  const totalStr = search.total
  
  if (!experienceId || !participantsStr || !totalStr) {
    redirect(
      returnUrl
        ? `/${hotelSlug}?returnUrl=${encodeURIComponent(returnUrl)}`
        : `/${hotelSlug}`
    )
  }
  
  const hotel = await getHotelBySlug(hotelSlug)
  if (!hotel) {
    notFound()
  }
  
  // Fetch experience
  const supabase = createAdminClient()
  
  const { data: experienceData } = await supabase
    .from('experiences')
    .select('*')
    .eq('id', experienceId)
    .single()
  
  if (!experienceData) {
    notFound()
  }
  
  const experience = experienceData as Experience
  
  // Fetch session if provided
  let session: ExperienceSession | null = null
  if (search.sessionId) {
    const { data } = await supabase
      .from('experience_sessions')
      .select('*')
      .eq('id', search.sessionId)
      .single()
    session = data as ExperienceSession | null
  }
  
  // Get cover image
  const { data: mediaData } = await supabase
    .from('media')
    .select('url')
    .eq('experience_id', experienceId)
    .order('sort_order')
    .limit(1)
  
  const media = mediaData as { url: string }[] | null
  const coverImage = media?.[0]?.url || experience.image_url
  
  const participants = parseInt(participantsStr)
  const totalCents = parseInt(totalStr)
  const isRequest = search.isRequest === 'true'
  const isDemo = isDemoHotel(hotelSlug)
  
  // Get session date/time for demo display
  const sessionDate = session?.session_date
  const sessionTime = session?.start_time
  
  return (
    <div className={cn(
      embedMode === 'full' ? 'embed-full' : 'embed-section'
    )}>
      {embedMode === 'full' && (
        <Header 
          hotelName={hotel.display_name}
          logoUrl={hotel.logo_url}
          hotelSlug={hotelSlug}
          showBack={true}
          backTo={returnUrl ? `/${hotelSlug}?embed=full&returnUrl=${encodeURIComponent(returnUrl)}` : `/${hotelSlug}?embed=full`}
        />
      )}
      
      <main className="container px-4 py-6">
        {/* Back link */}
        <Link
          href={
            returnUrl
              ? `/${hotelSlug}/${experience.slug}?returnUrl=${encodeURIComponent(returnUrl)}`
              : `/${hotelSlug}/${experience.slug}`
          }
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to experience
        </Link>
        
        <h1 className="text-2xl text-foreground mb-6">
          Complete Your Booking
        </h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Form */}
          <div className="lg:col-span-3">
            <div className="bg-card rounded-card border border-border p-6">
              <h2 className="text-lg font-body text-card-foreground mb-5">
                Guest Details
              </h2>
              
              <CheckoutForm
                hotelSlug={hotelSlug}
                experienceId={experience.id}
                experienceTitle={experience.title}
                currency={experience.currency}
                sessionId={search.sessionId}
                participants={participants}
                totalCents={totalCents}
                isRequest={isRequest}
                requestDate={search.requestDate}
                requestTime={search.requestTime}
                sessionDate={sessionDate}
                sessionTime={sessionTime}
                isDemo={isDemo}
              />
            </div>
          </div>
          
          {/* Summary */}
          <div className="lg:col-span-2">
            <BookingSummary
              experience={experience}
              session={session}
              participants={participants}
              totalCents={totalCents}
              isRequest={isRequest}
              requestDate={search.requestDate}
              requestTime={search.requestTime}
              coverImage={coverImage}
            />
          </div>
        </div>
      </main>
    </div>
  )
}
