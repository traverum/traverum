import type { Metadata } from 'next'

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
    <div className="veyond-theme font-sans min-h-screen">
      {children}
    </div>
  )
}
