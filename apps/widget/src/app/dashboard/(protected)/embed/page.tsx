import { getHotelContext } from '@/lib/dashboard/auth'
import { redirect } from 'next/navigation'
import { EmbedCodeBlock } from '@/components/dashboard/EmbedCodeBlock'
import Link from 'next/link'

export default async function EmbedPage() {
  const result = await getHotelContext()

  if (!result.success) {
    redirect('/dashboard/login')
  }

  const { hotelConfig } = result.data

  // Use environment variable or fallback to localhost for development
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const hotelSlug = hotelConfig.slug

  // ── New Shadow DOM embed snippet ──
  const embedCode = `<!-- Traverum Experiences Widget -->
<traverum-widget hotel="${hotelSlug}" max="3"></traverum-widget>
<script src="${baseUrl}/embed.js" async></script>`

  // WordPress shortcode-style snippet
  const wpCode = `<!-- Paste this into a Custom HTML block in WordPress -->
<traverum-widget hotel="${hotelSlug}" max="3"></traverum-widget>
<script src="${baseUrl}/embed.js" async></script>`

  // Full-page URL (for linking, QR codes, emails)
  const fullPageUrl = `${baseUrl}/${hotelSlug}`

  // API preview URL
  const apiUrl = `${baseUrl}/api/embed/${hotelSlug}?max=3`

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Add to Your Website</h1>
        <p className="mt-1 text-gray-600">
          Get your embed code to add experiences to your hotel website, or share a direct booking link.
        </p>
      </div>

      {/* How it works */}
      <div className="bg-gradient-to-r from-teal-50 to-blue-50 rounded-lg border border-teal-100 p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-3">How it works</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-7 h-7 bg-teal-100 text-teal-700 rounded-full flex items-center justify-center font-bold text-xs">
              1
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Paste the code</p>
              <p className="text-xs text-gray-600 mt-0.5">Add the snippet to any page on your website</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-7 h-7 bg-teal-100 text-teal-700 rounded-full flex items-center justify-center font-bold text-xs">
              2
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">It appears as a native section</p>
              <p className="text-xs text-gray-600 mt-0.5">Styled to match your brand — no iframe, no scrollbars</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-7 h-7 bg-teal-100 text-teal-700 rounded-full flex items-center justify-center font-bold text-xs">
              3
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Guests book with one click</p>
              <p className="text-xs text-gray-600 mt-0.5">Clicking a card opens the full booking page</p>
            </div>
          </div>
        </div>
      </div>

      {/* Option 1: Embed Widget */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-start gap-3 mb-4">
          <div className="flex-shrink-0 w-8 h-8 bg-teal-100 text-teal-700 rounded-full flex items-center justify-center font-bold text-sm">
            1
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Embed Widget</h2>
            <p className="text-sm text-gray-600 mt-1">
              Add this code to any page on your website. The widget will appear as a native section with your experiences.
            </p>
          </div>
        </div>

        <EmbedCodeBlock code={embedCode} label="Embed code" />

        <div className="mt-4 space-y-3">
          <div className="p-3 bg-gray-50 rounded-md">
            <p className="text-sm text-gray-600">
              <strong>WordPress:</strong> Use a &quot;Custom HTML&quot; block and paste the code above.
            </p>
          </div>
          <div className="p-3 bg-gray-50 rounded-md">
            <p className="text-sm text-gray-600">
              <strong>Squarespace / Wix:</strong> Use a &quot;Code&quot; or &quot;Embed HTML&quot; block.
            </p>
          </div>
        </div>

        {/* Customization tips */}
        <details className="mt-4 group">
          <summary className="text-sm font-medium text-teal-700 cursor-pointer hover:text-teal-800 list-none flex items-center gap-1">
            <svg className="w-4 h-4 transition-transform group-open:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            Customization options
          </summary>
          <div className="mt-3 pl-5 space-y-3 text-sm text-gray-600">
            <div>
              <p className="font-medium text-gray-800">Show more or fewer experiences</p>
              <p>Change <code className="bg-gray-100 px-1 py-0.5 rounded text-xs">max=&quot;3&quot;</code> to any number.</p>
            </div>
            <div>
              <p className="font-medium text-gray-800">Hide the title</p>
              <p>Add <code className="bg-gray-100 px-1 py-0.5 rounded text-xs">hide-title</code> to the tag.</p>
            </div>
            <div>
              <p className="font-medium text-gray-800">Custom button text</p>
              <p>Add <code className="bg-gray-100 px-1 py-0.5 rounded text-xs">button-label=&quot;View all&quot;</code> to change the CTA.</p>
            </div>
            <div>
              <p className="font-medium text-gray-800">Override theme colors from CSS</p>
              <EmbedCodeBlock
                code={`traverum-widget {\n  --trv-accent: #8B4513;\n  --trv-font-heading: 'Playfair Display', serif;\n}`}
                label="CSS override example"
              />
            </div>
          </div>
        </details>
      </div>

      {/* Option 2: Full Page Link */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-start gap-3 mb-4">
          <div className="flex-shrink-0 w-8 h-8 bg-teal-100 text-teal-700 rounded-full flex items-center justify-center font-bold text-sm">
            2
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Direct Booking Link</h2>
            <p className="text-sm text-gray-600 mt-1">
              Share this link in emails, QR codes, or navigation menus to send guests directly to your booking page.
            </p>
          </div>
        </div>

        <EmbedCodeBlock code={fullPageUrl} label="Full booking page URL" />
      </div>

      {/* Preview Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Live Preview</h2>
          <div className="flex items-center gap-3">
            <Link
              href={apiUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600"
            >
              API
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </Link>
            <Link
              href={fullPageUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-teal-600 hover:underline"
            >
              Open full page
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </Link>
          </div>
        </div>

        <div className="border border-gray-200 rounded-lg overflow-hidden bg-white p-6">
          <WidgetPreview baseUrl={baseUrl} hotelSlug={hotelSlug} />
        </div>

        <p className="mt-3 text-sm text-gray-500 text-center">
          This is how your widget will appear when embedded on your website.
        </p>
      </div>

      {/* Technical details */}
      <div className="bg-gray-50 rounded-lg border border-gray-200 p-5">
        <h3 className="text-sm font-semibold text-gray-800 mb-2">Technical Details</h3>
        <ul className="text-xs text-gray-600 space-y-1.5">
          <li className="flex items-start gap-2">
            <svg className="w-3.5 h-3.5 text-green-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            <span><strong>Shadow DOM isolation</strong> — Widget styles never affect your website, and your styles never break the widget.</span>
          </li>
          <li className="flex items-start gap-2">
            <svg className="w-3.5 h-3.5 text-green-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            <span><strong>Lightweight</strong> — No framework loaded. The embed script is ~15 KB (gzipped).</span>
          </li>
          <li className="flex items-start gap-2">
            <svg className="w-3.5 h-3.5 text-green-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            <span><strong>Native section</strong> — Renders as real HTML in the page flow. No iframe, no scrollbar, no height hacks.</span>
          </li>
          <li className="flex items-start gap-2">
            <svg className="w-3.5 h-3.5 text-green-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            <span><strong>Auto-themed</strong> — Colors, fonts, and radius are loaded from your Traverum dashboard settings.</span>
          </li>
          <li className="flex items-start gap-2">
            <svg className="w-3.5 h-3.5 text-green-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            <span><strong>Works everywhere</strong> — WordPress, Squarespace, Wix, Shopify, custom sites — any platform that supports HTML.</span>
          </li>
        </ul>
      </div>

      {/* Back to experiences */}
      <div className="flex justify-start">
        <Link
          href="/dashboard/experiences"
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Experiences
        </Link>
      </div>
    </div>
  )
}

/* ── Live widget preview using the actual embed script ── */
function WidgetPreview({ baseUrl, hotelSlug }: { baseUrl: string; hotelSlug: string }) {
  const previewHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body { margin: 0; padding: 0; font-family: system-ui, sans-serif; background: transparent; }
  </style>
</head>
<body>
  <traverum-widget hotel="${hotelSlug}" max="3"></traverum-widget>
  <script src="${baseUrl}/embed.js"></script>
  <script>
    // Auto-resize iframe to content height
    function sendHeight() {
      var h = document.documentElement.scrollHeight;
      window.parent.postMessage({ type: 'traverum-preview-resize', height: h }, '*');
    }
    new MutationObserver(sendHeight).observe(document.body, { childList: true, subtree: true });
    window.addEventListener('load', sendHeight);
    setTimeout(sendHeight, 1000);
    setTimeout(sendHeight, 3000);
  </script>
</body>
</html>`.trim()

  const srcDoc = previewHtml

  return (
    <>
      <iframe
        srcDoc={srcDoc}
        title="Widget Preview"
        className="w-full border-0 transition-all duration-300"
        style={{ minHeight: '400px' }}
        loading="lazy"
        id="widget-preview-frame"
      />
      <script
        dangerouslySetInnerHTML={{
          __html: `
            window.addEventListener('message', function(e) {
              if (e.data && e.data.type === 'traverum-preview-resize' && typeof e.data.height === 'number') {
                var frame = document.getElementById('widget-preview-frame');
                if (frame) frame.style.height = Math.max(300, e.data.height + 20) + 'px';
              }
            });
          `,
        }}
      />
    </>
  )
}
