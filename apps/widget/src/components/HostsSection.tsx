import { getVisibleHosts } from '@/lib/hotels'
import { HostsSectionClient } from './HostsSectionClient'

interface HostsSectionProps {
  hotelConfigId: string | null
  channelSlug: string
}

export async function HostsSection({ hotelConfigId, channelSlug }: HostsSectionProps) {
  const hosts = await getVisibleHosts(hotelConfigId)

  if (hosts.length === 0) return null

  return <HostsSectionClient hosts={hosts} channelSlug={channelSlug} />
}
