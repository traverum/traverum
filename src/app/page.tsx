import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center max-w-md px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Traverum Widget
        </h1>
        <p className="text-gray-600 mb-8">
          White-label booking widget for hotels to sell local experiences.
        </p>
        <p className="text-sm text-gray-500">
          Access the widget via <code className="bg-gray-100 px-2 py-1 rounded">/[hotel-slug]</code>
        </p>
      </div>
    </div>
  )
}
