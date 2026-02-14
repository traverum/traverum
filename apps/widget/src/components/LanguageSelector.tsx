'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { getLanguageName } from '@/lib/languages'

interface LanguageSelectorProps {
  value: string
  onChange: (value: string) => void
  languages: string[]
}

export function LanguageSelector({
  value,
  onChange,
  languages,
}: LanguageSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [focusedIndex, setFocusedIndex] = useState(-1)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const optionsRef = useRef<(HTMLButtonElement | null)[]>([])

  const currentIndex = languages.indexOf(value)

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        setIsOpen(true)
        setFocusedIndex(currentIndex >= 0 ? currentIndex : 0)
      }
      return
    }

    switch (e.key) {
      case 'Escape':
        e.preventDefault()
        setIsOpen(false)
        buttonRef.current?.focus()
        break
      case 'ArrowDown':
        e.preventDefault()
        setFocusedIndex(prev => Math.min(prev + 1, languages.length - 1))
        break
      case 'ArrowUp':
        e.preventDefault()
        setFocusedIndex(prev => Math.max(prev - 1, 0))
        break
      case 'Enter':
      case ' ':
        e.preventDefault()
        if (focusedIndex >= 0) {
          handleSelect(languages[focusedIndex])
        }
        break
      case 'Tab':
        setIsOpen(false)
        break
    }
  }, [isOpen, focusedIndex, languages, currentIndex])

  // Focus the option when focusedIndex changes
  useEffect(() => {
    if (isOpen && focusedIndex >= 0 && optionsRef.current[focusedIndex]) {
      optionsRef.current[focusedIndex]?.focus()
    }
  }, [focusedIndex, isOpen])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const handleSelect = (code: string) => {
    onChange(code)
    setIsOpen(false)
    buttonRef.current?.focus()
  }

  const displayText = value ? getLanguageName(value) : 'Select language'
  const dropdownId = 'language-dropdown'

  return (
    <div className="relative font-body" ref={dropdownRef}>
      <label id="language-label" className="block">
        <span className="text-sm font-medium text-foreground">Preferred language</span>
      </label>

      {/* Dropdown button */}
      <button
        ref={buttonRef}
        type="button"
        onClick={() => {
          setIsOpen(!isOpen)
          if (!isOpen) setFocusedIndex(currentIndex >= 0 ? currentIndex : 0)
        }}
        onKeyDown={handleKeyDown}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-labelledby="language-label"
        aria-controls={dropdownId}
        className="w-full flex items-center justify-between px-4 py-3 border border-border rounded-button bg-background hover:border-accent/50 transition-colors duration-150 text-left mt-2 touch-manipulation focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1"
      >
        <div className="flex items-center gap-3">
          <svg className="w-5 h-5 text-muted-foreground" aria-hidden="true" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10" /><path strokeLinecap="round" strokeLinejoin="round" d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></svg>
          <span className={value ? 'text-foreground font-medium' : 'text-muted-foreground'}>
            {displayText}
          </span>
        </div>
        <svg className={cn('w-5 h-5 text-muted-foreground transition-transform duration-150', isOpen && 'rotate-180')} aria-hidden="true" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="m6 9 6 6 6-6" /></svg>
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div
          id={dropdownId}
          role="listbox"
          aria-labelledby="language-label"
          aria-activedescendant={focusedIndex >= 0 ? `lang-option-${languages[focusedIndex]}` : undefined}
          className="absolute z-50 w-full mt-1 bg-background border border-border rounded-button shadow-lg overflow-hidden"
        >
          <div className="max-h-60 overflow-y-auto overscroll-contain">
            {languages.map((code, index) => {
              const isSelected = value === code
              const isFocused = focusedIndex === index
              return (
                <button
                  key={code}
                  id={`lang-option-${code}`}
                  ref={(el) => { optionsRef.current[index] = el }}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => handleSelect(code)}
                  onMouseEnter={() => setFocusedIndex(index)}
                  className={cn(
                    'w-full px-4 py-2.5 text-left text-sm transition-colors duration-100 flex items-center justify-between touch-manipulation',
                    'focus:outline-none',
                    isSelected && 'bg-accent/10 text-accent font-medium',
                    isFocused && !isSelected && 'bg-muted',
                    !isSelected && !isFocused && 'text-foreground'
                  )}
                >
                  <span>{getLanguageName(code)}</span>
                  {isSelected && <svg className="w-4 h-4" aria-hidden="true" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M20 6 9 17l-5-5" /></svg>}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
