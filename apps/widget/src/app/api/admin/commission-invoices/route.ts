import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { verifyAdminAccess, jsonResponse, optionsResponse } from '@/app/api/admin/_lib/verifyAdminAccess'

export async function OPTIONS() {
  return optionsResponse()
}

/**
 * GET — List all commission invoices with partner names.
 * Supports optional query params: ?status=sent&partnerId=xxx
 */
export async function GET(request: NextRequest) {
  if (!await verifyAdminAccess(request)) {
    return jsonResponse({ error: 'Unauthorized' }, 401)
  }

  const supabase = createAdminClient()
  const { searchParams } = new URL(request.url)
  const statusFilter = searchParams.get('status')
  const partnerIdFilter = searchParams.get('partnerId')

  let query = supabase
    .from('commission_invoices')
    .select('*')
    .order('created_at', { ascending: false })

  if (statusFilter) {
    query = query.eq('status', statusFilter)
  }
  if (partnerIdFilter) {
    query = query.eq('partner_id', partnerIdFilter)
  }

  const { data: invoices, error: invoicesErr } = await query

  if (invoicesErr) {
    console.error('Error fetching commission invoices:', invoicesErr)
    return jsonResponse({ error: 'Database error' }, 500)
  }

  // Enrich with partner names
  const partnerIds = Array.from(new Set((invoices || []).map((i: any) => i.partner_id)))

  let partnerMap = new Map<string, string>()
  if (partnerIds.length > 0) {
    const { data: partners } = await supabase
      .from('partners')
      .select('id, name')
      .in('id', partnerIds)

    if (partners) {
      partnerMap = new Map(partners.map((p: any) => [p.id, p.name]))
    }
  }

  const enriched = (invoices || []).map((inv: any) => ({
    ...inv,
    partner_name: partnerMap.get(inv.partner_id) || 'Unknown',
  }))

  return jsonResponse({ invoices: enriched })
}
