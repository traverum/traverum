'use client'

import { useState, useRef, useEffect } from 'react'
import { Search, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { EXPERIENCE_TAGS, getTagLabel } from '@traverum/shared'

export type TimeBucket = 'morning' | 'afternoon' | 'evening'

export interface FilterState {
  search: string
  tag: string | null
  date: string | null
  timeBucket: TimeBucket | null
  people: number | null
}

const EMPTY_FILTERS: FilterState = {
  search: '',
  tag: null,
  date: null,
  timeBucket: null,
  people: null,
}

interface SearchFilterBarProps {
  filters: FilterState
  onChange: (filters: FilterState) => void
  availableTags: string[]
}

export function SearchFilterBar({ filters, onChange, availableTags }: SearchFilterBarProps) {
  const [searchOpen, setSearchOpen] = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)
  const searchContainerRef = useRef<HTMLDivElement>(null)

  function update(patch: Partial<FilterState>) {
    onChange({ ...filters, ...patch })
  }

  function openSearch() {
    setSearchOpen(true)
    requestAnimationFrame(() => searchRef.current?.focus())
  }

  function closeSearch() {
    if (!filters.search) {
      setSearchOpen(false)
    }
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && !filters.search) setSearchOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [filters.search])

  useEffect(() => {
    if (!searchOpen) return
    function onClick(e: MouseEvent) {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target as Node) &&
        !filters.search
      ) {
        setSearchOpen(false)
      }
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [searchOpen, filters.search])

  return (
    <div className="flex items-center gap-2 min-h-[44px]">
      {/* Expandable search */}
      <div ref={searchContainerRef} className="flex items-center shrink-0">
        {searchOpen ? (
          <div className="relative flex items-center animate-[fadeIn_0.15s_ease-out]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <input
              ref={searchRef}
              type="text"
              value={filters.search}
              onChange={(e) => update({ search: e.target.value })}
              onBlur={closeSearch}
              placeholder="Search..."
              className="w-[180px] sm:w-[220px] pl-9 pr-8 py-2 rounded-full border border-border bg-background text-sm font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/40 transition-all"
            />
            <button
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                update({ search: '' })
                setSearchOpen(false)
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-muted transition-colors"
              aria-label="Close search"
            >
              <X className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          </div>
        ) : (
          <button
            onClick={openSearch}
            className="flex items-center justify-center w-9 h-9 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
            aria-label="Open search"
          >
            <Search className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Tag pills */}
      {availableTags.length > 0 && (
        <div className="flex-1 min-w-0 overflow-x-auto scrollbar-hide">
          <div className="flex flex-nowrap items-center gap-1.5 py-1">
            <button
              onClick={() => update({ tag: null })}
              className={cn(
                'relative flex-shrink-0 min-h-[36px] py-2 px-4 text-[13px] font-body font-light tracking-[0.06em] rounded-full transition-colors whitespace-nowrap',
                filters.tag === null
                  ? 'bg-heading-foreground/10 text-heading-foreground border border-heading-foreground/20'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              All
            </button>
            {availableTags.map((tagId) => (
              <button
                key={tagId}
                onClick={() => update({ tag: filters.tag === tagId ? null : tagId })}
                className={cn(
                  'relative flex-shrink-0 min-h-[36px] py-2 px-4 text-[13px] font-body font-light tracking-[0.06em] rounded-full transition-colors whitespace-nowrap',
                  filters.tag === tagId
                    ? 'bg-heading-foreground/10 text-heading-foreground border border-heading-foreground/20'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {getTagLabel(tagId)}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export { EMPTY_FILTERS }
