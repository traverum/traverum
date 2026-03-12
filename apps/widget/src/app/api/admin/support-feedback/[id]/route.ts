import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { verifyAdminAccess, jsonResponse, optionsResponse } from '@/app/api/admin/_lib/verifyAdminAccess'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function OPTIONS() {
  return optionsResponse()
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  if (!(await verifyAdminAccess(request))) {
    return jsonResponse({ error: 'Unauthorized' }, 401)
  }

  const { id } = await params
  const supabase = createAdminClient()

  const { data, error } = await (supabase.from('support_feedback') as any)
    .select('*')
    .eq('id', id)
    .single() as { data: any | null; error: any }

  if (error || !data) {
    return jsonResponse({ error: 'Feedback not found' }, 404)
  }

  // Resolve partner name
  let partnerName: string | null = null
  if (data.partner_id) {
    const { data: partner } = await supabase
      .from('partners')
      .select('name')
      .eq('id', data.partner_id)
      .single() as { data: { name: string } | null }
    partnerName = partner?.name ?? null
  }

  // Generate signed URLs for attachments
  const attachments: { filename: string; storage_path: string; url: string | null }[] = []
  if (Array.isArray(data.attachment_paths)) {
    for (const att of data.attachment_paths as { storage_path: string; filename: string }[]) {
      const { data: signedData } = await supabase.storage
        .from('traverum-assets')
        .createSignedUrl(att.storage_path, 3600)

      attachments.push({
        filename: att.filename,
        storage_path: att.storage_path,
        url: signedData?.signedUrl ?? null,
      })
    }
  }

  return jsonResponse({
    id: data.id,
    created_at: data.created_at,
    sender_email: data.sender_email,
    user_id: data.user_id,
    partner_id: data.partner_id,
    partner_name: partnerName,
    message: data.message,
    status: data.status,
    attachments,
  })
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  if (!(await verifyAdminAccess(request))) {
    return jsonResponse({ error: 'Unauthorized' }, 401)
  }

  const { id } = await params
  const body = await request.json()
  const { status } = body

  if (!status || !['new', 'read', 'replied'].includes(status)) {
    return jsonResponse({ error: 'Invalid status' }, 400)
  }

  const supabase = createAdminClient()

  const { data, error } = await (supabase.from('support_feedback') as any)
    .update({ status })
    .eq('id', id)
    .select('id, status')
    .single() as { data: any | null; error: any }

  if (error || !data) {
    return jsonResponse({ error: 'Failed to update' }, 500)
  }

  return jsonResponse(data)
}
