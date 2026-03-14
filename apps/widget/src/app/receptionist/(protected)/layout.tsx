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
      <div className="veyond-theme receptionist-ui min-h-screen bg-background font-sans">
        <header className="bg-background">
          <div className="mx-auto max-w-6xl px-5 sm:px-8">
            <div className="flex h-16 items-center">
              <span className="text-lg font-light text-foreground tracking-wide">Veyond</span>
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-5 py-20 sm:px-8">
          <div className="text-center p-8">
            <h1 className="text-2xl font-light text-foreground mb-3">
              Access Not Available
            </h1>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
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
    <div className="veyond-theme receptionist-ui min-h-screen bg-background font-sans">
      <ReceptionistNav hotelName={hotelConfig.display_name} userName={user.email} />
      <main className="mx-auto max-w-6xl px-5 py-6 sm:px-8">
        {children}
      </main>
    </div>
  )
}
