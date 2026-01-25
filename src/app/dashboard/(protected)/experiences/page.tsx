'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ExperienceToggleCard } from '@/components/dashboard/ExperienceToggleCard'
import type { ExperienceWithSelection } from '@/app/api/dashboard/experiences/route'

export default function ExperiencesPage() {
  const [experiences, setExperiences] = useState<ExperienceWithSelection[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchExperiences()
  }, [])

  const fetchExperiences = async () => {
    try {
      const response = await fetch('/api/dashboard/experiences')
      if (!response.ok) {
        throw new Error('Failed to fetch experiences')
      }
      const data = await response.json()
      setExperiences(data.experiences)
    } catch (err) {
      setError('Failed to load experiences. Please try again.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleToggle = async (experienceId: string, isActive: boolean) => {
    const response = await fetch('/api/dashboard/distributions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ experience_id: experienceId, is_active: isActive }),
    })

    if (!response.ok) {
      throw new Error('Failed to update distribution')
    }

    // Update local state
    setExperiences(prev =>
      prev.map(exp =>
        exp.id === experienceId ? { ...exp, is_selected: isActive } : exp
      )
    )
  }

  const selectedCount = experiences.filter(e => e.is_selected).length

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-64 bg-gray-200 rounded animate-pulse" />
        <div className="h-4 w-96 bg-gray-200 rounded animate-pulse" />
        <div className="space-y-3 mt-8">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-gray-200 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={fetchExperiences}
          className="text-blue-600 hover:underline"
        >
          Try again
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Select Experiences</h1>
        <p className="mt-1 text-gray-600">
          Choose which experiences appear on your widget
        </p>
      </div>

      {/* Experience list */}
      {experiences.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <p className="text-gray-500">No experiences available yet.</p>
          <p className="text-sm text-gray-400 mt-1">
            Contact Traverum to add experiences to your region.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {experiences.map(experience => (
            <ExperienceToggleCard
              key={experience.id}
              experience={experience}
              onToggle={handleToggle}
            />
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
        <p className="text-sm text-gray-600">
          <span className="font-medium">{selectedCount}</span> experience{selectedCount !== 1 ? 's' : ''} selected
        </p>
        <Link
          href="/dashboard/embed"
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors"
        >
          Continue to Embed Setup
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </div>
  )
}
