import { redirect } from 'next/navigation'
import { getReceptionistContext } from '@/lib/receptionist/auth'
import { getSelectedExperiences, getNearbyExperiences } from '@/lib/receptionist/experiences'
import { BookClient } from './BookClient'

export default async function ReceptionistBookPage() {
  const result = await getReceptionistContext()

  if (!result.success) {
    redirect('/receptionist/login')
  }

  const { hotelConfig, partner, userId } = result.data

  const [selected, nearby] = await Promise.all([
    getSelectedExperiences(hotelConfig.id),
    getNearbyExperiences(hotelConfig),
  ])

  // Merge: nearby list excludes already-selected experience IDs
  const selectedIds = new Set(selected.map(e => e.id))
  const nearbyFiltered = nearby.filter(e => !selectedIds.has(e.id))

  return (
    <BookClient
      selected={selected}
      nearby={nearbyFiltered}
      hotelSlug={hotelConfig.slug}
      hotelName={hotelConfig.display_name}
      userId={userId}
    />
  )
}
