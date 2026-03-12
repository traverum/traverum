import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createAdminClient } from '@/lib/supabase/server'
import { resend } from '@/lib/email/index'
import type { Database } from '@/lib/supabase/types'
import { randomUUID } from 'crypto'

const SUPPORT_EMAIL = 'info@traverum.com'
const FROM_EMAIL = process.env.FROM_EMAIL || 'Veyond <bookings@veyond.eu>'
const ADMIN_URL = 'https://admin.veyond.eu'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export const dynamic = 'force-dynamic'

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS })
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing authorization' }, { status: 401, headers: CORS_HEADERS })
    }

    const token = authHeader.replace('Bearer ', '')
    const userClient = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: { get: () => undefined, set: () => {}, remove: () => {} },
        global: {
          headers: { Authorization: `Bearer ${token}` },
        },
      }
    )

    const { data: { user }, error: authError } = await userClient.auth.getUser()
    if (authError || !user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: CORS_HEADERS })
    }

    const formData = await request.formData()
    const message = formData.get('message')
    if (!message || typeof message !== 'string' || !message.trim()) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400, headers: CORS_HEADERS })
    }

    const supabase = createAdminClient()

    // Resolve app user_id
    const { data: appUser } = await supabase
      .from('users')
      .select('id')
      .eq('auth_id', user.id)
      .single() as { data: { id: string } | null }

    // Resolve first partner_id (best-effort context)
    let partnerId: string | null = null
    if (appUser) {
      const { data: up } = await (supabase.from('user_partners') as any)
        .select('partner_id')
        .eq('user_id', appUser.id)
        .limit(1)
        .single() as { data: { partner_id: string } | null }
      partnerId = up?.partner_id ?? null
    }

    // Insert feedback row
    const { data: feedbackRow, error: insertError } = await (supabase.from('support_feedback') as any)
      .insert({
        sender_email: user.email,
        user_id: appUser?.id ?? null,
        partner_id: partnerId,
        message: message.trim(),
        status: 'new',
        attachment_paths: [],
      })
      .select('id')
      .single() as { data: { id: string } | null; error: any }

    if (insertError || !feedbackRow) {
      console.error('Failed to insert support_feedback:', insertError)
      return NextResponse.json({ error: 'Failed to save feedback' }, { status: 500, headers: CORS_HEADERS })
    }

    const feedbackId = feedbackRow.id

    // Process attachments
    const attachmentFiles = formData.getAll('attachments').filter((f): f is File => f instanceof File && f.size > 0)
    const attachmentPaths: { storage_path: string; filename: string }[] = []
    const emailAttachments: { filename: string; content: Buffer }[] = []

    for (const file of attachmentFiles) {
      const arrayBuffer = await file.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)
      const safeName = (file.name || 'file').replace(/[^a-zA-Z0-9._-]/g, '_')
      const storagePath = `support-feedback/${feedbackId}/${randomUUID()}_${safeName}`

      const { error: uploadError } = await supabase.storage
        .from('traverum-assets')
        .upload(storagePath, buffer, {
          contentType: file.type || 'application/octet-stream',
          upsert: false,
        })

      if (uploadError) {
        console.error('Failed to upload attachment:', uploadError)
        continue
      }

      attachmentPaths.push({ storage_path: storagePath, filename: file.name || safeName })
      emailAttachments.push({ filename: file.name || safeName, content: buffer })
    }

    // Update attachment_paths if any were uploaded
    if (attachmentPaths.length > 0) {
      await (supabase.from('support_feedback') as any)
        .update({ attachment_paths: attachmentPaths })
        .eq('id', feedbackId)
    }

    // Send email notification
    const html = `
      <p><strong>From:</strong> ${user.email}</p>
      <p><strong>Message:</strong></p>
      <p>${message.trim().replace(/\n/g, '<br>')}</p>
      <hr>
      <p style="font-size:12px;color:#999;">
        <a href="${ADMIN_URL}/support-feedback">View in admin panel</a>
      </p>
    `

    const payload: Parameters<typeof resend.emails.send>[0] = {
      from: FROM_EMAIL,
      to: SUPPORT_EMAIL,
      reply_to: user.email,
      subject: 'Dashboard support request',
      html,
    }
    if (emailAttachments.length > 0) {
      payload.attachments = emailAttachments
    }

    const result = await resend.emails.send(payload)
    if (result.error) {
      console.error('Support email send error (feedback saved):', result.error)
    }

    return NextResponse.json({ success: true }, { headers: CORS_HEADERS })
  } catch (err) {
    console.error('Support API error:', err)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500, headers: CORS_HEADERS })
  }
}
