import Script from 'next/script'
import { IframeResizer } from './IframeResizer'

export const dynamic = 'force-dynamic'

interface EmbedPageProps {
  params: Promise<{ hotelSlug: string }>
}

export default async function EmbedPage({ params }: EmbedPageProps) {
  const { hotelSlug } = await params

  return (
    <>
      <div
        dangerouslySetInnerHTML={{
          __html: `<traverum-widget hotel="${hotelSlug.replace(/"/g, '&quot;')}"></traverum-widget>`,
        }}
      />
      <Script src="/embed.js" strategy="afterInteractive" />
      <IframeResizer />
    </>
  )
}
