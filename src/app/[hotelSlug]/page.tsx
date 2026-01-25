import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getHotelWithExperiences } from '@/lib/hotels'
import { getEmbedMode, cn } from '@/lib/utils'
import { Header } from '@/components/Header'
import { ExperienceCard } from '@/components/ExperienceCard'
import { ExperienceListClient } from '@/components/ExperienceListClient'

// Inherit dynamic from layout - hotel config changes take effect immediately
export const dynamic = 'force-dynamic'

interface HotelPageProps {
  params: Promise<{ hotelSlug: string }>
  searchParams: Promise<{ embed?: string; returnUrl?: string }>
}

export default async function HotelPage({ params, searchParams }: HotelPageProps) {
  const { hotelSlug } = await params
  const search = await searchParams
  const embedMode = getEmbedMode(search)
  const returnUrl = search.returnUrl
  
  const data = await getHotelWithExperiences(hotelSlug)
  
  if (!data) {
    notFound()
  }
  
  const { hotel, experiences } = data
  const titleEnabled = hotel.widget_title_enabled ?? true
  const widgetTitle = hotel.widget_title || 'Local Experiences'
  const rawSubtitle =
    hotel.widget_subtitle || 'Curated by the team at {{hotel_name}}'
  const widgetSubtitle = rawSubtitle.replace('{{hotel_name}}', hotel.display_name)
  
  // In section mode, limit to 3 experiences
  const displayExperiences = embedMode === 'section' 
    ? experiences.slice(0, 3)
    : experiences
  
  const hasMoreExperiences = embedMode === 'section' && experiences.length > 3
  
  return (
    <div className={cn(
      embedMode === 'full' ? 'embed-full' : 'embed-section'
    )}>
      {/* Header - only in full mode */}
      {embedMode === 'full' && (
        <Header 
          hotelName={hotel.display_name}
          logoUrl={hotel.logo_url}
          hotelSlug={hotelSlug}
          showBack={false}
        />
      )}
      
      <main className={cn(
        embedMode === 'full' ? 'px-4 py-6' : ''
      )}>
        {/* Title - configurable, shown in both embed modes */}
        {titleEnabled && (
          <div 
            className={cn(
              'w-full',
              embedMode === 'section' ? 'mb-0' : 'mb-6'
            )} 
            style={embedMode === 'section' ? { 
              marginTop: 0, 
              marginBottom: 0,
              paddingTop: 'var(--wp--preset--spacing--50, 3rem)',
              paddingBottom: 'var(--wp--preset--spacing--50, 3rem)',
              paddingLeft: 0,
              paddingRight: 0
            } : {}}
          >
            <div 
              className={cn(
                embedMode === 'section' ? 'max-w-[1480px] mx-auto px-4' : 'container mx-auto'
              )}
            >
              <h1 
                className="font-heading text-foreground"
                style={{ fontSize: 'var(--font-size-title)' }}
              >
                {widgetTitle}
              </h1>
              {widgetSubtitle && (
                <p 
                  className="text-muted-foreground mt-2"
                  style={{ fontSize: 'var(--font-size-h3)' }}
                >
                  {widgetSubtitle}
                </p>
              )}
            </div>
          </div>
        )}
        
        <div className={cn(
          'container',
          embedMode === 'full' ? 'px-4' : 'p-4'
        )}>
        
        {/* Experience grid */}
        {experiences.length > 0 ? (
          <>
            <ExperienceListClient 
              experiences={displayExperiences}
              hotelSlug={hotelSlug}
              embedMode={embedMode}
            />
            
            {/* View all link - section mode only */}
            {hasMoreExperiences && (
              <div className="mt-8 mb-8 text-center">
                <Link
                  href={
                    returnUrl
                      ? `/${hotelSlug}?embed=full&returnUrl=${encodeURIComponent(returnUrl)}`
                      : `/${hotelSlug}?embed=full`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-accent text-accent-foreground font-medium rounded-button hover:bg-accent-hover transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
                >
                  See all {experiences.length} experiences
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </Link>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No experiences available</p>
          </div>
        )}
        </div>
      </main>
      
      {/* Embed mode resize script */}
      {embedMode === 'section' && (
        <EmbedResizer />
      )}
    </div>
  )
}

// Client component for iframe resizing
function EmbedResizer() {
  return (
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
  )
}