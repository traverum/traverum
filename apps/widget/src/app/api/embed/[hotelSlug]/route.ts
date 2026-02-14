import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { embedLimiter, getClientIp } from '@/lib/rate-limit'

/**
 * Public API endpoint for the Shadow DOM embed widget.
 * Returns hotel theme config + experience card data as JSON.
 * 
 * GET /api/embed/{hotelSlug}?max=3
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ hotelSlug: string }> }
) {
  // Rate limiting — skip in development if KV is not configured
  if (process.env.KV_REST_API_URL) {
    const ip = getClientIp(request)
    const { success } = await embedLimiter.limit(ip)
    if (!success) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429 }
      )
    }
  }

  const { hotelSlug } = await params
  const { searchParams } = new URL(request.url)
  const maxExperiences = parseInt(searchParams.get('max') || '6', 10)

  const supabase = createAdminClient()

  // Fetch hotel config
  const { data: hotelData, error: hotelError } = await supabase
    .from('hotel_configs')
    .select('*')
    .eq('slug', hotelSlug)
    .eq('is_active', true)
    .single()

  if (hotelError || !hotelData) {
    return NextResponse.json(
      { error: 'Hotel not found' },
      { status: 404 }
    )
  }

  const hotel = hotelData as any

  // Fetch distributions for this hotel config with experiences
  // Scope by hotel_config_id for multi-property support
  const { data: distributionsData, error: distError } = await (supabase
    .from('distributions') as any)
    .select(`
      *,
      experience:experiences!distributions_experience_fk (
        id,
        title,
        slug,
        description,
        image_url,
        duration_minutes,
        max_participants,
        price_cents,
        base_price_cents,
        extra_person_cents,
        pricing_type,
        currency,
        experience_status,
        tags,
        available_languages
      )
    `)
    .eq('hotel_config_id', hotel.id)
    .eq('is_active', true)

  if (distError) {
    return NextResponse.json(
      { error: 'Failed to fetch experiences' },
      { status: 500 }
    )
  }

  const distributions = (distributionsData || []) as any[]

  // Get active experiences
  const activeExperiences = distributions
    .filter(d => d.experience && d.experience.experience_status === 'active')
    .map(d => d.experience)

  // Fetch cover images for all experiences
  const experienceIds = activeExperiences.map((e: any) => e.id)
  
  let mediaMap: Record<string, string> = {}
  if (experienceIds.length > 0) {
    const { data: mediaData } = await supabase
      .from('media')
      .select('experience_id, url')
      .in('experience_id', experienceIds)
      .order('sort_order', { ascending: true })

    if (mediaData) {
      // Get first image per experience
      for (const m of mediaData as any[]) {
        if (!mediaMap[m.experience_id]) {
          mediaMap[m.experience_id] = m.url
        }
      }
    }
  }

  // Build experience card data
  const experiences = activeExperiences
    .slice(0, maxExperiences)
    .map((exp: any) => {
      // Calculate display price
      let priceDisplay = { amount: 0, suffix: '' }
      switch (exp.pricing_type) {
        case 'per_person':
          priceDisplay = {
            amount: exp.extra_person_cents || exp.price_cents,
            suffix: '/ person',
          }
          break
        case 'base_plus_extra':
          priceDisplay = {
            amount: exp.base_price_cents || exp.price_cents,
            suffix: '/ group',
          }
          break
        case 'flat_rate':
        default:
          priceDisplay = {
            amount: exp.base_price_cents || exp.price_cents,
            suffix: '',
          }
      }

      return {
        id: exp.id,
        title: exp.title,
        slug: exp.slug,
        coverImage: mediaMap[exp.id] || exp.image_url || null,
        durationMinutes: exp.duration_minutes,
        priceCents: priceDisplay.amount,
        priceSuffix: priceDisplay.suffix,
        currency: exp.currency || 'EUR',
        tags: exp.tags || [],
        availableLanguages: exp.available_languages || [],
      }
    })

  // Build theme config
  const theme = {
    accentColor: hotel.accent_color || '#2563eb',
    textColor: hotel.text_color || '#1a1a1a',
    backgroundColor: hotel.background_color || '#ffffff',
    cardRadius: hotel.card_radius || '12px',
    headingFontFamily: hotel.heading_font_family || 'Poppins, system-ui, sans-serif',
    bodyFontFamily: hotel.body_font_family || 'Inter, system-ui, sans-serif',
    headingFontWeight: hotel.heading_font_weight || '200',
    fontSizeBase: hotel.font_size_base || '16',
    textAlign: hotel.widget_text_align || 'left',
    sectionPadding: hotel.widget_section_padding || '0',
    titleMargin: hotel.widget_title_margin || '24px',
    gridGap: hotel.widget_grid_gap || '20px',
    ctaMargin: hotel.widget_cta_margin || '28px',
    gridMinWidth: hotel.widget_grid_min_width || '280px',
  }

  // Build widget config
  const widget = {
    titleEnabled: hotel.widget_title_enabled ?? true,
    title: hotel.widget_title || 'Local Experiences',
    subtitle: (hotel.widget_subtitle || 'Curated by the team at {{hotel_name}}')
      .replace('{{hotel_name}}', hotel.display_name),
    hotelName: hotel.display_name,
    hotelSlug: hotel.slug,
    totalExperiences: activeExperiences.length,
  }

  const response = NextResponse.json({
    widget,
    theme,
    experiences,
  })

  // CORS headers — allow embedding from any origin
  response.headers.set('Access-Control-Allow-Origin', '*')
  response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type')
  response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300')

  return response
}

// Handle CORS preflight
export async function OPTIONS() {
  const response = new NextResponse(null, { status: 204 })
  response.headers.set('Access-Control-Allow-Origin', '*')
  response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type')
  return response
}
