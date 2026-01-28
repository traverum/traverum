'use client'

import { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import { Users, ChevronDown, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ParticipantSelectorProps {
  value: number
  onChange: (value: number) => void
  min: number
  max: number
  availableSpots?: number
}

export function ParticipantSelector({ 
  value, 
  onChange, 
  min, 
  max,
  availableSpots 
}: ParticipantSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [focusedIndex, setFocusedIndex] = useState(-1)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const optionsRef = useRef<(HTMLButtonElement | null)[]>([])
  const effectiveMax = availableSpots ? Math.min(max, availableSpots) : max
  
  // Generate array of valid participant counts
  const participantOptions = useMemo(() => {
    const options: number[] = []
    for (let i = min; i <= effectiveMax; i++) {
      options.push(i)
    }
    return options
  }, [min, effectiveMax])

  // Find the current value index
  const currentIndex = participantOptions.indexOf(value)
  
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
        setFocusedIndex(prev => Math.min(prev + 1, participantOptions.length - 1))
        break
      case 'ArrowUp':
        e.preventDefault()
        setFocusedIndex(prev => Math.max(prev - 1, 0))
        break
      case 'Enter':
      case ' ':
        e.preventDefault()
        if (focusedIndex >= 0) {
          handleSelect(participantOptions[focusedIndex])
        }
        break
      case 'Tab':
        setIsOpen(false)
        break
    }
  }, [isOpen, focusedIndex, participantOptions, currentIndex])

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
  
  const handleSelect = (num: number) => {
    onChange(num)
    setIsOpen(false)
    buttonRef.current?.focus()
  }
  
  const displayText = `${value} ${value === 1 ? 'person' : 'people'}`
  const dropdownId = 'participant-dropdown'
  
  return (
    <div className="relative font-body" ref={dropdownRef}>
      <label id="participant-label" className="block">
        <span className="text-sm font-medium text-foreground">Participants</span>
        {availableSpots && availableSpots < max && (
          <p className="text-xs text-muted-foreground mt-0.5 tabular-nums">
            {availableSpots} spots available
          </p>
        )}
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
        aria-labelledby="participant-label"
        aria-controls={dropdownId}
        className="w-full flex items-center justify-between px-4 py-3 border border-border rounded-button bg-background hover:border-accent/50 transition-colors duration-150 text-left mt-2 touch-manipulation focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1"
      >
        <div className="flex items-center gap-3">
          <Users className="w-5 h-5 text-muted-foreground" aria-hidden="true" />
          <span className="text-foreground font-medium tabular-nums">
            {displayText}
          </span>
        </div>
        <ChevronDown 
          className={cn(
            'w-5 h-5 text-muted-foreground transition-transform duration-150', 
            isOpen && 'rotate-180'
          )} 
          aria-hidden="true"
        />
      </button>
      
      {/* Dropdown menu */}
      {isOpen && (
        <div 
          id={dropdownId}
          role="listbox"
          aria-labelledby="participant-label"
          aria-activedescendant={focusedIndex >= 0 ? `option-${participantOptions[focusedIndex]}` : undefined}
          className="absolute z-50 w-full mt-1 bg-background border border-border rounded-button shadow-lg overflow-hidden"
        >
          <div className="max-h-60 overflow-y-auto overscroll-contain">
            {participantOptions.map((num, index) => {
              const isSelected = value === num
              const isFocused = focusedIndex === index
              return (
                <button
                  key={num}
                  id={`option-${num}`}
                  ref={(el) => { optionsRef.current[index] = el }}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => handleSelect(num)}
                  onMouseEnter={() => setFocusedIndex(index)}
                  className={cn(
                    'w-full px-4 py-2.5 text-left text-sm transition-colors duration-100 flex items-center justify-between touch-manipulation',
                    'focus:outline-none',
                    isSelected && 'bg-accent/10 text-accent font-medium',
                    isFocused && !isSelected && 'bg-muted',
                    !isSelected && !isFocused && 'text-foreground'
                  )}
                >
                  <span className="tabular-nums">{num} {num === 1 ? 'person' : 'people'}</span>
                  {isSelected && <Check className="w-4 h-4" aria-hidden="true" />}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
