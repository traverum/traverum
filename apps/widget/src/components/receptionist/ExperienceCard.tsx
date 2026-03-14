'use client'

import type { ReceptionistExperience } from '@/lib/receptionist/experiences'
import { formatPrice, formatDuration, formatDate, formatTime } from '@/lib/utils'
import { CalendarDays } from 'lucide-react'

interface ExperienceCardProps {
  experience: ReceptionistExperience
  isActive: boolean
  compact: boolean
  onClick: () => void
}

function getPriceLabel(exp: ReceptionistExperience): string {
  switch (exp.pricing_type) {
    case 'per_person':
      return `${formatPrice(exp.extra_person_cents || exp.price_cents, exp.currency)}/person`
    case 'flat_rate':
      return `${formatPrice(exp.base_price_cents || exp.price_cents, exp.currency)} flat`
    case 'base_plus_extra':
      return `from ${formatPrice(exp.base_price_cents || exp.price_cents, exp.currency)}`
    case 'per_day':
      return `${formatPrice(exp.price_per_day_cents || exp.price_cents, exp.currency)}/day`
    default:
      return formatPrice(exp.price_cents, exp.currency)
  }
}

function getAvailabilityLabel(exp: ReceptionistExperience): string | null {
  if (!exp.nextSession) return null
  const today = new Date().toISOString().slice(0, 10)
  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10)

  if (exp.nextSession.date === today) return `Today ${formatTime(exp.nextSession.time)}`
  if (exp.nextSession.date === tomorrow) return `Tomorrow ${formatTime(exp.nextSession.time)}`
  return `${formatDate(exp.nextSession.date, { short: true })} ${formatTime(exp.nextSession.time)}`
}

export function ExperienceCard({ experience, isActive, compact, onClick }: ExperienceCardProps) {
  const priceLabel = getPriceLabel(experience)
  const availabilityLabel = getAvailabilityLabel(experience)

  if (compact) {
    return (
      <button
        onClick={onClick}
        className={`w-full flex items-center gap-3.5 p-3 rounded-2xl text-left transition-all ${
          isActive
            ? 'bg-accent/8 ring-2 ring-accent/25'
            : 'hover:bg-card/80'
        }`}
      >
        {experience.coverImage ? (
          <img
            src={experience.coverImage}
            alt=""
            className="w-14 h-14 rounded-xl object-cover flex-shrink-0"
          />
        ) : (
          <div className="w-14 h-14 rounded-xl bg-muted flex-shrink-0" />
        )}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-foreground truncate">{experience.title}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {priceLabel} · {formatDuration(experience.duration_minutes)}
          </p>
          {availabilityLabel && (
            <p className="text-[11px] text-success flex items-center gap-1 mt-1">
              <CalendarDays className="w-3 h-3" />
              {availabilityLabel}
            </p>
          )}
        </div>
      </button>
    )
  }

  return (
    <button
      onClick={onClick}
      className={`w-full text-left rounded-2xl overflow-hidden transition-all ${
        isActive
          ? 'ring-2 ring-accent/30 shadow-md'
          : 'shadow-sm hover:shadow-md'
      }`}
    >
      {experience.coverImage ? (
        <div className="aspect-[4/3] overflow-hidden bg-muted">
          <img
            src={experience.coverImage}
            alt=""
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        <div className="aspect-[4/3] bg-muted" />
      )}
      <div className="p-4 bg-card">
        <h3 className="text-sm font-medium text-foreground line-clamp-1">{experience.title}</h3>
        <p className="text-xs text-muted-foreground mt-1">
          {experience.supplier.name}
          {experience.distance_km != null && ` · ${experience.distance_km.toFixed(1)} km`}
        </p>
        <div className="flex items-center justify-between mt-2.5">
          <span className="text-sm font-medium text-foreground">{priceLabel}</span>
          <span className="text-xs text-muted-foreground">{formatDuration(experience.duration_minutes)}</span>
        </div>
        {availabilityLabel && (
          <p className="text-[11px] text-success flex items-center gap-1 mt-2">
            <CalendarDays className="w-3 h-3" />
            Next: {availabilityLabel}
          </p>
        )}
      </div>
    </button>
  )
}
