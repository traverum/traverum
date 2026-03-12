'use client'

import { useEffect } from 'react'
import { useTranslation } from '@/components/TranslationProvider'
import { RichText } from '@/components/RichText'
import { cn } from '@/lib/utils'
import type { CSSProperties } from 'react'

interface TranslatedRichTextProps {
  experienceId: string
  fallbackText: string
  className?: string
  style?: CSSProperties
}

export function TranslatedRichText({
  experienceId,
  fallbackText,
  className,
  style,
}: TranslatedRichTextProps) {
  const { language, getTranslation, isTranslating, requestTranslation } = useTranslation()

  useEffect(() => {
    if (language) {
      requestTranslation(experienceId)
    }
  }, [language, experienceId, requestTranslation])

  const translation = getTranslation(experienceId)
  const loading = isTranslating(experienceId)

  if (loading) {
    return (
      <div className={cn('space-y-3', className)} style={style}>
        <div className="h-4 w-full animate-pulse rounded bg-muted" />
        <div className="h-4 w-5/6 animate-pulse rounded bg-muted" />
        <div className="h-4 w-4/6 animate-pulse rounded bg-muted" />
      </div>
    )
  }

  const text = translation?.description ?? fallbackText

  return <RichText text={text} className={className} style={style} />
}
