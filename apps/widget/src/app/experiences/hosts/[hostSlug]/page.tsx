import { notFound } from 'next/navigation'
import Image from 'next/image'
import { getHostBySlug } from '@/lib/hotels'
import { ExperienceCard } from '@/components/ExperienceCard'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

interface HostPageProps {
  params: Promise<{ hostSlug: string }>
}

export async function generateMetadata({ params }: HostPageProps): Promise<Metadata> {
  const { hostSlug } = await params
  const host = await getHostBySlug(hostSlug, null)

  if (!host) {
    return { title: 'Host Not Found' }
  }

  return {
    title: `${host.display_name} - Veyond`,
    description: host.bio?.slice(0, 160) || `Discover experiences by ${host.display_name}`,
  }
}

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .map(w => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export default async function HostDirectPage({ params }: HostPageProps) {
  const { hostSlug } = await params
  const host = await getHostBySlug(hostSlug, null)

  if (!host) {
    notFound()
  }

  const subtitle = [host.city, host.country].filter(Boolean).join(', ')

  return (
    <div className="space-y-10">
      {/* Host profile header */}
      <div className="flex flex-col items-center text-center">
        <div className="relative w-32 h-32 sm:w-40 sm:h-40 rounded-full overflow-hidden bg-muted mb-5 ring-2 ring-border/50">
          {host.avatar_url ? (
            <Image
              src={host.avatar_url}
              alt={host.display_name}
              fill
              className="object-cover"
              sizes="160px"
              priority
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-muted text-muted-foreground text-3xl font-medium">
              {getInitials(host.display_name)}
            </div>
          )}
        </div>

        <h1 className="text-3xl sm:text-4xl font-newyork italic font-light text-heading-foreground">
          {host.display_name}
        </h1>

        {subtitle && (
          <p className="text-sm text-muted-foreground mt-2 tracking-wide">
            {subtitle}
          </p>
        )}

        {host.bio && (
          <p className="mt-4 max-w-xl text-base text-foreground/80 leading-relaxed">
            {host.bio}
          </p>
        )}
      </div>

      {/* Host's experiences */}
      {host.experiences.length > 0 && (
        <div>
          <h2 className="text-xl md:text-2xl font-heading text-heading-foreground mb-6">
            Experiences by {host.display_name}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {host.experiences.map((experience) => (
              <ExperienceCard
                key={experience.id}
                experience={experience}
                hotelSlug="experiences"
                embedMode="full"
                cardStyle="veyond"
                hotelConfigId={null}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
