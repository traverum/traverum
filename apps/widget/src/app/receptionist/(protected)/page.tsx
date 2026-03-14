import { redirect } from 'next/navigation'
import { getReceptionistContext } from '@/lib/receptionist/auth'
import { getSelectedExperiences, getNearbyExperiences, getNextSessions } from '@/lib/receptionist/experiences'
import { BookClient } from './BookClient'

export default async function ReceptionistBookPage() {
  const result = await getReceptionistContext()

  if (!result.success) {
    redirect('/receptionist/login')
  }

  const { hotelConfig, partner, userId } = result.data

  const [selected, nearby] = await Promise.all([
    getSelectedExperiences(hotelConfig.id, partner.id),
    getNearbyExperiences(hotelConfig),
  ])

  const selectedIds = new Set(selected.map(e => e.id))
  const nearbyFiltered = nearby.filter(e => !selectedIds.has(e.id))

  const allIds = [...selected.map(e => e.id), ...nearbyFiltered.map(e => e.id)]
  const sessionsMap = await getNextSessions(allIds)

  const withSessions = (list: typeof selected) =>
    list.map(exp => ({
      ...exp,
      nextSession: sessionsMap.get(exp.id) ?? null,
    }))

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://book.veyond.eu'

  return (
    <BookClient
      selected={withSessions(selected)}
      nearby={withSessions(nearbyFiltered)}
      hotelSlug={hotelConfig.slug}
      hotelName={hotelConfig.display_name}
      userId={userId}
      appUrl={appUrl}
    />
  )
}
