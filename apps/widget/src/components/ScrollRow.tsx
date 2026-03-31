'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ScrollRowProps {
  title: string
  children: React.ReactNode
}

export function ScrollRow({ title, children }: ScrollRowProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  const checkOverflow = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    setCanScrollLeft(el.scrollLeft > 4)
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4)
  }, [])

  useEffect(() => {
    checkOverflow()
    const el = scrollRef.current
    if (!el) return
    const observer = new ResizeObserver(checkOverflow)
    observer.observe(el)
    return () => observer.disconnect()
  }, [checkOverflow])

  const scroll = useCallback(
    (direction: 'left' | 'right') => {
      const el = scrollRef.current
      if (!el) return
      const amount = el.clientWidth * 0.75
      el.scrollBy({
        left: direction === 'left' ? -amount : amount,
        behavior: 'smooth',
      })
    },
    []
  )

  return (
    <div>
      <h2
        className="font-heading text-heading-foreground mb-4"
        style={{ fontSize: 'var(--font-size-h2)' }}
      >
        {title}
      </h2>

      <div className="group/row relative -mx-2">
        {/* Left arrow */}
        <div
          className={cn(
            'absolute left-1 top-0 bottom-2 z-10 flex items-center',
            'transition-opacity duration-200',
            canScrollLeft
              ? 'opacity-0 group-hover/row:opacity-100'
              : 'opacity-0 pointer-events-none'
          )}
        >
          <button
            onClick={() => scroll('left')}
            className="w-9 h-9 rounded-full bg-card/90 backdrop-blur-sm shadow-md flex items-center justify-center hover:bg-card transition-colors"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-5 h-5 text-foreground" aria-hidden />
          </button>
        </div>

        {/* Scroll container */}
        <div
          ref={scrollRef}
          onScroll={checkOverflow}
          className="flex gap-3 md:gap-4 overflow-x-auto scrollbar-hide scroll-smooth px-2 pt-2 pb-5"
          style={{ scrollSnapType: 'x mandatory' }}
        >
          {children}
        </div>

        {/* Right arrow */}
        <div
          className={cn(
            'absolute right-1 top-0 bottom-2 z-10 flex items-center',
            'transition-opacity duration-200',
            canScrollRight
              ? 'opacity-0 group-hover/row:opacity-100'
              : 'opacity-0 pointer-events-none'
          )}
        >
          <button
            onClick={() => scroll('right')}
            className="w-9 h-9 rounded-full bg-card/90 backdrop-blur-sm shadow-md flex items-center justify-center hover:bg-card transition-colors"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-5 h-5 text-foreground" aria-hidden />
          </button>
        </div>
      </div>
    </div>
  )
}
