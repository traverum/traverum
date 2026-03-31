import type { ReactNode } from 'react'

interface ExperienceInfoTabsProps {
  description: ReactNode
  location?: ReactNode
  bookingSection?: ReactNode
  howItWorksText: string
  paymentText: string
  cancellationText: string
}

export function ExperienceInfoTabs({
  description,
  location,
  bookingSection,
  howItWorksText,
  paymentText,
  cancellationText,
}: ExperienceInfoTabsProps) {
  return (
    <div>
      {/* Description */}
      <div className="mt-10 pt-8 border-t border-border">
        <h2
          className="font-body text-heading-foreground"
          style={{ fontSize: 'var(--font-size-h3)' }}
        >
          Description
        </h2>
        <div className="mt-4">{description}</div>
      </div>

      {/* Location */}
      {location && (
        <div className="mt-10 pt-8 border-t border-border">
          {location}
        </div>
      )}

      {/* Booking / availability results */}
      {bookingSection}

      {/* Good to know */}
      <div className="mt-10 pt-8 border-t border-border">
        <h2
          className="font-body text-heading-foreground"
          style={{ fontSize: 'var(--font-size-h3)' }}
        >
          Good to know
        </h2>
        <div className="mt-5 space-y-5">
          <div>
            <p
              className="font-body text-heading-foreground/80 font-medium"
              style={{ fontSize: 'var(--font-size-sm)' }}
            >
              How it works
            </p>
            <p
              className="mt-1.5 text-muted-foreground"
              style={{ fontSize: 'var(--font-size-sm)' }}
            >
              {howItWorksText}
            </p>
          </div>
          <div>
            <p
              className="font-body text-heading-foreground/80 font-medium"
              style={{ fontSize: 'var(--font-size-sm)' }}
            >
              Payment
            </p>
            <p
              className="mt-1.5 text-muted-foreground"
              style={{ fontSize: 'var(--font-size-sm)' }}
            >
              {paymentText}
            </p>
          </div>
          <div>
            <p
              className="font-body text-heading-foreground/80 font-medium"
              style={{ fontSize: 'var(--font-size-sm)' }}
            >
              Cancellation
            </p>
            <p
              className="mt-1.5 text-muted-foreground"
              style={{ fontSize: 'var(--font-size-sm)' }}
            >
              {cancellationText}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
