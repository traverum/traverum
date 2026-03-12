/**
 * One-off: Add alessio.garzonio@traverum.com as owner in every partner org.
 *
 * Usage (from apps/widget; ensure .env.local has Supabase URL and service role key):
 *   pnpm run fix-cofounder-email
 *   pnpm run fix-cofounder-email -- --dry-run
 *
 * What it does:
 *   1. Finds or creates the Auth user for alessio.garzonio@traverum.com.
 *   2. Ensures a public.users row exists for that user.
 *   3. Adds that user as 'owner' in every partner org (skips if already a member).
 */

import { createClient } from '@supabase/supabase-js'

const EMAIL = 'alessio.garzonio@traverum.com'
const TEMP_PASSWORD = 'changeme-' + Math.random().toString(36).slice(2, 10)

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const dryRun = process.argv.includes('--dry-run')

if (!url || !serviceRoleKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

async function main() {
  console.log(`Add ${EMAIL} as owner in every partner org`)
  console.log('—')
  if (dryRun) console.log('DRY RUN (no changes will be made)\n')

  // 1) Find or create Auth user
  let authId: string

  const { data: listData } = await supabase.auth.admin.listUsers()
  const existingAuth = listData?.users?.find(
    (u) => u.email?.toLowerCase() === EMAIL.toLowerCase()
  )

  if (existingAuth) {
    authId = existingAuth.id
    console.log(`Auth user already exists: ${authId}`)
  } else if (dryRun) {
    console.log('[dry-run] Would create Auth user for', EMAIL)
    console.log('[dry-run] Cannot continue without a real user ID. Exiting.')
    return
  } else {
    const { data: newAuth, error: createErr } = await supabase.auth.admin.createUser({
      email: EMAIL,
      password: TEMP_PASSWORD,
      email_confirm: true,
    })
    if (createErr || !newAuth?.user) {
      console.error('Failed to create Auth user:', createErr)
      process.exit(1)
    }
    authId = newAuth.user.id
    console.log(`Created Auth user: ${authId}`)
    console.log(`Temporary password: ${TEMP_PASSWORD}  (change on first login!)`)
    await new Promise((r) => setTimeout(r, 500))
  }

  // 2) Ensure public.users row exists
  let { data: appUser } = await supabase
    .from('users')
    .select('id')
    .eq('auth_id', authId)
    .maybeSingle() as { data: { id: string } | null }

  if (!appUser) {
    if (dryRun) {
      console.log('[dry-run] Would create public.users row')
      return
    }
    const { data: inserted, error: insertErr } = await (supabase
      .from('users') as any)
      .insert({ auth_id: authId, email: EMAIL })
      .select('id')
      .single() as { data: { id: string } | null; error: unknown }
    if (insertErr || !inserted) {
      console.error('Failed to create public.users row:', insertErr)
      process.exit(1)
    }
    appUser = inserted
    console.log(`Created public.users row: ${appUser!.id}`)
  } else {
    console.log(`public.users row exists: ${appUser.id}`)
  }

  const userId = appUser!.id

  // 3) Get all partner orgs
  const { data: partners, error: partnersErr } = await supabase
    .from('partners')
    .select('id, name') as { data: { id: string; name: string }[] | null; error: unknown }

  if (partnersErr || !partners?.length) {
    console.log('No partners found (or error).', partnersErr)
    return
  }

  console.log(`\nTotal partner orgs: ${partners.length}\n`)

  // 4) Get existing memberships for this user
  const { data: existing } = await supabase
    .from('user_partners')
    .select('partner_id')
    .eq('user_id', userId) as { data: { partner_id: string }[] | null }

  const alreadyIn = new Set((existing || []).map((e) => e.partner_id))

  let added = 0
  let skipped = 0

  for (const partner of partners) {
    if (alreadyIn.has(partner.id)) {
      console.log(`  ${partner.name}: already a member, skip`)
      skipped++
      continue
    }

    if (dryRun) {
      console.log(`  ${partner.name}: would add as owner`)
      added++
      continue
    }

    const { error: insertErr } = await (supabase
      .from('user_partners') as any)
      .insert({
        user_id: userId,
        partner_id: partner.id,
        role: 'owner',
        is_default: false,
      })

    if (insertErr) {
      console.error(`  ${partner.name}: failed to add —`, insertErr)
    } else {
      console.log(`  ${partner.name}: added as owner`)
      added++
    }
  }

  console.log(`\nDone. Added: ${added}, Already member: ${skipped}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
