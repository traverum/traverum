import { NextResponse } from 'next/server'
import { getAllActiveExperiences } from '@/lib/hotels'
import { getPriceDisplay } from '@/lib/pricing'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const allExperiences = await getAllActiveExperiences()

    const experiences = allExperiences.map((exp) => {
      const price = getPriceDisplay(exp)
      return {
        slug: exp.slug,
        title: exp.title,
        coverImage: exp.coverImage,
        duration_minutes: exp.duration_minutes,
        startingPriceCents: price.amount,
        currency: exp.currency ?? 'EUR',
        tags: exp.tags ?? [],
      }
    })

    return NextResponse.json(
      { experiences },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
        },
      }
    )
  } catch (error) {
    console.error('Public experiences API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch experiences' },
      { status: 500 }
    )
  }
}
