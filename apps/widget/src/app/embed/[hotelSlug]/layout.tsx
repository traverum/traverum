import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Traverum Widget',
  robots: 'noindex, nofollow',
}

export default function EmbedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
            body {
              margin: 0 !important;
              padding: 0 !important;
              background: transparent !important;
              overflow-x: hidden;
            }
          `,
        }}
      />
      {children}
    </>
  )
}
