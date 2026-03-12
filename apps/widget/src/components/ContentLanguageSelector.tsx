'use client'

import { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import { useTranslation } from '@/components/TranslationProvider'
import { TRANSLATION_LANGUAGES, getTranslationLanguageNativeName } from '@/lib/translation-languages'
import { cn } from '@/lib/utils'

export function ContentLanguageSelector() {
  const { language, setLanguage } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false)
        setSearch('')
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      setTimeout(() => searchRef.current?.focus(), 0)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  const filtered = useMemo(() => {
    if (!search) return TRANSLATION_LANGUAGES
    const q = search.toLowerCase()
    return TRANSLATION_LANGUAGES.filter(
      l => l.name.toLowerCase().includes(q) || l.nativeName.toLowerCase().includes(q) || l.code.includes(q),
    )
  }, [search])

  const handleSelect = useCallback((code: string | null) => {
    setLanguage(code)
    setIsOpen(false)
    setSearch('')
  }, [setLanguage])

  const displayLabel = language
    ? getTranslationLanguageNativeName(language)
    : null

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'inline-flex items-center gap-1.5 px-2 h-9 rounded-button text-sm transition-colors',
          'hover:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-accent',
          language ? 'text-accent font-medium' : 'text-muted-foreground',
        )}
        aria-label="Change content language"
        aria-expanded={isOpen}
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
          <circle cx="12" cy="12" r="10" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
        {displayLabel && (
          <span className="hidden sm:inline max-w-[80px] truncate">{displayLabel}</span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1 w-56 bg-background border border-border rounded-button shadow-lg z-50 overflow-hidden">
          <div className="p-2 border-b border-border">
            <input
              ref={searchRef}
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search languages..."
              className="w-full px-2.5 py-1.5 text-sm border border-border rounded bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus-visible:ring-1 focus-visible:ring-accent"
            />
          </div>

          <div className="max-h-64 overflow-y-auto overscroll-contain">
            {/* Original option */}
            <button
              type="button"
              onClick={() => handleSelect(null)}
              className={cn(
                'w-full px-3 py-2 text-left text-sm flex items-center justify-between transition-colors',
                'hover:bg-muted focus:outline-none',
                !language && 'bg-accent/10 text-accent font-medium',
              )}
            >
              <span>Original</span>
              {!language && (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20 6 9 17l-5-5" />
                </svg>
              )}
            </button>

            <div className="h-px bg-border" />

            {filtered.map(lang => {
              const isSelected = language === lang.code
              return (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => handleSelect(lang.code)}
                  className={cn(
                    'w-full px-3 py-2 text-left text-sm flex items-center justify-between transition-colors',
                    'hover:bg-muted focus:outline-none',
                    isSelected && 'bg-accent/10 text-accent font-medium',
                  )}
                >
                  <span>
                    <span>{lang.nativeName}</span>
                    {lang.nativeName !== lang.name && (
                      <span className="text-muted-foreground ml-1.5 text-xs">({lang.name})</span>
                    )}
                  </span>
                  {isSelected && (
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M20 6 9 17l-5-5" />
                    </svg>
                  )}
                </button>
              )
            })}

            {filtered.length === 0 && (
              <p className="px-3 py-4 text-sm text-muted-foreground text-center">No languages found</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
