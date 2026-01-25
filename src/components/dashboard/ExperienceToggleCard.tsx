'use client'

import { useState } from 'react'
import type { ExperienceWithSelection } from '@/app/api/dashboard/experiences/route'

interface ExperienceToggleCardProps {
  experience: ExperienceWithSelection
  onToggle: (experienceId: string, isActive: boolean) => Promise<void>
}

export function ExperienceToggleCard({ experience, onToggle }: ExperienceToggleCardProps) {
  const [isSelected, setIsSelected] = useState(experience.is_selected)
  const [isLoading, setIsLoading] = useState(false)

  const handleToggle = async () => {
    const newValue = !isSelected
    setIsLoading(true)
    
    try {
      await onToggle(experience.id, newValue)
      setIsSelected(newValue)
    } catch (error) {
      console.error('Failed to toggle experience:', error)
      // Revert on error
    } finally {
      setIsLoading(false)
    }
  }

  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
    }).format(cents / 100)
  }

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours === 0) return `${mins}min`
    if (mins === 0) return `${hours}h`
    return `${hours}h ${mins}min`
  }

  return (
    <div
      className={`relative flex items-start gap-4 p-4 rounded-lg border-2 transition-all cursor-pointer ${
        isSelected
          ? 'border-blue-500 bg-blue-50'
          : 'border-gray-200 bg-white hover:border-gray-300'
      } ${isLoading ? 'opacity-70 pointer-events-none' : ''}`}
      onClick={handleToggle}
    >
      {/* Checkbox */}
      <div className="flex-shrink-0 pt-0.5">
        <div
          className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
            isSelected
              ? 'bg-blue-500 border-blue-500'
              : 'border-gray-300 bg-white'
          }`}
        >
          {isSelected && (
            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
          )}
        </div>
      </div>

      {/* Thumbnail */}
      {experience.image_url && (
        <div className="flex-shrink-0">
          <img
            src={experience.image_url}
            alt={experience.title}
            className="w-16 h-16 object-cover rounded-md"
          />
        </div>
      )}

      {/* Content */}
      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-gray-900 truncate">{experience.title}</h3>
        <p className="text-sm text-gray-500 truncate">{experience.supplier_name}</p>
      </div>

      {/* Price and Duration */}
      <div className="flex-shrink-0 text-right">
        <p className="font-medium text-gray-900">{formatPrice(experience.price_cents)}</p>
        <p className="text-sm text-gray-500">{formatDuration(experience.duration_minutes)}</p>
      </div>

      {/* Loading spinner */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/50 rounded-lg">
          <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  )
}
