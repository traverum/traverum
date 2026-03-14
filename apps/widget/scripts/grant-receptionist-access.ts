/**
 * Grant receptionist access to a relevant user and hotel.
 *
 * Picks the first user in public.users (by created_at) and the first hotel
 * that has a hotel_config with location set (so "Recommended" and "All Nearby" work).
 * If no hotel has location, uses the first hotel with any config.
 *
 * Usage (from repo root or apps/widget; ensure .env has Supabase URL and service role key):
 *   pnpm --filter @traverum/widget run grant-receptionist
 *   pnpm --filter @traverum/widget run grant-receptionist -- --dry-run
 *
 * Or from apps/widget:
 * Or with a specific email and/or hotel:
 *   pnpm run grant-receptionist -- --email user@example.com
 *   pnpm run grant-receptionist -- --email user@example.com --hotel-slug test-hotel-001
 */

import { readFileSync, existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { createClient } from '@supabase/supabase-js'

function loadEnv(dir: string) {
  for (const name of ['.env', '.env.local']) {
    const p = resolve(dir, name)
    if (!existsSync(p)) continue
    const lines = readFileSync(p, 'utf8').split(/\r?\n/)
    for (const line of lines) {
      const m = line.match(/^([^#=]+)=(.*)$/)
      if (m) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, '')
    }
    return
  }
}
try {
  const dir = typeof __dirname !== 'undefined' ? __dirname : dirname(fileURLToPath(import.meta.url))
  loadEnv(resolve(dir, '..'))
} catch {
  loadEnv(process.cwd())
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const dryRun = process.argv.includes('--dry-run')
const emailIdx = process.argv.indexOf('--email')
const emailArg = emailIdx >= 0 ? process.argv[emailIdx + 1] : undefined
const hotelSlugIdx = process.argv.indexOf('--hotel-slug')
const hotelSlugArg = hotelSlugIdx >= 0 ? process.argv[hotelSlugIdx + 1] : undefined

if (!url || !serviceRoleKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY (use .env or set in shell)')
  process.exit(1)
}

const supabase = createClient(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

async function main() {
  console.log('Grant receptionist access to a relevant user')
  console.log('—')
  if (dryRun) console.log('DRY RUN (no changes will be made)\n')

  // 1) Pick a user: prefer one that doesn't already have receptionist
  const { data: allUsers, error: usersErr } = await supabase
    .from('users')
    .select('id, email, created_at')
    .order('created_at', { ascending: true })

  if (usersErr || !allUsers?.length) {
    console.error('No users in public.users (or error).', usersErr)
    process.exit(1)
  }

  const { data: existingReceptionists } = await supabase
    .from('user_partners')
    .select('user_id')
    .in('role', ['receptionist', 'owner', 'admin'])

  const alreadyHasAccess = new Set((existingReceptionists || []).map((r) => r.user_id))
  let candidate: { id: string; email: string }
  if (emailArg) {
    let byEmail = allUsers.find((u) => u.email?.toLowerCase() === emailArg.toLowerCase())
    if (!byEmail && !dryRun) {
      const { data: authUsers } = await supabase.auth.admin.listUsers()
      const authUser = authUsers?.users?.find((u) => u.email?.toLowerCase() === emailArg.toLowerCase())
      if (authUser?.id) {
        const { data: inserted, error: insertErr } = await supabase
          .from('users')
          .insert({ auth_id: authUser.id, email: authUser.email ?? emailArg })
          .select('id, email')
          .single()
        if (!insertErr && inserted) {
          byEmail = inserted
          console.log('  (created public.users row from auth)')
        }
      }
    }
    if (!byEmail) {
      console.error(`No user found with email "${emailArg}". Ensure they have signed up at /receptionist/login (or exist in public.users).`)
      process.exit(1)
    }
    candidate = byEmail
  } else {
    candidate = allUsers.find((u) => !alreadyHasAccess.has(u.id)) ?? allUsers[0]
  }
  console.log(`User: ${candidate.email} (id: ${candidate.id})`)
  if (alreadyHasAccess.has(candidate.id)) {
    console.log('  (already has receptionist/owner/admin; will update hotel_config_id if needed)')
  }

  // 2) Pick a hotel: by slug if provided, else first with location (for "All Nearby")
  type Row = { id: string; name: string; hotel_configs: { id: string; slug: string; location: unknown }[] | null }
  let hotelRow: Row
  let hotelConfig: { id: string; slug: string }

  if (hotelSlugArg) {
    const { data: configBySlug, error: slugErr } = await supabase
      .from('hotel_configs')
      .select('id, slug, partner_id')
      .eq('slug', hotelSlugArg)
      .limit(1)
      .maybeSingle()
    if (slugErr || !configBySlug) {
      console.error(`Hotel with slug "${hotelSlugArg}" not found.`, slugErr ?? '')
      if (emailArg) {
        console.log('Removing existing receptionist-at-hotel links for this user (so Tiche etc. are unlinked).')
        if (!dryRun) {
          const { data: hotelPartners } = await supabase.from('partners').select('id').eq('partner_type', 'hotel')
          const hotelIds = (hotelPartners || []).map((p) => p.id)
          if (hotelIds.length) {
            await supabase
              .from('user_partners')
              .delete()
              .eq('user_id', candidate.id)
              .eq('role', 'receptionist')
              .in('partner_id', hotelIds)
          }
          console.log('Done. Run again with the correct --hotel-slug once that hotel exists in the DB.')
        }
      }
      process.exit(1)
    }
    const { data: partnerRow } = await supabase
      .from('partners')
      .select('id, name')
      .eq('id', (configBySlug as { partner_id: string }).partner_id)
      .single()
    if (!partnerRow) {
      console.error('Partner for that hotel_config not found.')
      process.exit(1)
    }
    hotelRow = { id: partnerRow.id, name: partnerRow.name, hotel_configs: [{ id: configBySlug.id, slug: configBySlug.slug, location: null }] }
    hotelConfig = { id: configBySlug.id, slug: configBySlug.slug }
  } else {
    const { data: hotelsWithConfig, error: hotelsErr } = await supabase
      .from('partners')
      .select(`
        id,
        name,
        hotel_configs (
          id,
          slug,
          location
        )
      `)
      .eq('partner_type', 'hotel')

    if (hotelsErr || !hotelsWithConfig?.length) {
      console.error('No hotel partners (or error).', hotelsErr)
      process.exit(1)
    }

    const rows = hotelsWithConfig as Row[]
    const withLocation = rows.find((r) => r.hotel_configs?.[0] && (r.hotel_configs[0] as { location?: unknown }).location != null)
    hotelRow = withLocation ?? rows[0]
    const cfg = hotelRow.hotel_configs?.[0]
    if (!cfg) {
      console.error('No hotel_config found for any hotel.')
      process.exit(1)
    }
    hotelConfig = cfg
  }

  console.log(`Hotel: ${hotelRow.name} (slug: ${hotelConfig.slug}, config_id: ${hotelConfig.id})`)

  if (dryRun) {
    console.log('\n[dry-run] Would upsert user_partners: role=receptionist, hotel_config_id=', hotelConfig.id)
    if (emailArg && hotelSlugArg) {
      console.log('[dry-run] Would remove other receptionist-at-hotel memberships for this user first.')
    }
    return
  }

  // When assigning a specific hotel by slug, remove any other receptionist-at-hotel memberships for this user
  if (emailArg && hotelSlugArg) {
    const { data: hotelPartners } = await supabase.from('partners').select('id').eq('partner_type', 'hotel')
    const hotelIds = (hotelPartners || []).map((p) => p.id)
    if (hotelIds.length) {
      const { error: delErr } = await supabase
        .from('user_partners')
        .delete()
        .eq('user_id', candidate.id)
        .eq('role', 'receptionist')
        .in('partner_id', hotelIds)
      if (delErr) {
        console.error('Failed to remove existing receptionist links:', delErr)
        process.exit(1)
      }
      console.log('Removed existing receptionist-at-hotel links for this user.')
    }
  }

  // 3) Upsert user_partners (hotel_config_id may be missing from generated types)
  const { error: upsertErr } = await supabase
    .from('user_partners')
    .upsert(
      {
        user_id: candidate.id,
        partner_id: hotelRow.id,
        role: 'receptionist',
        hotel_config_id: hotelConfig.id,
        is_default: true,
      } as Record<string, unknown>,
      { onConflict: 'user_id,partner_id' }
    )

  if (upsertErr) {
    console.error('Upsert failed:', upsertErr)
    process.exit(1)
  }

  console.log('\nDone. Log in at /receptionist/login with', candidate.email, 'to use the receptionist tool.')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
