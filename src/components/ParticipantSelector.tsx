'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import { Users, ChevronDown } from 'lucide-react'
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
  const dropdownRef = useRef<HTMLDivElement>(null)
  const effectiveMax = availableSpots ? Math.min(max, availableSpots) : max
  
  // Generate array of valid participant counts
  const participantOptions = useMemo(() => {
    const options: number[] = []
    for (let i = min; i <= effectiveMax; i++) {
      options.push(i)
    }
    return options
  }, [min, effectiveMax])
  
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
  }
  
  const displayText = `${value} ${value === 1 ? 'person' : 'people'}`
  
  return (
    <div className="relative font-body" ref={dropdownRef}>
      <div>
        <span className="text-sm font-medium text-foreground">How many people?</span>
        {availableSpots && availableSpots < max && (
          <p className="text-xs text-muted-foreground mt-0.5">
            {availableSpots} spots available
          </p>
        )}
      </div>
      
      {/* Dropdown button - styled like date picker */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 border border-border rounded-button bg-background hover:border-accent/50 transition-colors text-left mt-2"
      >
        <div className="flex items-center gap-3">
          <Users className="w-5 h-5 text-muted-foreground" />
          <span className="text-foreground font-medium">
            {displayText}
          </span>
        </div>
        <ChevronDown className={cn('w-5 h-5 text-muted-foreground transition-transform', isOpen && 'rotate-180')} />
      </button>
      
      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-background border border-border rounded-button shadow-lg overflow-hidden">
          <div className="max-h-60 overflow-y-auto">
            {participantOptions.map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => handleSelect(num)}
                className={cn(
                  'w-full px-4 py-2.5 text-left text-sm transition-colors',
                  value === num
                    ? 'bg-accent/10 text-accent font-medium'
                    : 'text-foreground hover:bg-muted'
                )}
              >
                {num} {num === 1 ? 'person' : 'people'}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
