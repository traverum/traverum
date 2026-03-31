'use client'

import { HostCard } from './HostCard'
import type { HostProfile } from '@/lib/hotels'

interface HostsSectionClientProps {
  hosts: HostProfile[]
  channelSlug: string
}

export function HostsSectionClient({ hosts, channelSlug }: HostsSectionClientProps) {
  return (
    <section className="animate-[fadeInUp_0.4s_ease-out_both] mt-8 md:mt-12">
      <h2 className="text-xl md:text-2xl font-heading text-heading-foreground mb-4">
        Your hosts
      </h2>

      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 sm:gap-4 md:gap-6">
        {hosts.map((host) => (
          <HostCard key={host.id} host={host} channelSlug={channelSlug} />
        ))}
      </div>
    </section>
  )
}
