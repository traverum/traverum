import { DM_Sans } from 'next/font/google'

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['300', '500'],
  display: 'swap',
})

export default function RespondLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className={`${dmSans.className} min-h-screen antialiased`} style={{ backgroundColor: '#F4EFE6' }}>
      {children}
    </div>
  )
}
