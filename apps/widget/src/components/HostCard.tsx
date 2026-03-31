'use client'

import Image from 'next/image'
import Link from 'next/link'
import type { HostProfile } from '@/lib/hotels'

interface HostCardProps {
  host: HostProfile
  channelSlug: string
}

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .map(w => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

function getFirstName(name: string): string {
  return name.split(/\s+/)[0]
}

export function HostCard({ host, channelSlug }: HostCardProps) {
  const href = `/${channelSlug}/hosts/${host.partner_slug}`

  return (
    <Link
      href={href}
      className="flex flex-col items-center text-center group focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 rounded-2xl p-3 sm:p-4 transition-all"
    >
      <div className="relative w-28 h-28 sm:w-32 sm:h-32 md:w-36 md:h-36 rounded-full overflow-hidden bg-muted mb-3 ring-2 ring-border/40 group-hover:ring-accent/40 group-hover:scale-105 transition-all duration-300">
        {host.avatar_url ? (
          <Image
            src={host.avatar_url}
            alt={host.display_name}
            fill
            className="object-cover"
            sizes="(min-width: 768px) 144px, (min-width: 640px) 128px, 112px"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-muted text-muted-foreground text-lg sm:text-xl font-medium">
            {getInitials(host.display_name)}
          </div>
        )}
      </div>

      <h3 className="font-newyork italic text-base sm:text-lg font-light text-heading-foreground leading-tight">
        {getFirstName(host.display_name)}
      </h3>
    </Link>
  )
}
