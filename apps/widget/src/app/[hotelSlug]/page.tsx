import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getHotelWithExperiences, getSessionCalendar } from '@/lib/hotels'
import { getEmbedMode, cn } from '@/lib/utils'
import { logAnalyticsEvent, parseSource } from '@/lib/analytics.server'
import { Header } from '@/components/Header'
import { ExperienceListClient } from '@/components/ExperienceListClient'
import { FilterableExperienceBrowser } from '@/components/FilterableExperienceBrowser'
import { HostsSection } from '@/components/HostsSection'
import { AnalyticsSessionInit } from '@/components/AnalyticsSessionInit'
import { PostHogHotelContext } from '@/components/PostHogHotelContext'
import { EmbedResizer } from '@/components/EmbedResizer'

// Inherit dynamic from layout - hotel config changes take effect immediately
export const dynamic = 'force-dynamic'

interface HotelPageProps {
  params: Promise<{ hotelSlug: string }>
  searchParams: Promise<{ embed?: string; returnUrl?: string; source?: string }>
}

export default async function HotelPage({ params, searchParams }: HotelPageProps) {
  const { hotelSlug } = await params
  const search = await searchParams
  const embedMode = getEmbedMode(search)
  const returnUrl = search.returnUrl
  const source = parseSource(search.source)
  
  const data = await getHotelWithExperiences(hotelSlug)
  
  if (!data) {
    notFound()
  }
  
  const { hotel, experiences } = data

  const experienceIds = experiences.map((e) => e.id)
  const sessionCalendar = await getSessionCalendar(experienceIds)

  logAnalyticsEvent({
    event_type: 'widget_view',
    hotel_config_id: hotel.id,
    source,
    embed_mode: embedMode === 'section' ? 'section' : 'full',
  })
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
      embedMode === 'full' ? 'embed-full' : 'embed-section',
      embedMode === 'section' && 'overflow-hidden'
    )}>
      {/* Header - only in full mode */}
      {embedMode === 'full' && (
        <Header 
          hotelName={hotel.display_name}
          logoUrl={hotel.logo_url}
          hotelSlug={hotelSlug}
          showBack={false}
          returnUrl={returnUrl}
          websiteUrl={hotel.website_url}
        />
      )}
      
      <main className={cn(
        embedMode === 'full' ? 'px-4 py-6' : ''
      )}>
        {/* Title - configurable, shown in both embed modes */}
        {titleEnabled && embedMode === 'section' && (
          <div 
            className="w-full mb-0 embed-section-title-wrapper"
            style={{ 
              marginTop: 0, 
              marginBottom: 0,
              paddingTop: hotelSlug === 'hotel-rosa' ? '0' : 'var(--wp--preset--spacing--50, 3rem)',
              paddingBottom: hotelSlug === 'hotel-rosa' ? '0' : 'var(--wp--preset--spacing--50, 3rem)',
              paddingLeft: 0,
              paddingRight: 0
            }}
          >
            <div 
              className={cn(
                hotelSlug === 'hotel-rosa' 
                  ? 'embed-section-container' 
                  : 'max-w-[1480px] mx-auto px-4'
              )}
            >
              <h1 
                className={cn(
                  "font-heading text-heading-foreground",
                  hotelSlug === 'hotel-rosa' && 'embed-section-title'
                )}
                style={{ 
                  fontSize: hotelSlug === 'hotel-rosa' ? '48px' : 'var(--font-size-title)' 
                }}
              >
                {widgetTitle}
              </h1>
              {widgetSubtitle && (
                <p 
                  className={cn(
                    "text-muted-foreground mt-2",
                    hotelSlug === 'hotel-rosa' && 'embed-section-subtitle'
                  )}
                  style={{ fontSize: 'var(--font-size-h3)' }}
                >
                  {widgetSubtitle}
                </p>
              )}
            </div>
          </div>
        )}
        {titleEnabled && embedMode === 'full' && (
          <div className="flex flex-col items-center text-center py-10 md:py-14">
            <p className="text-[11px] sm:text-xs font-body font-extralight tracking-[0.35em] uppercase text-muted-foreground mb-3">
              {widgetSubtitle}
            </p>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-heading font-light text-heading-foreground tracking-tight leading-[0.95]">
              {widgetTitle}
            </h1>
          </div>
        )}
        
        <div 
          className={cn(
            embedMode === 'section' && hotelSlug === 'hotel-rosa' 
              ? 'embed-section-container' 
              : 'container',
            embedMode === 'full' ? 'px-4' : embedMode === 'section' && hotelSlug === 'hotel-rosa' ? '' : 'p-4'
          )}
          style={embedMode === 'section' && hotelSlug === 'hotel-rosa' ? {
            maxWidth: '1248px',
            marginLeft: 'auto',
            marginRight: 'auto',
            paddingLeft: 'calc(4% / 2)',
            paddingRight: 'calc(4% / 2)'
          } : {}}
        >
        
        {/* Experience grid */}
        {experiences.length > 0 ? (
          embedMode === 'full' ? (
            <>
            <FilterableExperienceBrowser
              experiences={experiences}
              sessionCalendar={sessionCalendar}
              hotelSlug={hotelSlug}
              embedMode={embedMode}
              returnUrl={returnUrl}
              hotelConfigId={hotel.id}
            />
            <Suspense>
              <HostsSection hotelConfigId={hotel.id} channelSlug={hotelSlug} />
            </Suspense>
            </>
          ) : (
            <>
              <ExperienceListClient 
                experiences={displayExperiences}
                hotelSlug={hotelSlug}
                embedMode={embedMode}
                returnUrl={returnUrl}
                cardStyle="veyond"
                hotelConfigId={hotel.id}
              />
              
              {hasMoreExperiences && (
                <div className="mt-8 mb-8 text-center">
                  <Link
                    href={
                      returnUrl
                        ? `/${hotelSlug}?returnUrl=${encodeURIComponent(returnUrl)}`
                        : `/${hotelSlug}`
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
          )
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No experiences available</p>
          </div>
        )}
        </div>
      </main>
      
      <AnalyticsSessionInit source={source} />
      <PostHogHotelContext
        hotelConfigId={hotel.id}
        hotelSlug={hotelSlug}
        hotelName={hotel.display_name}
        channel="white-label"
      />

      {/* Embed mode resize + body classes (client-only, after hydration) */}
      {embedMode === 'section' && <EmbedResizer />}
    </div>
  )
}