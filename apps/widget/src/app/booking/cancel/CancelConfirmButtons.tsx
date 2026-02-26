'use client'

import Link from 'next/link'

export function CancelConfirmButtons({ confirmUrl }: { confirmUrl: string }) {
  return (
    <div className="flex flex-col sm:flex-row gap-3 justify-center">
      <button
        type="button"
        onClick={() => window.history.back()}
        className="inline-flex items-center justify-center px-6 py-3 rounded-sm bg-[#5A6B4E] text-white text-sm font-medium transition-colors hover:opacity-90"
      >
        No, keep my booking
      </button>
      <Link
        href={confirmUrl}
        className="inline-flex items-center justify-center px-6 py-3 rounded-sm bg-[#B8866B] text-white text-sm font-medium transition-colors hover:opacity-90"
      >
        Yes, cancel my booking
      </Link>
    </div>
  )
}
