'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { cn } from '@/lib/utils'
import type { ExperienceWithMedia } from '@/lib/hotels'

interface ExperienceCardProps {
  experience: ExperienceWithMedia
  hotelSlug: string
  embedMode?: 'full' | 'section'
}

export function ExperienceCard({ experience, hotelSlug, embedMode = 'full' }: ExperienceCardProps) {
  const searchParams = useSearchParams()
  const returnUrl = searchParams.get('returnUrl')

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
        embedMode === 'section' && 'hover:shadow-card-hover transition-shadow'
      )}
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        {experience.coverImage ? (
          <Image
            src={experience.coverImage}
            alt={experience.title}
            fill
            className="object-cover"
            loading="lazy"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
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