'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { DemoSuccessOverlay } from './DemoSuccessOverlay'

const checkoutSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Please enter a valid email'),
  phone: z.string().min(6, 'Phone number is required'),
})

type CheckoutFormData = z.infer<typeof checkoutSchema>

interface CheckoutFormProps {
  hotelSlug: string
  experienceId: string
  experienceTitle: string
  currency: string
  sessionId?: string
  participants: number
  totalCents: number
  isRequest: boolean
  requestDate?: string
  requestTime?: string
  sessionDate?: string
  sessionTime?: string
  isDemo?: boolean
}

export function CheckoutForm({
  hotelSlug,
  experienceId,
  experienceTitle,
  currency,
  sessionId,
  participants,
  totalCents,
  isRequest,
  requestDate,
  requestTime,
  sessionDate,
  sessionTime,
  isDemo = false,
}: CheckoutFormProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const returnUrl = searchParams.get('returnUrl')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showDemoSuccess, setShowDemoSuccess] = useState(false)
  const [submittedData, setSubmittedData] = useState<CheckoutFormData | null>(null)
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
  })
  
  // Get the date and time for display
  const displayDate = sessionDate || requestDate || ''
  const displayTime = sessionTime || requestTime || ''
  
  const onSubmit = async (data: CheckoutFormData) => {
    setIsSubmitting(true)
    setError(null)
    
    // Demo mode: show success overlay without making API call
    if (isDemo) {
      // Simulate a brief delay for realism
      await new Promise(resolve => setTimeout(resolve, 800))
      setSubmittedData(data)
      setShowDemoSuccess(true)
      setIsSubmitting(false)
      return
    }
    
    try {
      const response = await fetch('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hotelSlug,
          experienceId,
          sessionId,
          participants,
          totalCents,
          isRequest,
          requestDate,
          requestTime,
          guestName: `${data.firstName} ${data.lastName}`,
          guestEmail: data.email,
          guestPhone: data.phone,
        }),
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to create reservation')
      }
      
      // Redirect to confirmation page
      const next = returnUrl
        ? `/${hotelSlug}/reservation/${result.reservationId}?returnUrl=${encodeURIComponent(returnUrl)}`
        : `/${hotelSlug}/reservation/${result.reservationId}`
      router.push(next)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setIsSubmitting(false)
    }
  }
  
  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 font-body">
        {error && (
          <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-button text-sm border border-destructive/20">
            {error}
          </div>
        )}
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-foreground mb-2">
              First name *
            </label>
            <input
              {...register('firstName')}
              type="text"
              id="firstName"
              className={cn(
                'w-full px-4 py-2.5 border rounded-button bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-colors',
                errors.firstName ? 'border-destructive' : 'border-border'
              )}
              disabled={isSubmitting}
            />
            {errors.firstName && (
              <p className="mt-1.5 text-xs text-destructive">{errors.firstName.message}</p>
            )}
          </div>
          
          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-foreground mb-2">
              Last name *
            </label>
            <input
              {...register('lastName')}
              type="text"
              id="lastName"
              className={cn(
                'w-full px-4 py-2.5 border rounded-button bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-colors',
                errors.lastName ? 'border-destructive' : 'border-border'
              )}
              disabled={isSubmitting}
            />
            {errors.lastName && (
              <p className="mt-1.5 text-xs text-destructive">{errors.lastName.message}</p>
            )}
          </div>
        </div>
        
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
            Email *
          </label>
          <input
            {...register('email')}
            type="email"
            id="email"
            className={cn(
              'w-full px-4 py-2.5 border rounded-button bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-colors',
              errors.email ? 'border-destructive' : 'border-border'
            )}
            disabled={isSubmitting}
            placeholder="you@example.com"
          />
          {errors.email && (
            <p className="mt-1.5 text-xs text-destructive">{errors.email.message}</p>
          )}
        </div>
        
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-foreground mb-2">
            Phone number *
          </label>
          <input
            {...register('phone')}
            type="tel"
            id="phone"
            className={cn(
              'w-full px-4 py-2.5 border rounded-button bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-colors',
              errors.phone ? 'border-destructive' : 'border-border'
            )}
            disabled={isSubmitting}
            placeholder="+358 40 123 4567"
          />
          {errors.phone && (
            <p className="mt-1.5 text-xs text-destructive">{errors.phone.message}</p>
          )}
          <p className="mt-1.5 text-xs text-muted-foreground">
            The provider may contact you about your booking
          </p>
        </div>
        
        <button
          type="submit"
          disabled={isSubmitting}
          className={cn(
            'w-full py-3.5 bg-accent text-accent-foreground font-medium rounded-button hover:bg-accent-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2',
            isSubmitting && 'opacity-50 cursor-not-allowed'
          )}
        >
          {isSubmitting ? 'Sending...' : 'Send Request'}
        </button>
        
        <p className="text-xs text-center text-muted-foreground">
          By submitting, you agree to our terms of service and privacy policy.
          You won't be charged until the provider accepts and you complete payment.
        </p>
      </form>
      
      {/* Demo Success Overlay */}
      <AnimatePresence>
        {showDemoSuccess && submittedData && (
          <DemoSuccessOverlay
            experienceTitle={experienceTitle}
            date={displayDate}
            time={displayTime}
            participants={participants}
            totalCents={totalCents}
            currency={currency}
            guestName={`${submittedData.firstName} ${submittedData.lastName}`}
            hotelSlug={hotelSlug}
            onClose={() => setShowDemoSuccess(false)}
          />
        )}
      </AnimatePresence>
    </>
  )
}
