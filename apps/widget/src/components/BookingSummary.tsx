import Image from 'next/image'
import { formatPrice, formatDuration, formatDate, formatTime } from '@/lib/utils'
import type { Experience, ExperienceSession } from '@/lib/supabase/types'

interface BookingSummaryProps {
  experience: Experience
  session?: ExperienceSession | null
  participants: number
  totalCents: number
  isRequest: boolean
  requestDate?: string
  requestTime?: string
  coverImage?: string | null
}

export function BookingSummary({
  experience,
  session,
  participants,
  totalCents,
  isRequest,
  requestDate,
  requestTime,
  coverImage,
}: BookingSummaryProps) {
  const date = session?.session_date || requestDate || ''
  const time = session?.start_time || requestTime || ''
  
  return (
    <div className="bg-card rounded-card border border-border overflow-hidden sticky top-6">
      {/* Image */}
      {coverImage && (
        <div className="relative aspect-[16/9]">
          <img
            src={coverImage}
            alt={experience.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      
      <div className="p-5 space-y-4">
        {/* Title */}
        <div>
          <h3 className="font-heading text-card-foreground">{experience.title}</h3>
          <p className="text-sm text-muted-foreground mt-0.5">{formatDuration(experience.duration_minutes)}</p>
        </div>
        
        {/* Details */}
        <div className="space-y-2.5 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Date</span>
            <span className="font-medium text-card-foreground">
              {date ? formatDate(date, { short: true }) : 'Not selected'}
            </span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-muted-foreground">Time</span>
            <span className="font-medium text-card-foreground">
              {time ? formatTime(time) : 'Not selected'}
            </span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-muted-foreground">Participants</span>
            <span className="font-medium text-card-foreground">{participants}</span>
          </div>
          
          {isRequest && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Type</span>
              <span className="font-medium text-warning">Custom Request</span>
            </div>
          )}
        </div>
        
        {/* Total */}
        <div className="pt-4 border-t border-border">
          <div className="flex justify-between items-center">
            <span className="font-semibold text-card-foreground">Total</span>
            <span className="text-xl font-bold text-accent">
              {formatPrice(totalCents, experience.currency)}
            </span>
          </div>
        </div>
        
        {/* Notice */}
        {isRequest && (
          <p className="text-xs text-muted-foreground bg-warning/10 p-3 rounded-button border border-warning/20">
            This is a custom request. The provider will confirm if this time is available.
          </p>
        )}
      </div>
    </div>
  )
}
