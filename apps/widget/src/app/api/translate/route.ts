import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { translateExperienceContent } from '@/lib/translate'

interface ExperienceFields {
  id: string
  title: string
  description: string
  meeting_point: string | null
  updated_at: string | null
}

interface CachedTranslation {
  title: string
  description: string
  meeting_point: string | null
  source_updated_at: string
}

export async function POST(request: NextRequest) {
  try {
    const { experienceId, targetLanguage } = await request.json()

    if (!experienceId || !targetLanguage) {
      return NextResponse.json(
        { error: 'experienceId and targetLanguage are required' },
        { status: 400 },
      )
    }

    if (typeof targetLanguage !== 'string' || targetLanguage.length > 10) {
      return NextResponse.json({ error: 'Invalid targetLanguage' }, { status: 400 })
    }

    const supabase = createAdminClient()

    const { data: experience } = await supabase
      .from('experiences')
      .select('id, title, description, meeting_point, updated_at')
      .eq('id', experienceId)
      .single() as { data: ExperienceFields | null }

    if (!experience) {
      return NextResponse.json({ error: 'Experience not found' }, { status: 404 })
    }

    const { data: cached } = await (supabase
      .from('content_translations' as any) as any)
      .select('title, description, meeting_point, source_updated_at')
      .eq('experience_id', experienceId)
      .eq('language', targetLanguage)
      .single() as { data: CachedTranslation | null }

    if (cached && cached.source_updated_at === experience.updated_at) {
      return NextResponse.json({
        title: cached.title,
        description: cached.description,
        meetingPoint: cached.meeting_point,
        cached: true,
      })
    }

    const translated = await translateExperienceContent(
      experience.title,
      experience.description,
      experience.meeting_point,
      targetLanguage,
    )

    await (supabase
      .from('content_translations' as any) as any)
      .upsert(
        {
          experience_id: experienceId,
          language: targetLanguage,
          title: translated.title,
          description: translated.description,
          meeting_point: translated.meetingPoint,
          source_updated_at: experience.updated_at,
        },
        { onConflict: 'experience_id,language' },
      )

    return NextResponse.json({
      title: translated.title,
      description: translated.description,
      meetingPoint: translated.meetingPoint,
      cached: false,
    })
  } catch (error) {
    console.error('Translation error:', error)
    return NextResponse.json(
      { error: 'Translation failed' },
      { status: 500 },
    )
  }
}
