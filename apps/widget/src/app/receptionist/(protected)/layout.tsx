import { redirect } from 'next/navigation'
import { getReceptionistContext } from '@/lib/receptionist/auth'
import { ReceptionistNav } from '@/components/receptionist/ReceptionistNav'

export default async function ReceptionistProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const result = await getReceptionistContext()

  if (!result.success) {
    if (result.error === 'not_authenticated') {
      redirect('/receptionist/login')
    }

    return (
      <div className="min-h-screen bg-gray-50">
        <header className="border-b border-gray-200 bg-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex h-14 items-center">
              <span className="text-lg font-bold text-gray-900">Veyond</span>
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Access Not Available
            </h1>
            <p className="text-gray-600 max-w-md mx-auto">
              {result.error === 'not_receptionist'
                ? 'Your account does not have receptionist access. Please contact your hotel manager.'
                : result.error === 'no_hotel_config'
                  ? 'No hotel property is configured for your account. Please contact Veyond support.'
                  : 'Your user account is not properly set up. Please contact Veyond support.'}
            </p>
          </div>
        </main>
      </div>
    )
  }

  const { hotelConfig, user } = result.data

  return (
    <div className="min-h-screen bg-gray-50">
      <ReceptionistNav hotelName={hotelConfig.display_name} userName={user.email} />
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  )
}
