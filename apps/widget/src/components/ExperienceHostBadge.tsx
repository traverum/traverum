import Image from 'next/image'
import Link from 'next/link'

interface ExperienceHostBadgeProps {
  hostSlug: string
  hostsBaseUrl: string
  displayName: string
  avatarUrl: string | null
  bio?: string | null
  city?: string | null
  country?: string | null
}

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .map(w => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export function ExperienceHostBadge({
  hostSlug,
  hostsBaseUrl,
  displayName,
  avatarUrl,
  bio,
  city,
  country,
}: ExperienceHostBadgeProps) {
  const location = [city, country].filter(Boolean).join(', ')
  const subtitle = bio?.trim() || location || 'Local host'

  return (
    <Link
      href={`${hostsBaseUrl}/${hostSlug}`}
      className="mt-5 flex items-center gap-3 p-3 rounded-card bg-background-alt hover:bg-muted/40 transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
    >
      <div className="relative w-12 h-12 rounded-full overflow-hidden bg-muted ring-1 ring-border/50 flex-shrink-0">
        {avatarUrl ? (
          <Image
            src={avatarUrl}
            alt={displayName}
            fill
            className="object-cover"
            sizes="48px"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-muted text-muted-foreground text-sm font-medium">
            {getInitials(displayName)}
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
          Hosted by
        </p>
        <p className="text-sm font-medium text-foreground truncate">
          {displayName}
        </p>
        <p className="text-xs text-muted-foreground line-clamp-1">
          {subtitle}
        </p>
      </div>
      <svg className="w-4 h-4 text-muted-foreground flex-shrink-0" aria-hidden="true" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="m9 5 7 7-7 7" />
      </svg>
    </Link>
  )
}
