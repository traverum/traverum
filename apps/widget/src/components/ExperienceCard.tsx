'use client'

import { useState, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import type { ExperienceWithMedia } from '@/lib/hotels'

interface ExperienceCardProps {
  experience: ExperienceWithMedia
  hotelSlug: string
  embedMode?: 'full' | 'section'
  returnUrl?: string | null
}

const MAX_RETRIES = 2

export function ExperienceCard({ experience, hotelSlug, embedMode = 'full', returnUrl }: ExperienceCardProps) {
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