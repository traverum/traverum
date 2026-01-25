'use client'

import { motion } from 'framer-motion'
import { useSearchParams } from 'next/navigation'
import { formatPrice, formatDate, formatTime } from '@/lib/utils'

interface DemoSuccessOverlayProps {
  experienceTitle: string
  date: string
  time: string
  participants: number
  totalCents: number
  currency: string
  guestName: string
  hotelSlug: string
  onClose: () => void
}

export function DemoSuccessOverlay({
  experienceTitle,
  date,
  time,
  participants,
  totalCents,
  currency,
  guestName,
  hotelSlug,
  onClose,
}: DemoSuccessOverlayProps) {
  const searchParams = useSearchParams()
  const returnUrl = searchParams.get('returnUrl')

  const handleBrowseMore = () => {
    const next = returnUrl
      ? `/${hotelSlug}?returnUrl=${encodeURIComponent(returnUrl)}`
      : `/${hotelSlug}`
    window.location.href = next
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/60 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="w-full max-w-md bg-card rounded-card border border-border shadow-2xl overflow-hidden"
      >
        {/* Success Header */}
        <div className="bg-success/10 px-6 py-8 text-center">
          {/* Animated Checkmark */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', damping: 15, stiffness: 300 }}
            className="w-20 h-20 mx-auto mb-4 rounded-full bg-success/20 flex items-center justify-center"
          >
            <motion.svg
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="w-10 h-10 text-success"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={3}
            >
              <motion.path
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ delay: 0.4, duration: 0.5 }}
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 13l4 4L19 7"
              />
            </motion.svg>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-2xl font-heading text-card-foreground mb-2"
          >
            Request Sent!
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-muted-foreground"
          >
            Thank you, {guestName.split(' ')[0]}!
          </motion.p>
        </div>

        {/* Booking Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="px-6 py-5"
        >
          <h3 className="text-sm font-medium text-muted-foreground mb-3">Booking Summary</h3>
          
          <div className="space-y-2.5 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Experience</span>
              <span className="font-medium text-card-foreground text-right max-w-[60%]">
                {experienceTitle}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-muted-foreground">Date</span>
              <span className="font-medium text-card-foreground">
                {formatDate(date, { short: true })}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-muted-foreground">Time</span>
              <span className="font-medium text-card-foreground">
                {formatTime(time)}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-muted-foreground">Participants</span>
              <span className="font-medium text-card-foreground">{participants}</span>
            </div>
            
            <div className="flex justify-between pt-2.5 border-t border-border">
              <span className="font-semibold text-card-foreground">Total</span>
              <span className="text-lg font-bold text-accent">
                {formatPrice(totalCents, currency)}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Demo Notice */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mx-6 mb-5 px-4 py-3 bg-warning/10 border border-warning/20 rounded-button"
        >
          <p className="text-xs text-center text-warning font-medium">
            This is a demo — no actual booking was created
          </p>
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="px-6 pb-6"
        >
          <button
            onClick={handleBrowseMore}
            className="w-full py-3.5 bg-accent text-accent-foreground font-medium rounded-button hover:bg-accent-hover transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
          >
            Browse More Experiences
          </button>
        </motion.div>
      </motion.div>
    </motion.div>
  )
}
