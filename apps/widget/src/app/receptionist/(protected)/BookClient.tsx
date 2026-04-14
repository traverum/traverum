'use client'

import { useState, useMemo, useCallback } from 'react'
import type { ReceptionistExperience } from '@/lib/receptionist/experiences'
import { ExperienceCard } from '@/components/receptionist/ExperienceCard'
import { BookingPanel } from '@/components/receptionist/BookingPanel'
import { getTagLabel } from '@traverum/shared'

interface BookClientProps {
  selected: ReceptionistExperience[]
  nearby: ReceptionistExperience[]
  hotelSlug: string
  hotelName: string
  userId: string
  appUrl: string
  veyondUrl: string
}

type TabKey = 'recommended' | 'nearby'

export function BookClient({ selected, nearby, hotelSlug, hotelName, userId, appUrl, veyondUrl }: BookClientProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('recommended')
  const [search, setSearch] = useState('')
  const [activeTag, setActiveTag] = useState<string | null>(null)
  const [selectedExperience, setSelectedExperience] = useState<ReceptionistExperience | null>(null)

  const [guestName, setGuestName] = useState('')
  const [guestEmail, setGuestEmail] = useState('')
  const [guestPhone, setGuestPhone] = useState('')

  const allExperiences = useMemo(() => [...selected, ...nearby], [selected, nearby])

  const topTags = useMemo(() => {
    const counts = new Map<string, number>()
    for (const exp of allExperiences) {
      for (const tag of exp.tags) {
        counts.set(tag, (counts.get(tag) || 0) + 1)
      }
    }
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([tag]) => tag)
  }, [allExperiences])

  const experiences = activeTab === 'recommended' ? selected : nearby

  const filtered = useMemo(() => {
    let list = experiences
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(
        e =>
          e.title.toLowerCase().includes(q) ||
          e.supplier.name.toLowerCase().includes(q) ||
          e.tags.some(t => t.toLowerCase().includes(q))
      )
    }
    if (activeTag) {
      list = list.filter(e => e.tags.some(t => t.toLowerCase() === activeTag.toLowerCase()))
    }
    return list
  }, [experiences, search, activeTag])

  const handleSelect = useCallback((exp: ReceptionistExperience) => {
    setSelectedExperience(prev => (prev?.id === exp.id ? null : exp))
  }, [])

  const handleBookingComplete = useCallback((details: { name: string; email: string; phone: string }) => {
    setGuestName(details.name)
    setGuestEmail(details.email)
    setGuestPhone(details.phone)
    setSelectedExperience(null)
  }, [])

  const handleTagClick = useCallback((tag: string) => {
    setActiveTag(prev => (prev === tag ? null : tag))
  }, [])

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-light text-foreground">Book for Guest</h1>

      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex bg-muted rounded-2xl p-1">
          <button
            onClick={() => { setActiveTab('recommended'); setSelectedExperience(null) }}
            className={`px-5 py-2 rounded-xl text-sm transition-all ${
              activeTab === 'recommended'
                ? 'bg-card text-foreground font-medium shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Recommended ({selected.length})
          </button>
          <button
            onClick={() => { setActiveTab('nearby'); setSelectedExperience(null) }}
            className={`px-5 py-2 rounded-xl text-sm transition-all ${
              activeTab === 'nearby'
                ? 'bg-card text-foreground font-medium shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            All Nearby ({nearby.length})
          </button>
        </div>

        <div className="flex-1 sm:max-w-xs">
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full h-10 px-4 text-sm rounded-xl border border-border/50 bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-colors"
          />
        </div>
      </div>

      {topTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {topTags.map(tag => (
            <button
              key={tag}
              onClick={() => handleTagClick(tag)}
              className={`px-3.5 py-1.5 text-xs rounded-full transition-all ${
                activeTag === tag
                  ? 'bg-accent text-accent-foreground font-medium shadow-sm'
                  : 'bg-card text-muted-foreground shadow-sm hover:text-foreground hover:shadow'
              }`}
            >
              {getTagLabel(tag)}
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className={`${selectedExperience ? 'lg:col-span-1 lg:sticky lg:top-6 lg:self-start' : 'lg:col-span-3'}`}>
          {filtered.length === 0 ? (
            <div className="py-16 text-center text-sm text-muted-foreground">
              {search.trim() || activeTag
                ? 'No experiences match your filter.'
                : activeTab === 'recommended'
                  ? 'No recommended experiences yet.'
                  : 'No experiences found nearby.'}
            </div>
          ) : selectedExperience ? (
            <div className="space-y-1">
              <div className="max-h-[calc(100vh-8rem)] overflow-y-auto space-y-2 pr-1">
                {filtered.map(exp => (
                  <ExperienceCard
                    key={exp.id}
                    experience={exp}
                    isActive={selectedExperience?.id === exp.id}
                    compact
                    onClick={() => handleSelect(exp)}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {filtered.map(exp => (
                <ExperienceCard
                  key={exp.id}
                  experience={exp}
                  isActive={false}
                  compact={false}
                  onClick={() => handleSelect(exp)}
                />
              ))}
            </div>
          )}
        </div>

        {selectedExperience && (
          <div className="lg:col-span-2">
            <BookingPanel
              experience={selectedExperience}
              hotelSlug={hotelSlug}
              hotelName={hotelName}
              userId={userId}
              appUrl={appUrl}
              veyondUrl={veyondUrl}
              initialGuestName={guestName}
              initialGuestEmail={guestEmail}
              initialGuestPhone={guestPhone}
              onClose={() => setSelectedExperience(null)}
              onComplete={handleBookingComplete}
            />
          </div>
        )}
      </div>
    </div>
  )
}
