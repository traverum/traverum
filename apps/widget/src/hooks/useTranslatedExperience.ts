'use client'

import { useEffect } from 'react'
import { useTranslation } from '@/components/TranslationProvider'

interface ExperienceLike {
  id: string
  title: string
  description: string
  meeting_point: string | null
}

export function useTranslatedExperience(experience: ExperienceLike) {
  const { language, getTranslation, isTranslating, requestTranslation } = useTranslation()

  useEffect(() => {
    if (language) {
      requestTranslation(experience.id)
    }
  }, [language, experience.id, requestTranslation])

  const translation = getTranslation(experience.id)
  const translating = isTranslating(experience.id)

  if (!language || !translation) {
    return {
      title: experience.title,
      description: experience.description,
      meetingPoint: experience.meeting_point,
      isTranslating: translating,
      isTranslated: false,
    }
  }

  return {
    title: translation.title,
    description: translation.description,
    meetingPoint: translation.meetingPoint,
    isTranslating: translating,
    isTranslated: true,
  }
}
