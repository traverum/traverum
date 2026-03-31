'use client'

import Image from 'next/image'
import { cn } from '@/lib/utils'

interface CategoryAnchorCardProps {
  label: string
  /** Global category art from `public/category-anchors/` */
  imageSrc: string
  experienceCount: number
  cardStyle?: 'veyond' | 'hotel'
  onClick: () => void
}

export function CategoryAnchorCard({
  label,
  imageSrc,
  experienceCount,
  cardStyle = 'veyond',
  onClick,
}: CategoryAnchorCardProps) {
  const isSvg = imageSrc.endsWith('.svg')

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`${label}: jump to this section`}
      className={cn(
        'group relative block w-full rounded-2xl overflow-hidden text-left',
        'shadow-sm hover:shadow-md transition-all duration-300 ease-out',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2',
        'hover:scale-[1.015] active:scale-[0.99]',
      )}
    >
      <div className="relative aspect-[2/1] overflow-hidden bg-muted">
        <Image
          src={imageSrc}
          alt=""
          fill
          className={cn(
            'object-cover transition-transform duration-500 ease-out group-hover:scale-[1.02]',
            !isSvg && 'sepia-[.2] saturate-[.4] contrast-[.9]',
          )}
          loading="eager"
          sizes="(max-width: 640px) 65vw, (max-width: 1024px) 35vw, 300px"
          unoptimized={isSvg}
        />

        <div
          className="absolute inset-0 mix-blend-soft-light pointer-events-none"
          style={{ backgroundColor: 'hsl(var(--accent) / 0.22)' }}
        />

        <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
          <h3
            className={cn(
              'text-white leading-tight mb-0.5 line-clamp-2',
              'text-xl sm:text-2xl',
              cardStyle === 'veyond'
                ? 'font-newyork italic font-light'
                : 'font-heading',
            )}
            style={cardStyle === 'hotel' ? { fontWeight: 'var(--font-weight-heading)' } : undefined}
          >
            {label}
          </h3>
          <p className="text-xs font-light text-white/65 tracking-wide">
            {experienceCount} {experienceCount === 1 ? 'experience' : 'experiences'}
          </p>
        </div>
      </div>
    </button>
  )
}
