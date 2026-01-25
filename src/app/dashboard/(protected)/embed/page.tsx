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

  const embedCode = `<!-- Traverum Experiences Widget -->
<div id="traverum-widget"></div>
<script 
  src="${baseUrl}/embed.js" 
  data-hotel="${hotelSlug}"
  data-mode="section">
</script>`

  const fullPageUrl = `${baseUrl}/${hotelSlug}`
  const previewUrl = `${baseUrl}/${hotelSlug}?embed=section`

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Add to Your Website</h1>
        <p className="mt-1 text-gray-600">
          Get your embed code or direct link to share with guests
        </p>
      </div>

      {/* Option 1: Embed Widget */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-start gap-3 mb-4">
          <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-sm">
            1
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Embed Widget</h2>
            <p className="text-sm text-gray-600 mt-1">
              Add this code to any page on your website
            </p>
          </div>
        </div>

        <EmbedCodeBlock code={embedCode} label="HTML embed code" />

        <div className="mt-4 p-3 bg-gray-50 rounded-md">
          <p className="text-sm text-gray-600">
            <strong>For WordPress:</strong> Use a &quot;Custom HTML&quot; block and paste the code above.
          </p>
        </div>
      </div>

      {/* Option 2: Full Page Link */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-start gap-3 mb-4">
          <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-sm">
            2
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Link to Full Page</h2>
            <p className="text-sm text-gray-600 mt-1">
              Direct your guests to your booking page
            </p>
          </div>
        </div>

        <EmbedCodeBlock code={fullPageUrl} label="Full page URL" />

        <div className="mt-4 p-3 bg-gray-50 rounded-md">
          <p className="text-sm text-gray-600">
            Use this in emails, QR codes, or navigation menus
          </p>
        </div>
      </div>

      {/* Preview Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Preview</h2>
          <Link
            href={fullPageUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline"
          >
            Open in new tab
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </Link>
        </div>

        <div className="border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
          <iframe
            src={previewUrl}
            title="Widget Preview"
            className="w-full h-[600px] border-0"
            loading="lazy"
          />
        </div>

        <p className="mt-3 text-sm text-gray-500 text-center">
          This is how your widget will appear when embedded on your website
        </p>
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
