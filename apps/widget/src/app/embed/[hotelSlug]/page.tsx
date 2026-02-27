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
          __html: `<veyond-widget hotel="${hotelSlug.replace(/"/g, '&quot;')}"></veyond-widget>`,
        }}
      />
      <Script src="/embed.js" strategy="afterInteractive" />
      <IframeResizer />
    </>
  )
}
