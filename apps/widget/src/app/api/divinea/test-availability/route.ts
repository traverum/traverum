import { NextRequest, NextResponse } from 'next/server'
import { getSupplier, getAvailabilityExtended } from '@/lib/divinea'
import { format, addDays } from 'date-fns'

function verifyCronSecret(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) return true
  return authHeader === `Bearer ${cronSecret}`
}

export async function GET(request: NextRequest) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const productId = searchParams.get('productId')
  const optionId = searchParams.get('optionId') || null
  const days = parseInt(searchParams.get('days') || '30', 10)

  try {
    if (!productId) {
      const supplier = await getSupplier()
      return NextResponse.json({
        message: 'No productId provided — returning supplier info as connectivity test',
        supplier,
      })
    }

    const today = format(new Date(), 'yyyy-MM-dd')
    const endDate = format(addDays(new Date(), days), 'yyyy-MM-dd')

    const slots = await getAvailabilityExtended(productId, optionId, today, endDate)

    return NextResponse.json({
      productId,
      optionId,
      range: { from: today, to: endDate },
      totalSlots: slots.length,
      activeSlots: slots.filter(s => s.active && s.availableSeats > 0).length,
      slots,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('DiVinea test-availability error:', message)
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
