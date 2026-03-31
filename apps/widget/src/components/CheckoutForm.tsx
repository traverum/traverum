'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { getAnalyticsSource } from '@/lib/analytics.client'
import { DemoSuccessOverlay } from './DemoSuccessOverlay'
import { CardGuaranteeSection, type CardGuaranteeHandle } from './CardGuaranteeSection'
import type { PaymentMode } from '@traverum/shared'

const checkoutSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Please enter a valid email'),
  phone: z.string().min(6, 'Phone number is required'),
  isCompany: z.boolean().default(false),
  companyName: z.string().max(200).optional(),
  vat: z.string().max(50).optional(),
  billingAddress: z.string().max(500).optional(),
  invoiceRequested: z.boolean().default(false),
})

type CheckoutFormData = z.infer<typeof checkoutSchema>

interface CheckoutFormProps {
  hotelSlug?: string
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
  returnUrl?: string | null
  preferredLanguage?: string
  rentalDays?: number
  quantity?: number
  paymentMode?: PaymentMode
  cancellationPolicyText?: string
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
  returnUrl,
  preferredLanguage,
  rentalDays,
  quantity,
  paymentMode = 'stripe',
  cancellationPolicyText = 'Free cancellation up to 7 days before.',
}: CheckoutFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showDemoSuccess, setShowDemoSuccess] = useState(false)
  const [submittedData, setSubmittedData] = useState<CheckoutFormData | null>(null)
  const [policyAccepted, setPolicyAccepted] = useState(false)
  const stripeRef = useRef<CardGuaranteeHandle>(null)

  const showCardGuarantee = paymentMode === 'pay_on_site' && !isRequest
  
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: { isCompany: false, invoiceRequested: false },
  })

  const isCompany = watch('isCompany')
  
  // Get the date and time for display
  const displayDate = sessionDate || requestDate || ''
  const displayTime = sessionTime || ''
  
  const onSubmit = async (data: CheckoutFormData) => {
    setIsSubmitting(true)
    setError(null)
    
    if (isDemo) {
      await new Promise(resolve => setTimeout(resolve, 800))
      setSubmittedData(data)
      setShowDemoSuccess(true)
      setIsSubmitting(false)
      return
    }

    if (showCardGuarantee && !policyAccepted) {
      setError('Please accept the cancellation policy to continue.')
      setIsSubmitting(false)
      return
    }
    
    try {
      const isDirect = !hotelSlug || hotelSlug === 'experiences'
      const basePath = isDirect ? '/experiences' : `/${hotelSlug}`

      // Pay-on-site session-based: validate card first via Stripe Elements
      if (showCardGuarantee) {
        const handle = stripeRef.current
        if (!handle?.stripe || !handle?.elements) {
          throw new Error('Card form is not ready. Please wait a moment and try again.')
        }

        const { error: submitError } = await handle.elements.submit()
        if (submitError) {
          throw new Error(submitError.message ?? 'Card validation failed')
        }
      }

      const response = await fetch('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...(isDirect ? { direct: true } : { hotelSlug }),
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
          preferredLanguage: preferredLanguage || null,
          source: getAnalyticsSource(),
          invoiceRequested: data.invoiceRequested ?? false,
          ...(data.isCompany
            ? {
                guestCompanyName: data.companyName?.trim() || null,
                guestVat: data.vat?.trim() || null,
                guestBillingAddress: data.billingAddress?.trim() || null,
              }
            : {}),
          ...(rentalDays ? { rentalDays } : {}),
          ...(quantity ? { quantity } : {}),
        }),
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to create reservation')
      }

      // Pay-on-site session-based: confirm the Setup Intent with Stripe
      if (showCardGuarantee && result.setupIntentClientSecret) {
        const handle = stripeRef.current!
        const reservationUrl = `${window.location.origin}${basePath}/reservation/${result.reservationId}`

        const { error: confirmError } = await handle.stripe!.confirmSetup({
          elements: handle.elements!,
          clientSecret: result.setupIntentClientSecret,
          confirmParams: {
            return_url: reservationUrl,
          },
          redirect: 'if_required',
        })

        if (confirmError) {
          throw new Error(confirmError.message ?? 'Failed to save card')
        }

        // Card saved — create booking via confirm-guarantee
        const confirmRes = await fetch(`/api/reservations/${result.reservationId}/confirm-guarantee`, {
          method: 'POST',
        })
        const confirmResult = await confirmRes.json()
        if (!confirmRes.ok) {
          throw new Error(confirmResult.error || 'Failed to confirm reservation')
        }

        const next = returnUrl
          ? `${basePath}/reservation/${result.reservationId}?returnUrl=${encodeURIComponent(returnUrl)}`
          : `${basePath}/reservation/${result.reservationId}`
        router.push(next)
        return
      }
      
      // Stripe session-based: redirect to payment
      if (!isRequest && result.paymentUrl) {
        window.location.href = result.paymentUrl
      } else {
        const next = returnUrl
          ? `${basePath}/reservation/${result.reservationId}?returnUrl=${encodeURIComponent(returnUrl)}`
          : `${basePath}/reservation/${result.reservationId}`
        router.push(next)
      }
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
          />
          {errors.phone && (
            <p className="mt-1.5 text-xs text-destructive">{errors.phone.message}</p>
          )}
          <p className="mt-1.5 text-xs text-muted-foreground">
            The provider may contact you about your booking
          </p>
        </div>

        {showCardGuarantee && (
          <CardGuaranteeSection
            ref={stripeRef}
            disabled={isSubmitting}
            cancellationPolicyText={cancellationPolicyText}
            policyAccepted={policyAccepted}
            onPolicyChange={setPolicyAccepted}
          />
        )}

        <div className="space-y-2 pt-1">
          <label className="flex cursor-pointer items-center gap-2.5">
            <input
              type="checkbox"
              {...register('isCompany')}
              className="h-3.5 w-3.5 rounded border-border text-accent focus:ring-2 focus:ring-accent focus:ring-offset-0"
              disabled={isSubmitting}
            />
            <span className="text-xs text-muted-foreground">Booking for a company or business</span>
          </label>
          {isCompany && (
            <div className="ml-5 mt-2 space-y-2">
              <div>
                <label htmlFor="companyName" className="block text-xs text-muted-foreground mb-1">
                  Company name
                </label>
                <input
                  {...register('companyName')}
                  type="text"
                  id="companyName"
                  placeholder="Company or organisation"
                  className={cn(
                    'w-full px-3 py-2 text-sm border rounded-button bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-colors',
                    'border-border'
                  )}
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <label htmlFor="vat" className="block text-xs text-muted-foreground mb-1">
                  VAT number
                </label>
                <input
                  {...register('vat')}
                  type="text"
                  id="vat"
                  placeholder="e.g. FI12345678"
                  className={cn(
                    'w-full px-3 py-2 text-sm border rounded-button bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-colors',
                    'border-border'
                  )}
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <label htmlFor="billingAddress" className="block text-xs text-muted-foreground mb-1">
                  Billing address
                </label>
                <textarea
                  {...register('billingAddress')}
                  id="billingAddress"
                  rows={2}
                  placeholder="Street, postal code, city, country"
                  className={cn(
                    'w-full px-3 py-2 text-sm border rounded-button bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-colors resize-y',
                    'border-border'
                  )}
                  disabled={isSubmitting}
                />
              </div>
            </div>
          )}
          <label className="flex cursor-pointer items-center gap-2.5">
            <input
              type="checkbox"
              {...register('invoiceRequested')}
              className="h-3.5 w-3.5 rounded border-border text-accent focus:ring-2 focus:ring-accent focus:ring-offset-0"
              disabled={isSubmitting}
            />
            <span className="text-xs text-muted-foreground">I need an invoice</span>
          </label>
        </div>
        
        <button
          type="submit"
          disabled={isSubmitting || (showCardGuarantee && !policyAccepted)}
          className={cn(
            'w-full py-3.5 bg-accent text-accent-foreground font-medium rounded-button hover:bg-accent-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2',
            isSubmitting && 'opacity-50 cursor-not-allowed'
          )}
        >
          {isSubmitting 
            ? (showCardGuarantee ? 'Reserving...' : isRequest ? 'Sending...' : 'Processing...')
            : (showCardGuarantee ? 'Reserve' : isRequest ? 'Send Request' : 'Book Now')
          }
        </button>
        
        <p className="text-xs text-center text-muted-foreground">
          {showCardGuarantee ? (
            <>
              By reserving, you agree to our terms of service and cancellation policy.
            </>
          ) : isRequest ? (
            <>
              By submitting, you agree to our terms of service and privacy policy.
              You won&apos;t be charged until the provider accepts and you complete payment.
            </>
          ) : (
            <>
              By booking, you agree to our terms of service and privacy policy.
              You&apos;ll be redirected to complete payment securely.
            </>
          )}
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
            hotelSlug={hotelSlug || 'experiences'}
            isRequest={isRequest}
            onClose={() => setShowDemoSuccess(false)}
            returnUrl={returnUrl}
          />
        )}
      </AnimatePresence>
    </>
  )
}
