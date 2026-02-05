/**
 * Test script for triggering a transfer
 * 
 * Usage:
 *   npx tsx scripts/test-transfer.ts
 * 
 * Prerequisites:
 *   - Dev server running (npm run dev)
 *   - Valid booking ID
 */

import { createHmac } from 'crypto'

// Configuration
const BOOKING_ID = '8378235c-e160-4f61-bd1d-e974943f7835'
const BASE_URL = 'http://localhost:3000'

// Use the same secret as the app (from .env)
const SECRET = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.TOKEN_SECRET || ''

if (!SECRET) {
  console.error('❌ Error: Set SUPABASE_SERVICE_ROLE_KEY or TOKEN_SECRET environment variable')
  console.log('\nRun with:')
  console.log('  SUPABASE_SERVICE_ROLE_KEY=your_key npx tsx scripts/test-transfer.ts')
  process.exit(1)
}

// Generate token (same logic as src/lib/tokens.ts)
function generateCompleteToken(bookingId: string): string {
  const payload = {
    id: bookingId,
    action: 'complete',
    exp: Date.now() + 14 * 24 * 60 * 60 * 1000, // 14 days
  }
  
  const data = JSON.stringify(payload)
  const signature = createHmac('sha256', SECRET)
    .update(data)
    .digest('hex')
  
  return Buffer.from(JSON.stringify({ data, signature })).toString('base64url')
}

const token = generateCompleteToken(BOOKING_ID)
const completeUrl = `${BASE_URL}/api/bookings/${BOOKING_ID}/complete?token=${token}`

console.log('🔄 Transfer Test for Booking')
console.log('━'.repeat(50))
console.log(`Booking ID: ${BOOKING_ID}`)
console.log(`Amount: €136.00 (supplier share)`)
console.log('')
console.log('📋 Complete URL:')
console.log(completeUrl)
console.log('')
console.log('🧪 To test, either:')
console.log('  1. Open the URL in your browser')
console.log('  2. Or run: curl "' + completeUrl + '"')
console.log('')
console.log('✅ Expected result:')
console.log('  - Booking status → "completed"')
console.log('  - Transfer created in Stripe')
console.log('  - Email sent to supplier')
