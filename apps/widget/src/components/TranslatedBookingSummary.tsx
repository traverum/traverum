'use client'

import { useTranslatedExperience } from '@/hooks/useTranslatedExperience'
import { BookingSummary } from '@/components/BookingSummary'
import type { Experience, ExperienceSession } from '@/lib/supabase/types'

interface TranslatedBookingSummaryProps {
  experience: Experience
  session?: ExperienceSession | null
  participants: number
  totalCents: number
  isRequest: boolean
  requestDate?: string
  requestTime?: string
  coverImage?: string | null
  rentalDays?: number
  quantity?: number
  payOnSite?: boolean
}

export function TranslatedBookingSummary({ experience, ...rest }: TranslatedBookingSummaryProps) {
  const { title } = useTranslatedExperience(experience)

  const translatedExperience = {
    ...experience,
    title,
  }

  return <BookingSummary experience={translatedExperience} {...rest} />
}
