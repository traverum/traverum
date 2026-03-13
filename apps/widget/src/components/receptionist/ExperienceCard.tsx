'use client'

import type { ReceptionistExperience } from '@/lib/receptionist/experiences'
import { formatPrice, formatDuration } from '@/lib/utils'

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

export function ExperienceCard({ experience, isActive, compact, onClick }: ExperienceCardProps) {
  const priceLabel = getPriceLabel(experience)

  if (compact) {
    return (
      <button
        onClick={onClick}
        className={`w-full flex items-center gap-3 p-2.5 rounded-lg border text-left transition-colors ${
          isActive
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-200 bg-white hover:border-gray-300'
        }`}
      >
        {experience.coverImage && (
          <img
            src={experience.coverImage}
            alt=""
            className="w-12 h-12 rounded-md object-cover flex-shrink-0"
          />
        )}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-gray-900 truncate">{experience.title}</p>
          <p className="text-xs text-gray-500">
            {priceLabel} · {formatDuration(experience.duration_minutes)}
            {experience.distance_km != null && ` · ${experience.distance_km.toFixed(1)} km`}
          </p>
        </div>
        {experience.isSelected && (
          <span className="flex-shrink-0 text-[10px] font-medium bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">
            REC
          </span>
        )}
      </button>
    )
  }

  return (
    <button
      onClick={onClick}
      className={`w-full text-left rounded-lg border overflow-hidden transition-all ${
        isActive
          ? 'border-blue-500 ring-2 ring-blue-200'
          : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
      }`}
    >
      {experience.coverImage && (
        <div className="aspect-[16/9] overflow-hidden bg-gray-100">
          <img
            src={experience.coverImage}
            alt=""
            className="w-full h-full object-cover"
          />
        </div>
      )}
      <div className="p-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-semibold text-gray-900 line-clamp-2">{experience.title}</h3>
          {experience.isSelected && (
            <span className="flex-shrink-0 text-[10px] font-medium bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded mt-0.5">
              REC
            </span>
          )}
        </div>
        <p className="text-xs text-gray-500 mt-1">
          {experience.supplier.name}
          {experience.distance_km != null && ` · ${experience.distance_km.toFixed(1)} km`}
        </p>
        <div className="flex items-center gap-3 mt-2 text-xs text-gray-700">
          <span className="font-medium">{priceLabel}</span>
          <span className="text-gray-400">·</span>
          <span>{formatDuration(experience.duration_minutes)}</span>
          {experience.max_participants > 0 && (
            <>
              <span className="text-gray-400">·</span>
              <span>{experience.min_participants}–{experience.max_participants} guests</span>
            </>
          )}
        </div>
        {experience.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {experience.tags.slice(0, 3).map(tag => (
              <span key={tag} className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </button>
  )
}
