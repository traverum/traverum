'use client'

import { createContext, useContext, useState, useMemo, useCallback, useRef, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { calculatePrice, getDisplayPrice } from '@/lib/pricing'
import { isDateAvailable, getOperatingHours, generateTimeSlots, DEFAULT_TIME_GROUPS } from '@/lib/availability'
import type { AvailabilityRule } from '@/lib/availability'
import type { ExperienceWithMedia } from '@/lib/hotels'
import type { Tables } from '@/lib/supabase/types'
import type { PriceCalculation } from '@/lib/pricing'

type ExperienceSession = Tables<'experience_sessions'>

interface BookingFlowState {
  experience: ExperienceWithMedia
  sessions: ExperienceSession[]
  availabilityRules: AvailabilityRule[]
  hotelSlug: string
  returnUrl?: string | null
  isRental: boolean

  selectedDate: string
  setSelectedDate: (date: string) => void
  participants: number
  setParticipants: (n: number) => void
  quantity: number
  setQuantity: (n: number) => void
  rentalEndDate: string
  setRentalEndDate: (date: string) => void
  rentalDays: number

  isSearchActive: boolean

  selectedSessionId: string | null
  isCustomRequest: boolean
  requestTime: string
  preferredLanguage: string
  setPreferredLanguage: (lang: string) => void

  handleSessionSelect: (sessionId: string | null, isCustom: boolean) => void
  handleRequestTimeChange: (time: string) => void

  sessionsForDate: ExperienceSession[]
  requestTimeSlots: string[]
  sessionsByDate: Record<string, ExperienceSession[]>

  priceCalc: PriceCalculation
  displayPrice: { price: string; suffix: string }
  canContinue: boolean
  handleContinue: () => void

  resultsRef: React.RefObject<HTMLElement | null>
}

const BookingFlowContext = createContext<BookingFlowState | null>(null)

export function useBookingFlow() {
  const ctx = useContext(BookingFlowContext)
  if (!ctx) throw new Error('useBookingFlow must be used inside BookingFlowProvider')
  return ctx
}

interface BookingFlowProviderProps {
  experience: ExperienceWithMedia
  sessions: ExperienceSession[]
  availabilityRules?: AvailabilityRule[]
  hotelSlug: string
  returnUrl?: string | null
  children: ReactNode
}

export function BookingFlowProvider({
  experience,
  sessions,
  availabilityRules = [],
  hotelSlug,
  returnUrl,
  children,
}: BookingFlowProviderProps) {
  const router = useRouter()
  const resultsRef = useRef<HTMLElement | null>(null)
  const isRental = experience.pricing_type === 'per_day'

  const [selectedDate, setSelectedDate] = useState('')
  const [participants, setParticipants] = useState(experience.min_participants || 1)
  const [quantity, setQuantity] = useState(1)
  const [rentalEndDate, setRentalEndDate] = useState('')
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null)
  const [isCustomRequest, setIsCustomRequest] = useState(false)
  const [requestTime, setRequestTime] = useState('')
  const [preferredLanguage, setPreferredLanguage] = useState('')

  // Results show automatically when a date is selected
  const isSearchActive = !!selectedDate

  const rentalDays = useMemo(() => {
    if (!isRental || !selectedDate || !rentalEndDate) return experience.min_days || 1
    const s = new Date(selectedDate + 'T12:00:00')
    const e = new Date(rentalEndDate + 'T12:00:00')
    return Math.max(1, Math.round((e.getTime() - s.getTime()) / 86_400_000) + 1)
  }, [isRental, selectedDate, rentalEndDate, experience.min_days])

  const sessionsByDate = useMemo(() => {
    const grouped: Record<string, ExperienceSession[]> = {}
    sessions.forEach(s => {
      if (!grouped[s.session_date]) grouped[s.session_date] = []
      grouped[s.session_date].push(s)
    })
    return grouped
  }, [sessions])

  const sessionsForDate = useMemo(() => {
    if (!selectedDate) return []
    return sessionsByDate[selectedDate] || []
  }, [selectedDate, sessionsByDate])

  const selectedSession = useMemo(
    () => sessions.find(s => s.id === selectedSessionId) || null,
    [sessions, selectedSessionId]
  )

  const requestTimeSlots = useMemo(() => {
    if (!selectedDate) return []
    const dateObj = new Date(selectedDate + 'T00:00:00')
    if (availabilityRules.length > 0 && !isDateAvailable(dateObj, availabilityRules)) return []

    const hours = getOperatingHours(dateObj, availabilityRules)
    let slots: string[]
    if (hours) {
      slots = generateTimeSlots(hours.start, hours.end)
    } else {
      slots = [...DEFAULT_TIME_GROUPS.morning, ...DEFAULT_TIME_GROUPS.afternoon, ...DEFAULT_TIME_GROUPS.evening]
    }

    if (sessionsForDate.length > 0) {
      const sessionTimes = new Set(sessionsForDate.map(s => s.start_time.slice(0, 5)))
      slots = slots.filter(slot => !sessionTimes.has(slot))
    }

    return slots
  }, [selectedDate, sessionsForDate, availabilityRules])

  // When the date changes, reset time selection and scroll to results
  const handleDateChange = useCallback((date: string) => {
    setSelectedDate(date)
    setRentalEndDate('')
    setSelectedSessionId(null)
    setIsCustomRequest(false)
    setRequestTime('')
    if (date) {
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 50)
    }
  }, [])

  const handleSessionSelect = useCallback((sessionId: string | null, isCustom: boolean) => {
    if (isCustom) {
      setIsCustomRequest(true)
      setSelectedSessionId(null)
    } else {
      setIsCustomRequest(false)
      setSelectedSessionId(sessionId)
    }
  }, [])

  const handleRequestTimeChange = useCallback((time: string) => {
    setRequestTime(time)
    setIsCustomRequest(true)
    setSelectedSessionId(null)
  }, [])

  const priceCalc = useMemo(() => {
    if (isRental) return calculatePrice(experience, quantity, null, rentalDays, quantity)
    return calculatePrice(experience, participants, selectedSession)
  }, [experience, isRental, participants, quantity, rentalDays, selectedSession])

  const displayPriceMemo = useMemo(() => getDisplayPrice(experience), [experience])

  const canContinue = useMemo(() => {
    if (isRental) return !!(selectedDate && rentalEndDate)
    if (isCustomRequest) return !!(selectedDate && requestTime && experience.allows_requests)
    return !!selectedSessionId
  }, [isRental, isCustomRequest, selectedDate, rentalEndDate, requestTime, selectedSessionId, experience.allows_requests])

  const handleContinue = useCallback(() => {
    if (!canContinue) return

    const params = new URLSearchParams()
    params.set('experienceId', experience.id)
    if (returnUrl) params.set('returnUrl', returnUrl)

    if (isRental) {
      params.set('participants', quantity.toString())
      params.set('total', priceCalc.totalPrice.toString())
      params.set('requestDate', selectedDate)
      params.set('rentalDays', rentalDays.toString())
      params.set('quantity', quantity.toString())
      params.set('isRequest', 'true')
    } else {
      if (participants < 1 || participants > experience.max_participants) return
      params.set('participants', participants.toString())
      params.set('total', priceCalc.totalPrice.toString())

      if (isCustomRequest) {
        params.set('requestDate', selectedDate)
        params.set('requestTime', requestTime)
        params.set('isRequest', 'true')
        if (preferredLanguage) params.set('preferredLanguage', preferredLanguage)
      } else if (selectedSession) {
        params.set('sessionId', selectedSession.id)
        if (selectedSession.session_language) params.set('preferredLanguage', selectedSession.session_language)
      }
    }

    router.push(`/${hotelSlug}/checkout?${params.toString()}`)
  }, [canContinue, experience, hotelSlug, isRental, isCustomRequest, participants, quantity, rentalDays, selectedDate, requestTime, preferredLanguage, selectedSession, priceCalc, returnUrl, router])

  const value: BookingFlowState = useMemo(() => ({
    experience,
    sessions,
    availabilityRules,
    hotelSlug,
    returnUrl,
    isRental,

    selectedDate,
    setSelectedDate: handleDateChange,
    participants,
    setParticipants,
    quantity,
    setQuantity,
    rentalEndDate,
    setRentalEndDate,
    rentalDays,

    isSearchActive,

    selectedSessionId,
    isCustomRequest,
    requestTime,
    preferredLanguage,
    setPreferredLanguage,

    handleSessionSelect,
    handleRequestTimeChange,

    sessionsForDate,
    requestTimeSlots,
    sessionsByDate,

    priceCalc,
    displayPrice: displayPriceMemo,
    canContinue,
    handleContinue,

    resultsRef,
  }), [
    experience, sessions, availabilityRules, hotelSlug, returnUrl, isRental,
    selectedDate, handleDateChange, participants, quantity, rentalEndDate, rentalDays,
    isSearchActive,
    selectedSessionId, isCustomRequest, requestTime, preferredLanguage,
    handleSessionSelect, handleRequestTimeChange,
    sessionsForDate, requestTimeSlots, sessionsByDate,
    priceCalc, displayPriceMemo, canContinue, handleContinue,
    resultsRef,
  ])

  return (
    <BookingFlowContext.Provider value={value}>
      {children}
    </BookingFlowContext.Provider>
  )
}
