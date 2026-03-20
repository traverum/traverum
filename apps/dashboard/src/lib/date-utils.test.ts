import { describe, it, expect } from 'vitest'
import { getTodayLocal, parseLocalDate, isSessionUpcoming, isBookingEnded } from './date-utils'

describe('getTodayLocal', () => {
  it('returns YYYY-MM-DD format', () => {
    expect(getTodayLocal(new Date(2026, 2, 20))).toBe('2026-03-20')
  })

  it('pads single-digit month/day', () => {
    expect(getTodayLocal(new Date(2026, 0, 5))).toBe('2026-01-05')
  })
})

describe('parseLocalDate', () => {
  it('parses as local midnight', () => {
    const date = parseLocalDate('2026-03-20')
    expect(date.getFullYear()).toBe(2026)
    expect(date.getMonth()).toBe(2)
    expect(date.getDate()).toBe(20)
    expect(date.getHours()).toBe(0)
  })
})

describe('isSessionUpcoming', () => {
  it('future date is upcoming', () => {
    const now = new Date(2026, 2, 20, 10, 0)
    expect(isSessionUpcoming('2026-03-25', '09:00', now)).toBe(true)
  })

  it('past date is not upcoming', () => {
    const now = new Date(2026, 2, 20, 10, 0)
    expect(isSessionUpcoming('2026-03-15', '09:00', now)).toBe(false)
  })

  it('today, future time is upcoming', () => {
    const now = new Date(2026, 2, 20, 10, 0)
    expect(isSessionUpcoming('2026-03-20', '14:00', now)).toBe(true)
  })

  it('today, past time is not upcoming', () => {
    const now = new Date(2026, 2, 20, 10, 0)
    expect(isSessionUpcoming('2026-03-20', '09:00', now)).toBe(false)
  })

  it('today, same hour but future minute is upcoming', () => {
    const now = new Date(2026, 2, 20, 10, 15)
    expect(isSessionUpcoming('2026-03-20', '10:30', now)).toBe(true)
  })

  it('today, same hour but past minute is not upcoming', () => {
    const now = new Date(2026, 2, 20, 10, 30)
    expect(isSessionUpcoming('2026-03-20', '10:15', now)).toBe(false)
  })
})

describe('isBookingEnded', () => {
  const makeBooking = (overrides = {}) => ({
    date: '2026-03-20',
    time: '14:00',
    isRental: false,
    rentalEndDate: null as string | null,
    experience: { durationMinutes: 120 },
    ...overrides,
  })

  it('past date means ended', () => {
    const now = new Date(2026, 2, 25, 10, 0)
    expect(isBookingEnded(makeBooking(), now)).toBe(true)
  })

  it('future date means not ended', () => {
    const now = new Date(2026, 2, 15, 10, 0)
    expect(isBookingEnded(makeBooking(), now)).toBe(false)
  })

  it('today, before end time means not ended', () => {
    const now = new Date(2026, 2, 20, 15, 0)
    expect(isBookingEnded(makeBooking(), now)).toBe(false)
  })

  it('today, after end time means ended', () => {
    const now = new Date(2026, 2, 20, 17, 0)
    expect(isBookingEnded(makeBooking(), now)).toBe(true)
  })

  it('rental: ended when today > rental_end_date', () => {
    const now = new Date(2026, 2, 25, 10, 0)
    const booking = makeBooking({ isRental: true, rentalEndDate: '2026-03-22' })
    expect(isBookingEnded(booking, now)).toBe(true)
  })

  it('rental: not ended when today <= rental_end_date', () => {
    const now = new Date(2026, 2, 20, 10, 0)
    const booking = makeBooking({ isRental: true, rentalEndDate: '2026-03-22' })
    expect(isBookingEnded(booking, now)).toBe(false)
  })

  it('rental: not ended on exact end date', () => {
    const now = new Date(2026, 2, 22, 10, 0)
    const booking = makeBooking({ isRental: true, rentalEndDate: '2026-03-22' })
    expect(isBookingEnded(booking, now)).toBe(false)
  })
})
