import { getHotelContext } from '@/lib/dashboard/auth'
import { redirect } from 'next/navigation'
import { EmbedCodeBlock } from '@/components/dashboard/EmbedCodeBlock'
import Link from 'next/link'
import { Code, Link2, ChevronRight, Check, ArrowLeft, ExternalLink, Info } from 'lucide-react'

export default async function EmbedPage() {
  const result = await getHotelContext()

  if (!result.success) {
    redirect('/dashboard/login')
  }

  const { hotelConfig } = result.data

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const hotelSlug = hotelConfig.slug

  const embedCode = `<!-- Traverum Experiences Widget -->
<traverum-widget hotel="${hotelSlug}" max="3"></traverum-widget>
<script src="${baseUrl}/embed.js" async></script>`

  const fullPageUrl = `${baseUrl}/${hotelSlug}`

  return (
    <div className="container max-w-6xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-foreground">Embed Widget</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Add experiences to your website or share a direct booking link.
        </p>
      </div>

      {/* How it works */}
      <div className="border border-border rounded-sm p-4 bg-card">
        <div className="flex items-center gap-2 mb-3">
          <Info className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-medium text-foreground">How it works</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { step: '1', title: 'Paste code', desc: 'Add snippet to any page' },
            { step: '2', title: 'Section appears', desc: 'Styled to your brand' },
            { step: '3', title: 'Guests book', desc: 'Cards open booking page' },
          ].map((item) => (
            <div key={item.step} className="flex gap-2">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold">
                {item.step}
              </div>
              <div>
                <p className="text-xs font-medium text-foreground">{item.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Embed Code */}
      <div className="border border-border rounded-sm p-4 bg-card space-y-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-sm bg-primary/10">
            <Code className="h-4 w-4 text-primary" />
          </div>
          <h2 className="text-sm font-medium text-foreground">Embed Code</h2>
        </div>
        <EmbedCodeBlock code={embedCode} label="HTML snippet" />

        <div className="flex flex-wrap gap-2">
          <div className="px-2 py-1 rounded-sm bg-muted/50 border border-border">
            <p className="text-xs text-muted-foreground">
              <span className="font-medium text-foreground">WordPress:</span> Custom HTML block
            </p>
          </div>
          <div className="px-2 py-1 rounded-sm bg-muted/50 border border-border">
            <p className="text-xs text-muted-foreground">
              <span className="font-medium text-foreground">Squarespace/Wix:</span> Code block
            </p>
          </div>
        </div>

        <details className="group">
          <summary className="text-xs font-medium text-primary cursor-pointer hover:text-primary/80 list-none flex items-center gap-1.5">
            <ChevronRight className="w-3.5 h-3.5 transition-transform group-open:rotate-90" />
            Customization
          </summary>
          <div className="mt-3 pl-4 space-y-3 border-l-2 border-border">
            <p className="text-xs text-muted-foreground">
              Change <code className="bg-muted px-1 py-0.5 rounded-sm font-mono">max=&quot;3&quot;</code> to show more experiences. Add <code className="bg-muted px-1 py-0.5 rounded-sm font-mono">hide-title</code> or <code className="bg-muted px-1 py-0.5 rounded-sm font-mono">button-label=&quot;View all&quot;</code>.
            </p>
          </div>
        </details>
      </div>

      {/* Direct Link */}
      <div className="border border-border rounded-sm p-4 bg-card space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-sm bg-primary/10">
              <Link2 className="h-4 w-4 text-primary" />
            </div>
            <h2 className="text-sm font-medium text-foreground">Direct Booking Link</h2>
          </div>
          <Link
            href={fullPageUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
          >
            Open
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
        <EmbedCodeBlock code={fullPageUrl} label="Full page URL" />
      </div>

      {/* Technical details */}
      <div className="border border-border rounded-sm p-4 bg-muted/30">
        <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-2">
          Technical Details
        </h3>
        <ul className="space-y-2">
          {[
            'Shadow DOM isolation — styles never conflict',
            'Lightweight — ~15 KB gzipped, no framework',
            'Native section — real HTML, no iframe',
            'Auto-themed — matches your brand settings',
            'Works everywhere — WordPress, Squarespace, Wix, Shopify',
          ].map((text, i) => (
            <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
              <Check className="w-3.5 h-3.5 text-[#6B8E6B] mt-0.5 flex-shrink-0" />
              <span>{text}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Back */}
      <div className="pt-2">
        <Link
          href="/dashboard/experiences"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Experiences
        </Link>
      </div>
    </div>
  )
}
