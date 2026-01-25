'use client'

import { useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Media } from '@/lib/supabase/types'

interface ImageGalleryProps {
  images: Media[]
  fallbackImage?: string | null
  title: string
}

export function ImageGallery({ images, fallbackImage, title }: ImageGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  
  // Combine media with fallback - ensure URLs are valid
  const allImages = images && images.length > 0 
    ? images
        .map(img => img?.url)
        .filter((url): url is string => Boolean(url) && typeof url === 'string' && url.length > 0)
    : fallbackImage 
      ? [fallbackImage]
      : []
  
  if (allImages.length === 0) {
    return (
      <div className="aspect-[4/3] bg-muted rounded-card flex items-center justify-center">
        <svg className="w-16 h-16 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>
    )
  }
  
  const goToPrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev === 0 ? allImages.length - 1 : prev - 1))
  }, [allImages.length])

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev === allImages.length - 1 ? 0 : prev + 1))
  }, [allImages.length])

  const handleThumbnailClick = (index: number) => {
    setCurrentIndex(index)
  }

  const openLightbox = () => {
    setLightboxOpen(true)
  }

  // Keyboard navigation for lightbox
  useEffect(() => {
    if (!lightboxOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          setLightboxOpen(false)
          break
        case 'ArrowLeft':
          goToPrevious()
          break
        case 'ArrowRight':
          goToNext()
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [lightboxOpen, goToPrevious, goToNext])

  return (
    <>
      {/* Desktop Gallery */}
      <div className="hidden md:block">
        <button
          onClick={openLightbox}
          className="w-full aspect-video rounded-card overflow-hidden cursor-zoom-in focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <AnimatePresence mode="wait">
            <motion.img
              key={currentIndex}
              src={allImages[currentIndex]}
              alt={`${title} - Image ${currentIndex + 1}`}
              className="w-full h-full object-cover"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            />
          </AnimatePresence>
        </button>
        
        {allImages.length > 1 && (
          <div className="flex gap-2 mt-3">
            {allImages.map((image, index) => (
              <button
                key={index}
                onClick={() => handleThumbnailClick(index)}
                className={cn(
                  'h-20 aspect-square rounded-lg overflow-hidden transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent',
                  index === currentIndex
                    ? 'ring-2 ring-accent'
                    : 'opacity-70 hover:opacity-100'
                )}
              >
                <img
                  src={image}
                  alt={`${title} thumbnail ${index + 1}`}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Mobile Carousel */}
      <div className="md:hidden relative">
        <button
          onClick={openLightbox}
          className="w-full aspect-[4/3] overflow-hidden cursor-zoom-in focus:outline-none rounded-card"
        >
          <AnimatePresence mode="wait">
            <motion.img
              key={currentIndex}
              src={allImages[currentIndex]}
              alt={`${title} - Image ${currentIndex + 1}`}
              className="w-full h-full object-cover"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            />
          </AnimatePresence>
        </button>

        {/* Navigation Arrows */}
        {allImages.length > 1 && (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); goToPrevious(); }}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-full bg-background/80 backdrop-blur-sm shadow-sm hover:bg-background transition-colors"
              aria-label="Previous image"
            >
              <ChevronLeft className="w-5 h-5 text-foreground" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); goToNext(); }}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-full bg-background/80 backdrop-blur-sm shadow-sm hover:bg-background transition-colors"
              aria-label="Next image"
            >
              <ChevronRight className="w-5 h-5 text-foreground" />
            </button>

            {/* Dot Indicators */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
              {allImages.map((_, index) => (
                <button
                  key={index}
                  onClick={(e) => { e.stopPropagation(); setCurrentIndex(index); }}
                  className={cn(
                    'w-2 h-2 rounded-full transition-colors duration-150',
                    index === currentIndex ? 'bg-accent' : 'bg-foreground/30'
                  )}
                  aria-label={`Go to image ${index + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Lightbox */}
      <Lightbox
        images={allImages}
        currentIndex={currentIndex}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        onPrevious={goToPrevious}
        onNext={goToNext}
        title={title}
      />
    </>
  )
}

interface LightboxProps {
  images: string[]
  currentIndex: number
  isOpen: boolean
  onClose: () => void
  onPrevious: () => void
  onNext: () => void
  title: string
}

function Lightbox({ images, currentIndex, isOpen, onClose, onPrevious, onNext, title }: LightboxProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/90"
          onClick={onClose}
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full bg-background/10 hover:bg-background/20 transition-colors z-10"
            aria-label="Close lightbox"
          >
            <X className="w-6 h-6 text-background" />
          </button>

          {/* Previous Button */}
          {images.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); onPrevious(); }}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center rounded-full bg-background/10 hover:bg-background/20 transition-colors z-10"
              aria-label="Previous image"
            >
              <ChevronLeft className="w-6 h-6 text-background" />
            </button>
          )}

          {/* Next Button */}
          {images.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); onNext(); }}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center rounded-full bg-background/10 hover:bg-background/20 transition-colors z-10"
              aria-label="Next image"
            >
              <ChevronRight className="w-6 h-6 text-background" />
            </button>
          )}

          {/* Image */}
          <motion.img
            key={currentIndex}
            src={images[currentIndex]}
            alt={`${title} - Image ${currentIndex + 1}`}
            className="max-w-[90vw] max-h-[80vh] object-contain shadow-lightbox"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
          />

          {/* Counter */}
          {images.length > 1 && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-sm text-background/80">
              {currentIndex + 1} / {images.length}
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}