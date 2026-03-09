'use client'

import { useState, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Clock, MapPin } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDuration, formatPrice } from '@/lib/utils'
import type { ExperienceWithMedia } from '@/lib/hotels'

interface ExperienceCardProps {
  experience: ExperienceWithMedia
  hotelSlug: string
  embedMode?: 'full' | 'section'
  returnUrl?: string | null
  /** When 'veyond', uses large portrait card with duration badge, location, and "From X" price (for /experiences) */
  cardStyle?: 'default' | 'veyond'
}

const MAX_RETRIES = 2

export function ExperienceCard({ experience, hotelSlug, embedMode = 'full', returnUrl, cardStyle = 'default' }: ExperienceCardProps) {
  const [imgError, setImgError] = useState(false)
  const [retryCount, setRetryCount] = useState(0)
  
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

  const fromPriceCents = experience.base_price_cents ?? experience.price_cents ?? 0
  const currency = experience.currency ?? 'EUR'

  if (cardStyle === 'veyond') {
    return (
      <Link
        href={href}
        {...linkProps}
        className={cn(
          'block rounded-3xl border-0 shadow-lg hover:shadow-xl overflow-hidden transition-shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2',
          embedMode === 'section' && 'experience-card'
        )}
      >
        <div className="relative aspect-[4/5] md:aspect-[3/4] overflow-hidden bg-muted">
          {experience.coverImage && !imgError ? (
            <Image
              key={retryCount}
              src={experience.coverImage}
              alt={experience.title}
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
          {/* Duration badge - top left, frosted glass */}
          <div className="absolute top-4 left-4 flex items-center gap-1.5 rounded-lg bg-background/80 backdrop-blur-sm border-0 px-2.5 py-1.5 text-sm font-medium text-foreground">
            <Clock className="w-4 h-4" aria-hidden />
            {formatDuration(experience.duration_minutes)}
          </div>
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
          {/* Text overlay at bottom */}
          <div className="absolute inset-x-0 bottom-0 p-6 text-white">
            <h3 className="text-2xl font-light mb-4">{experience.title}</h3>
            <div className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-1.5 text-white/90 text-sm min-w-0">
                <MapPin className="w-4 h-4 flex-shrink-0" aria-hidden />
                <span className="truncate">{experience.location_address ?? '—'}</span>
              </span>
              <span className="flex-shrink-0 text-sm font-medium tabular-nums">
                From {formatPrice(fromPriceCents, currency)}
              </span>
            </div>
          </div>
        </div>
      </Link>
    )
  }
  
  return (
    <Link 
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
            alt={experience.title}
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
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <h3 className="absolute bottom-4 left-4 right-4 font-heading text-lg text-white">
          {experience.title}
        </h3>
      </div>
    </Link>
  )
}