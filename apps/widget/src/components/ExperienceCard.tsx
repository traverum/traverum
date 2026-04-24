'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDuration, formatPrice } from '@/lib/utils'
import { getPriceDisplay } from '@/lib/pricing'
import { trackExperienceView } from '@/lib/analytics.client'
import { useTranslatedExperience } from '@/hooks/useTranslatedExperience'
import type { ExperienceWithMedia } from '@/lib/hotels'

interface ExperienceCardProps {
  experience: ExperienceWithMedia
  hotelSlug: string
  embedMode?: 'full' | 'section'
  returnUrl?: string | null
  /** When 'veyond', uses large portrait card with duration badge, location, and "From X" price (for /experiences) */
  cardStyle?: 'default' | 'veyond'
  hotelConfigId?: string | null
  /** Show "On Request" badge for request-based experiences when date/time filters are active */
  showRequestBadge?: boolean
  /** 0-based index within the current tag section (for conversion-by-slot analytics) */
  positionInSection?: number
  /** Tag id of the section this card is rendered under */
  sectionId?: string
  /** Total cards in this section */
  totalInSection?: number
}

const MAX_RETRIES = 2

export function ExperienceCard({ experience, hotelSlug, embedMode = 'full', returnUrl, cardStyle = 'default', hotelConfigId, showRequestBadge, positionInSection, sectionId, totalInSection }: ExperienceCardProps) {
  const [imgError, setImgError] = useState(false)
  const [retryCount, setRetryCount] = useState(0)
  const cardRef = useRef<HTMLAnchorElement>(null)
  const { title: translatedTitle, isTranslating } = useTranslatedExperience(experience)

  useEffect(() => {
    const el = cardRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          trackExperienceView(experience.id, hotelConfigId, {
            positionInSection,
            sectionId,
            totalInSection,
          })
          observer.disconnect()
        }
      },
      { threshold: 0.5 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [experience.id, hotelConfigId, positionInSection, sectionId, totalInSection])
  
  const handleImageError = useCallback(() => {
    if (retryCount < MAX_RETRIES) {
      setRetryCount(c => c + 1)
    } else {
      setImgError(true)
    }
  }, [retryCount])
  const params = new URLSearchParams()
  if (returnUrl) params.set('returnUrl', returnUrl)

  const href = params.toString()
    ? `/${hotelSlug}/${experience.slug}?${params.toString()}`
    : `/${hotelSlug}/${experience.slug}`
  
  // In section mode, open in new tab
  const linkProps = embedMode === 'section' 
    ? { target: '_blank' as const, rel: 'noopener noreferrer' }
    : {}

  const currency = experience.currency ?? 'EUR'
  const priceDisplay = getPriceDisplay({ ...experience, currency })

  if (cardStyle === 'veyond') {
    return (
      <Link
        ref={cardRef}
        href={href}
        {...linkProps}
        className={cn(
          'block rounded-3xl border-0 shadow-md hover:shadow-lg transition-shadow duration-300 ease-out overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2',
          embedMode === 'section' && 'experience-card'
        )}
      >
        <div className="relative aspect-[4/5] md:aspect-[3/4] overflow-hidden bg-muted">
          {experience.coverImage && !imgError ? (
            <Image
              key={retryCount}
              src={experience.coverImage}
              alt={translatedTitle}
              fill
              className="object-cover"
              loading="lazy"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              onError={handleImageError}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-muted">
              <svg className="w-12 h-12 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}
          {/* Badges row - top, frosted glass */}
          <div className="absolute top-4 left-4 right-4 flex items-center gap-2">
            <div className="flex items-center gap-1.5 rounded-lg bg-background/80 backdrop-blur-sm border-0 px-2.5 py-1.5 text-sm font-medium text-foreground">
              <Clock className="w-4 h-4" aria-hidden />
              {formatDuration(experience.duration_minutes)}
            </div>
            {showRequestBadge && (
              <div className="rounded-lg bg-background/80 backdrop-blur-sm border-0 px-2.5 py-1.5 text-xs font-medium text-muted-foreground">
                On Request
              </div>
            )}
          </div>
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
          {/* Text overlay at bottom */}
          <div className="absolute inset-x-0 bottom-0 p-3 sm:p-4 md:p-6 text-white">
            <h3 className={cn("text-sm sm:text-base md:text-2xl font-light mb-1 sm:mb-2 md:mb-3 line-clamp-2", isTranslating && "animate-pulse")}>{translatedTitle}</h3>
            <span className="text-xs sm:text-sm font-medium tabular-nums">
              From {formatPrice(priceDisplay.amount, currency)}
            </span>
          </div>
        </div>
      </Link>
    )
  }
  
  return (
    <Link 
      ref={cardRef}
      href={href}
      {...linkProps}
      className={cn(
        'block rounded-card overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2',
        embedMode === 'section' && 'hover:shadow-card-hover transition-shadow experience-card'
      )}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        {experience.coverImage && !imgError ? (
          <Image
            key={retryCount}
            src={experience.coverImage}
            alt={translatedTitle}
            fill
            className="object-cover"
            loading="lazy"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            onError={handleImageError}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-muted">
            <svg className="w-12 h-12 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
        <h3 className={cn("absolute bottom-3 left-3 right-3 sm:bottom-4 sm:left-4 sm:right-4 font-heading text-xs sm:text-sm md:text-base lg:text-lg text-white line-clamp-2", isTranslating && "animate-pulse")}>
          {translatedTitle}
        </h3>
      </div>
    </Link>
  )
}