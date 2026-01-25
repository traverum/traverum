'use client'

import { X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
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
  const hasSelection = isCustomRequest 
    ? (customDate && customTime)
    : selectedSessionId

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 z-50"
            onClick={onClose}
          />
          
          {/* Drawer */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-x-0 bottom-0 z-50 bg-background rounded-t-2xl max-h-[85vh] overflow-hidden flex flex-col font-body"
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
            </div>
            
            {/* Header */}
            <div className="flex items-center justify-between px-4 pb-3 border-b border-border">
              <h3 className="text-lg font-medium text-foreground">Select Date & Time</h3>
              <button
                type="button"
                onClick={onClose}
                className="p-2 -mr-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Content */}
            <div className="flex-1 overflow-y-auto px-4 py-4">
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
                className="w-full py-3.5 bg-accent text-accent-foreground font-medium rounded-button hover:bg-accent-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Confirm
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
