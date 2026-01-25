import { notFound } from 'next/navigation'
import { getHotelBySlug } from '@/lib/hotels'
import { hexToHsl } from '@/lib/utils'
import type { Metadata } from 'next'

// Force dynamic rendering so hotel config changes take effect immediately
export const dynamic = 'force-dynamic'
// Disable all fetch caching for this route segment
export const fetchCache = 'force-no-store'
// Disable revalidation - always fetch fresh
export const revalidate = 0

interface HotelLayoutProps {
  children: React.ReactNode
  params: Promise<{ hotelSlug: string }>
}

export async function generateMetadata({ params }: HotelLayoutProps): Promise<Metadata> {
  const { hotelSlug } = await params
  const hotel = await getHotelBySlug(hotelSlug)
  
  if (!hotel) {
    return {
      title: 'Hotel Not Found',
    }
  }
  
  return {
    title: `${hotel.display_name} - Book Local Experiences`,
    description: `Discover and book amazing local experiences through ${hotel.display_name}`,
  }
}

export default async function HotelLayout({ children, params }: HotelLayoutProps) {
  const { hotelSlug } = await params
  const hotel = await getHotelBySlug(hotelSlug)
  
  if (!hotel) {
    notFound()
  }
  
  // Generate CSS variables for theming (convert hex to HSL)
  // Accent color (buttons, interactive elements)
  const accentColor = hotel.accent_color || '#2563eb'
  const accentHsl = hexToHsl(accentColor)
  const [aH, aS, aL] = accentHsl.split(' ').map(v => parseFloat(v.replace('%', '')))
  
  // Auto-calculate button text: black if accent is light, white if dark
  const accentForeground = aL > 50 ? '0 0% 0%' : '0 0% 100%'
  
  // Auto-calculate accent hover (slightly darker)
  const accentHoverL = Math.max(0, aL - 8) // Darken by 8%
  
  // Convert text and background colors to HSL
  const textColor = hotel.text_color || '#1a1a1a'
  const textHsl = hexToHsl(textColor)
  
  const backgroundColor = hotel.background_color || '#ffffff'
  const backgroundHsl = hexToHsl(backgroundColor)
  
  // Calculate background-alt (slightly different for subtle contrast)
  const [bgH, bgS, bgL] = backgroundHsl.split(' ').map(v => parseFloat(v.replace('%', '')))
  const isDarkBackground = bgL < 50
  const backgroundAltL = isDarkBackground ? Math.min(100, bgL + 3) : Math.max(0, bgL - 2)
  
  // Calculate card background (slightly different from main background)
  const cardBgL = isDarkBackground ? Math.min(100, bgL + 5) : bgL
  const cardBgHsl = `${bgH} ${bgS}% ${cardBgL}%`
  
  // Calculate border color based on background lightness
  const borderL = isDarkBackground ? Math.min(100, bgL + 15) : Math.max(0, bgL - 10)
  const borderHsl = `${bgH} ${Math.max(0, bgS - 10)}% ${borderL}%`
  
  // Calculate muted/secondary background
  const mutedBgL = isDarkBackground ? Math.min(100, bgL + 8) : Math.max(0, bgL - 4)
  const mutedBgHsl = `${bgH} ${bgS}% ${mutedBgL}%`
  
  // Auto-calculate link color: black if bg is light, white if dark
  const linkColor = bgL > 50 ? '0 0% 10%' : '0 0% 95%'
  
  // Calculate muted text color (appropriate contrast for background)
  const [textH, textS, textL] = textHsl.split(' ').map(v => parseFloat(v.replace('%', '')))
  const mutedTextL = isDarkBackground 
    ? Math.max(0, textL - 25) // Darken muted text for dark backgrounds
    : Math.min(100, textL + 30) // Lighten muted text for light backgrounds
  const mutedTextHsl = `${textH} ${Math.max(0, textS - 20)}% ${mutedTextL}%`
  
  // Get card radius - ensure we handle the "0" string case properly
  const cardRadius = hotel.card_radius ?? '0.75rem'
  
  // Calculate font sizes from base (default 16px)
  const basePx = parseInt(hotel.font_size_base || '16')
  // Calculate responsive title size using clamp() for mobile responsiveness
  const configuredTitleSize = hotel.title_font_size || `${basePx * 4}px`
  const titleSizePx = parseInt(configuredTitleSize.replace('px', '')) || (basePx * 4)
  // Use clamp: min 50% of size (mobile), preferred scales smoothly with viewport, max full size (desktop)
  // Formula ensures smooth scaling from mobile (375px) to desktop (1920px+)
  const minSize = Math.round(titleSizePx * 0.5)
  // Calculate vw to scale from min at ~375px to max at ~1920px: (max - min) / (1920 - 375) * 100
  const vwMultiplier = ((titleSizePx - minSize) / (1920 - 375)) * 100
  const vwSize = Math.round(vwMultiplier * 10) / 10 // Round to 1 decimal for cleaner CSS
  const titleSize = `clamp(${minSize}px, ${vwSize}vw, ${titleSizePx}px)`
  
  // Font families with defaults
  // Default: Poppins (current font) for headings, Inter for body text
  const headingFont = hotel.heading_font_family || 'var(--font-sans), Poppins, system-ui, sans-serif'
  const bodyFont = hotel.body_font_family || 'Inter, system-ui, sans-serif'
  
  const cssVariables = {
    '--accent': accentHsl,
    '--accent-hover': `${aH} ${aS}% ${accentHoverL}%`,
    '--accent-foreground': accentForeground,
    '--link-color': linkColor,
    '--ring': accentHsl,
    '--foreground': textHsl,
    '--background': backgroundHsl,
    '--background-alt': `${bgH} ${bgS}% ${backgroundAltL}%`,
    '--card': cardBgHsl,
    '--card-foreground': textHsl,
    '--border': borderHsl,
    '--input': borderHsl,
    '--muted': mutedBgHsl,
    '--muted-foreground': mutedTextHsl,
    '--secondary': mutedBgHsl,
    '--secondary-foreground': textHsl,
    '--popover': cardBgHsl,
    '--popover-foreground': textHsl,
    '--radius-card': cardRadius,
    // Font families
    '--font-heading': headingFont,
    '--font-body': bodyFont,
    // Font weights
    '--font-weight-heading': hotel.heading_font_weight || '200',  // Default: extra light
    '--font-weight-base': '400',  // Always 400 for body text readability
    '--font-weight-medium': '500',
    '--font-weight-semibold': '600',
    '--font-weight-bold': '700',
    // Font sizes - scalable system
    '--font-size-base': `${basePx}px`,
    '--font-size-title': titleSize,                        // Main page title (64px for client)
    '--font-size-h1': `${Math.round(basePx * 2)}px`,       // Experience detail title (32px)
    '--font-size-h2': `${Math.round(basePx * 1.5)}px`,     // Large headings (24px)
    '--font-size-h3': `${Math.round(basePx * 1.125)}px`,   // Section headings (18px)
    '--font-size-body': `${basePx}px`,                     // Body text (16px)
    '--font-size-sm': `${Math.round(basePx * 0.875)}px`,   // Small text (14px)
    '--font-size-lg': `${Math.round(basePx * 1.25)}px`,    // Large/price text (20px)
  } as React.CSSProperties
  
  // Inject CSS variables - use body level so --font-fraunces from Next.js is accessible
  const cssVarsString = Object.entries(cssVariables)
    .map(([key, value]) => `${key}: ${value};`)
    .join('\n    ');
  
  return (
    <>
      {/* Inject CSS variables at body level where Next.js font variables are available */}
      <style dangerouslySetInnerHTML={{
        __html: `
          body {
            ${cssVarsString}
            background-color: ${backgroundColor} !important;
            color: ${textColor} !important;
          }
          /* Also set on the wrapper for components that need it */
          [data-hotel-theme] {
            ${cssVarsString}
          }
        `
      }} />
      <div
        data-hotel-theme="true"
        style={{
          fontFamily: bodyFont,
          fontSize: `${basePx}px`,
          backgroundColor: backgroundColor,
          color: textColor,
          minHeight: '100vh',
        }}
      >
        {children}
      </div>
    </>
  )
}
