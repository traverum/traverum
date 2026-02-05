'use client'

import { useEffect, useCallback } from 'react'
import { X } from 'lucide-react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { SessionPicker } from './SessionPicker'
import type { ExperienceSession } from '@/lib/supabase/types'

interface DatePickerDrawerProps {
  isOpen: boolean
  onClose: () => void
  sessions: ExperienceSession[]
  selectedSessionId: string | null
  isCustomRequest: boolean
  customDate: string
  customTime: string
  onSessionSelect: (sessionId: string | null, isCustom: boolean) => void
  onCustomDateChange: (date: string) => void
  onCustomTimeChange: (time: string) => void
  onConfirm: () => void
  participants: number
}

export function DatePickerDrawer({
  isOpen,
  onClose,
  sessions,
  selectedSessionId,
  isCustomRequest,
  customDate,
  customTime,
  onSessionSelect,
  onCustomDateChange,
  onCustomTimeChange,
  onConfirm,
  participants,
}: DatePickerDrawerProps) {
  const shouldReduceMotion = useReducedMotion()
  const hasSelection = isCustomRequest 
    ? (customDate && customTime)
    : selectedSessionId

  // Handle escape key
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose()
    }
  }, [onClose])

  // Lock body scroll and add keyboard listener when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      document.addEventListener('keydown', handleKeyDown)
    }
    return () => {
      document.body.style.overflow = ''
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, handleKeyDown])

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.2 }}
            className="fixed inset-0 bg-black/50 z-50"
            onClick={onClose}
            aria-hidden="true"
          />
          
          {/* Drawer */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="drawer-title"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={shouldReduceMotion 
              ? { duration: 0 } 
              : { type: 'spring', damping: 25, stiffness: 300 }
            }
            className="fixed inset-x-0 bottom-0 z-50 bg-background rounded-t-2xl max-h-[85vh] overflow-hidden flex flex-col font-body overscroll-contain"
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 rounded-full bg-muted-foreground/30" aria-hidden="true" />
            </div>
            
            {/* Header */}
            <div className="flex items-center justify-between px-4 pb-3 border-b border-border">
              <h3 id="drawer-title" className="text-lg font-bold text-foreground">Select Date</h3>
              <button
                type="button"
                onClick={onClose}
                className="p-2 -mr-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                aria-label="Close"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>
            
            {/* Content */}
            <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-4">
              <SessionPicker
                sessions={sessions}
                selectedSessionId={selectedSessionId}
                isCustomRequest={isCustomRequest}
                customDate={customDate}
                customTime={customTime}
                onSessionSelect={onSessionSelect}
                onCustomDateChange={onCustomDateChange}
                onCustomTimeChange={onCustomTimeChange}
                participants={participants}
              />
            </div>
            
            {/* Footer */}
            <div className="p-4 border-t border-border bg-background">
              <button
                type="button"
                onClick={onConfirm}
                disabled={!hasSelection}
                className="w-full py-3.5 bg-accent text-accent-foreground font-medium rounded-button hover:bg-accent-hover transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
              >
                Confirm Selection
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
