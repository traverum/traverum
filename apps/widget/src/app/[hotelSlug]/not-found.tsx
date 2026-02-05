import Link from 'next/link'

export default function HotelNotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center max-w-md px-4">
        <h1 className="text-6xl font-bold text-gray-300 mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">
          Hotel Not Found
        </h2>
        <p className="text-gray-600 mb-8">
          The hotel you're looking for doesn't exist or is not available.
        </p>
        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-gray-800"
        >
          Go Back Home
        </Link>
      </div>
    </div>
  )
}
