import type { Metadata } from 'next'
import { Poppins, Fraunces } from 'next/font/google'
import './globals.css'

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

export const metadata: Metadata = {
  title: 'Traverum - Book Local Experiences',
  description: 'Discover and book amazing local experiences through your hotel',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${poppins.variable} ${fraunces.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  )
}
