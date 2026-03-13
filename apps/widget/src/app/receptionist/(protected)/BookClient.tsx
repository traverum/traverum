'use client'

import { useState, useMemo, useCallback } from 'react'
import type { ReceptionistExperience } from '@/lib/receptionist/experiences'
import { ExperienceCard } from '@/components/receptionist/ExperienceCard'
import { BookingPanel } from '@/components/receptionist/BookingPanel'

interface BookClientProps {
  selected: ReceptionistExperience[]
  nearby: ReceptionistExperience[]
  hotelSlug: string
  hotelName: string
  userId: string
}

type TabKey = 'recommended' | 'nearby'

export function BookClient({ selected, nearby, hotelSlug, hotelName, userId }: BookClientProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('recommended')
  const [search, setSearch] = useState('')
  const [selectedExperience, setSelectedExperience] = useState<ReceptionistExperience | null>(null)

  const experiences = activeTab === 'recommended' ? selected : nearby

  const filtered = useMemo(() => {
    if (!search.trim()) return experiences
    const q = search.toLowerCase()
    return experiences.filter(
      e =>
        e.title.toLowerCase().includes(q) ||
        e.supplier.name.toLowerCase().includes(q) ||
        e.tags.some(t => t.toLowerCase().includes(q))
    )
  }, [experiences, search])

  const handleSelect = useCallback((exp: ReceptionistExperience) => {
    setSelectedExperience(prev => (prev?.id === exp.id ? null : exp))
  }, [])

  const handleBookingComplete = useCallback(() => {
    setSelectedExperience(null)
  }, [])

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">Book for Guest</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Select an experience, pick a time, and send a payment link
        </p>
      </div>

      {/* Tabs + Search */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex bg-gray-100 rounded-lg p-0.5">
          <button
            onClick={() => { setActiveTab('recommended'); setSelectedExperience(null) }}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'recommended'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Recommended ({selected.length})
          </button>
          <button
            onClick={() => { setActiveTab('nearby'); setSelectedExperience(null) }}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'nearby'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            All Nearby ({nearby.length})
          </button>
        </div>

        <div className="flex-1 sm:max-w-xs">
          <input
            type="text"
            placeholder="Search experiences..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Experience List */}
        <div className={`space-y-3 ${selectedExperience ? 'lg:col-span-1' : 'lg:col-span-3'}`}>
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              {search.trim()
                ? 'No experiences match your search.'
                : activeTab === 'recommended'
                  ? 'No recommended experiences yet. Check "All Nearby" for available options.'
                  : 'No experiences found within your hotel\'s radius.'}
            </div>
          ) : (
            <div className={selectedExperience ? 'space-y-2' : 'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3'}>
              {filtered.map(exp => (
                <ExperienceCard
                  key={exp.id}
                  experience={exp}
                  isActive={selectedExperience?.id === exp.id}
                  compact={!!selectedExperience}
                  onClick={() => handleSelect(exp)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Booking Panel */}
        {selectedExperience && (
          <div className="lg:col-span-2">
            <BookingPanel
              experience={selectedExperience}
              hotelSlug={hotelSlug}
              hotelName={hotelName}
              userId={userId}
              onClose={() => setSelectedExperience(null)}
              onComplete={handleBookingComplete}
            />
          </div>
        )}
      </div>
    </div>
  )
}
