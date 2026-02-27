import Link from 'next/link'
import { CancelConfirmButtons } from './CancelConfirmButtons'

export const dynamic = 'force-dynamic'

interface PageProps {
  searchParams: Promise<{ id?: string; token?: string }>
}

export default async function BookingCancelConfirmPage({ searchParams }: PageProps) {
  const params = await searchParams
  const id = params?.id ?? ''
  const token = params?.token ?? ''
  const hasValidParams = id && token
  const confirmUrl = hasValidParams ? `/api/bookings/${id}/cancel?token=${encodeURIComponent(token)}` : '#'

  return (
    <div className="min-h-screen bg-[#F4EFE6] flex items-center justify-center p-4">
      <div className="max-w-[400px] w-full bg-[#FEFCF9] rounded border border-[rgba(55,53,47,0.09)] p-8 text-center">
        {hasValidParams ? (
          <>
            <h1 className="text-[22px] font-light text-[#5D4631] tracking-[-0.01em] mb-2">
              Cancel your booking?
            </h1>
            <p className="text-[15px] font-light text-[rgb(55,53,47)]/80 leading-relaxed mb-6">
              This will release your spot and process a full refund. This cannot be undone.
            </p>
            <CancelConfirmButtons confirmUrl={confirmUrl} />
          </>
        ) : (
          <p className="text-[15px] font-light text-[rgb(55,53,47)]/80">
            Invalid or missing link. Please use the link from your booking email.
          </p>
        )}
        <p className="text-xs text-[rgba(55,53,47,0.3)] mt-6 tracking-[0.02em]">Powered by Veyond</p>
      </div>
    </div>
  )
}
