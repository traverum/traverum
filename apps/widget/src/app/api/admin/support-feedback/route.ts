import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { verifyAdminAccess, jsonResponse, optionsResponse } from '@/app/api/admin/_lib/verifyAdminAccess'

export async function OPTIONS() {
  return optionsResponse()
}

export async function GET(request: NextRequest) {
  if (!(await verifyAdminAccess(request))) {
    return jsonResponse({ error: 'Unauthorized' }, 401)
  }

  const supabase = createAdminClient()

  const { data, error } = await (supabase.from('support_feedback') as any)
    .select('id, created_at, sender_email, message, status, partner_id, attachment_paths')
    .order('created_at', { ascending: false }) as { data: any[] | null; error: any }

  if (error) {
    console.error('Failed to fetch support feedback:', error)
    return jsonResponse({ error: 'Failed to fetch feedback' }, 500)
  }

  // Resolve partner names
  const partnerIds = Array.from(new Set((data || []).map((f: any) => f.partner_id).filter(Boolean))) as string[]
  let partnerMap: Record<string, string> = {}
  if (partnerIds.length > 0) {
    const { data: partners } = await supabase
      .from('partners')
      .select('id, name')
      .in('id', partnerIds) as { data: { id: string; name: string }[] | null }
    if (partners) {
      partnerMap = Object.fromEntries(partners.map((p) => [p.id, p.name]))
    }
  }

  const items = (data || []).map((f: any) => ({
    id: f.id,
    created_at: f.created_at,
    sender_email: f.sender_email,
    message_preview: f.message.length > 120 ? f.message.slice(0, 120) + '...' : f.message,
    status: f.status,
    partner_id: f.partner_id,
    partner_name: f.partner_id ? partnerMap[f.partner_id] ?? null : null,
    attachment_count: Array.isArray(f.attachment_paths) ? f.attachment_paths.length : 0,
  }))

  return jsonResponse(items)
}
