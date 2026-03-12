'use client'

import { useEffect } from 'react'
import { useTranslation } from '@/components/TranslationProvider'
import { cn } from '@/lib/utils'

interface TranslatedTextProps {
  experienceId: string
  field: 'title' | 'description' | 'meetingPoint'
  fallback: string
  as?: 'span' | 'p' | 'div'
  className?: string
  style?: React.CSSProperties
}

export function TranslatedText({
  experienceId,
  field,
  fallback,
  as: Tag = 'span',
  className,
  style,
}: TranslatedTextProps) {
  const { language, getTranslation, isTranslating, requestTranslation } = useTranslation()

  useEffect(() => {
    if (language) {
      requestTranslation(experienceId)
    }
  }, [language, experienceId, requestTranslation])

  const translation = getTranslation(experienceId)
  const loading = isTranslating(experienceId)

  const text = translation ? (translation[field] ?? fallback) : fallback

  return (
    <Tag
      className={cn(
        loading && 'animate-pulse rounded bg-muted',
        className,
      )}
      style={style}
    >
      {loading ? '\u00A0' : text}
    </Tag>
  )
}
