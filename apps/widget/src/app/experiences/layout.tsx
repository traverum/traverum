import type { Metadata } from 'next'
import { ExperiencesLayoutHeader } from '@/components/ExperiencesLayoutHeader'
import { PostHogHotelContext } from '@/components/PostHogHotelContext'

export const metadata: Metadata = {
  title: {
    template: '%s - Veyond',
    default: 'Experiences - Veyond',
  },
  description: 'Discover and book amazing local experiences through Veyond.',
}

export default function ExperiencesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="veyond-theme receptionist-ui min-h-screen bg-background font-sans">
      <ExperiencesLayoutHeader />
      <main className="mx-auto max-w-6xl px-5 py-6 sm:px-8">
        {children}
      </main>
      <PostHogHotelContext
        hotelConfigId=""
        hotelSlug="experiences"
        hotelName="Veyond Direct"
        channel="direct"
      />
    </div>
  )
}
