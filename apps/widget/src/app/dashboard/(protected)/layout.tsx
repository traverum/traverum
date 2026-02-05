import { redirect } from 'next/navigation'
import { getHotelContext } from '@/lib/dashboard/auth'
import { DashboardNav } from '@/components/dashboard/DashboardNav'

export default async function ProtectedDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const result = await getHotelContext()

  // If not authenticated, redirect to login
  if (!result.success) {
    if (result.error === 'not_authenticated') {
      redirect('/dashboard/login')
    }

    // User authenticated but no proper setup
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="border-b border-gray-200 bg-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 items-center">
              <span className="text-xl font-bold text-gray-900">Traverum</span>
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Account Not Configured
            </h1>
            <p className="text-gray-600 max-w-md mx-auto">
              {result.error === 'no_user_record'
                ? 'Your user account is not linked to a hotel. Please contact Traverum support to complete your setup.'
                : 'Your hotel configuration is not complete. Please contact Traverum support to finish setting up your account.'}
            </p>
          </div>
        </main>
      </div>
    )
  }

  const { hotelConfig } = result.data

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardNav hotelName={hotelConfig.display_name} />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  )
}
