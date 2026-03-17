import type { Metadata } from 'next'
import { Poppins, Fraunces, DM_Sans } from 'next/font/google'
import localFont from 'next/font/local'
import { TranslationProvider } from '@/components/TranslationProvider'
import './globals.css'

const newYork = localFont({
  src: '../../../../newyork/NewYork PERSONAL USE.otf',
  variable: '--font-newyork',
  display: 'swap',
})

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sans',
})

const fraunces = Fraunces({
  subsets: ['latin'],
  weight: ['100', '200', '300', '400', '500', '600', '700', '800'],
  variable: '--font-fraunces',
  display: 'swap',
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-dm-sans',
})

export const metadata: Metadata = {
  title: 'Veyond',
  description: 'Discover and book amazing local experiences through your hotel',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${poppins.variable} ${fraunces.variable} ${dmSans.variable} ${newYork.variable} font-sans antialiased`} suppressHydrationWarning>
        <TranslationProvider>
          {children}
        </TranslationProvider>
      </body>
    </html>
  )
}
