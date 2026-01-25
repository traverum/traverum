import { notFound } from 'next/navigation'
import { getHotelBySlug, getExperienceForHotel } from '@/lib/hotels'
import { getAvailableSessions } from '@/lib/sessions'
import { getEmbedMode, formatDuration, cn } from '@/lib/utils'
import { Header } from '@/components/Header'
import { ImageGallery } from '@/components/ImageGallery'
import { BookingPanel } from '@/components/BookingPanel'
import { ExperienceDetailClient } from '@/components/ExperienceDetailClient'
import { RichText } from '@/components/RichText'
import type { Metadata } from 'next'

// Force dynamic rendering so hotel config changes take effect immediately
export const dynamic = 'force-dynamic'

interface ExperiencePageProps {
  params: Promise<{ hotelSlug: string; experienceSlug: string }>
  searchParams: Promise<{ embed?: string; returnUrl?: string }>
}

export async function generateMetadata({ params }: ExperiencePageProps): Promise<Metadata> {
  const { hotelSlug, experienceSlug } = await params
  const experience = await getExperienceForHotel(hotelSlug, experienceSlug)
  const hotel = await getHotelBySlug(hotelSlug)
  
  if (!experience || !hotel) {
    return { title: 'Experience Not Found' }
  }
  
  return {
    title: `${experience.title} - ${hotel.display_name}`,
    description: experience.description.slice(0, 160),
  }
}

export default async function ExperiencePage({ params, searchParams }: ExperiencePageProps) {
  const { hotelSlug, experienceSlug } = await params
  const search = await searchParams
  const embedMode = getEmbedMode(search)
  const returnUrl = search.returnUrl
  
  const [hotel, experience] = await Promise.all([
    getHotelBySlug(hotelSlug),
    getExperienceForHotel(hotelSlug, experienceSlug),
  ])
  
  if (!hotel || !experience) {
    notFound()
  }
  
  const sessions = await getAvailableSessions(experience.id)
  
  return (
    <div className={cn(
      embedMode === 'full' ? 'embed-full' : 'embed-section',
      'min-h-screen pb-20 md:pb-0'
    )}>
      {/* Header - only in full mode */}
      {embedMode === 'full' && (
        <Header 
          hotelName={hotel.display_name}
          logoUrl={hotel.logo_url}
          hotelSlug={hotelSlug}
          showBack={true}
          backTo={returnUrl ? `/${hotelSlug}?embed=full&returnUrl=${encodeURIComponent(returnUrl)}` : `/${hotelSlug}?embed=full`}
        />
      )}
      
      <main className="container px-4 py-4 md:py-6">
        <div className="md:grid md:grid-cols-5 md:gap-6">
          {/* Left Column - Content */}
          <div className="md:col-span-3">
            <ImageGallery
              images={experience.media}
              fallbackImage={experience.image_url}
              title={experience.title}
            />
            
            <div className="mt-5">
              <h1 
                className="font-heading text-foreground"
                style={{ fontSize: 'var(--font-size-h1)' }}
              >
                {experience.title}
              </h1>
              <p 
                className="text-muted-foreground mt-1"
                style={{ fontSize: 'var(--font-size-sm)' }}
              >
                {formatDuration(experience.duration_minutes)} · Up to {experience.max_participants} people
              </p>
              <RichText
                text={experience.description}
                className="text-foreground mt-3 leading-relaxed font-body"
                style={{ fontSize: 'var(--font-size-body)' }}
              />
            </div>

            {/* Info Sections */}
            <div className="mt-6 pt-6 border-t border-border space-y-4">
              <div>
                <h3 
                  className="font-body text-foreground"
                  style={{ fontSize: 'var(--font-size-h3)' }}
                >
                  How it works
                </h3>
                <p 
                  className="text-muted-foreground mt-0.5"
                  style={{ fontSize: 'var(--font-size-sm)' }}
                >
                  Reserve now — free and non-binding. Pay after provider confirms.
                </p>
              </div>
              <div>
                <h3 
                  className="font-body text-foreground"
                  style={{ fontSize: 'var(--font-size-h3)' }}
                >
                  Cancellation
                </h3>
                <p 
                  className="text-muted-foreground mt-0.5"
                  style={{ fontSize: 'var(--font-size-sm)' }}
                >
                  Free cancellation up to 7 days before.
                </p>
              </div>
              {experience.meeting_point && (
                <div>
                  <h3 
                    className="font-body text-foreground"
                    style={{ fontSize: 'var(--font-size-h3)' }}
                  >
                    Meeting point
                  </h3>
                  <p 
                    className="text-muted-foreground mt-0.5"
                    style={{ fontSize: 'var(--font-size-sm)' }}
                  >
                    {experience.meeting_point}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Booking Panel (Desktop) */}
          <div className="hidden md:block md:col-span-2">
            <div className="sticky top-6">
              <BookingPanel
                experience={experience}
                sessions={sessions}
                hotelSlug={hotelSlug}
              />
            </div>
          </div>
        </div>
      </main>

      {/* Mobile Booking Components */}
      <ExperienceDetailClient
        experience={experience}
        sessions={sessions}
        hotelSlug={hotelSlug}
      />
      
      {/* Embed mode resize script */}
      {embedMode === 'section' && (
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                function sendHeight() {
                  var height = document.body.scrollHeight;
                  window.parent.postMessage({ type: 'traverum-resize', height: height }, '*');
                }
                sendHeight();
                window.addEventListener('resize', sendHeight);
                new MutationObserver(sendHeight).observe(document.body, { childList: true, subtree: true });
              })();
            `,
          }}
        />
      )}
    </div>
  )
}