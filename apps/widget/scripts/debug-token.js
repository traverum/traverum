/**
 * Debug script to test token generation and verification
 * Usage: node scripts/debug-token.js <booking-id>
 */

const { createHmac, timingSafeEqual } = require('crypto')
const fs = require('fs')

// Read .env file
let TOKEN_SECRET = ''
let SUPABASE_SERVICE_ROLE_KEY = ''

try {
  const envLocal = fs.existsSync('.env.local') ? fs.readFileSync('.env.local', 'utf8') : ''
  const env = fs.existsSync('.env') ? fs.readFileSync('.env', 'utf8') : ''
  const envContent = envLocal + '\n' + env
  
  const tokenMatch = envContent.match(/TOKEN_SECRET=(.+)/)
  const keyMatch = envContent.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/)
  
  if (tokenMatch) TOKEN_SECRET = tokenMatch[1].trim()
  if (keyMatch) SUPABASE_SERVICE_ROLE_KEY = keyMatch[1].trim()
} catch (e) {
  console.error('❌ Error reading .env file')
  process.exit(1)
}

const SECRET = TOKEN_SECRET || SUPABASE_SERVICE_ROLE_KEY || 'fallback-secret'

console.log('🔍 Token Debug Info:')
console.log(`   TOKEN_SECRET: ${TOKEN_SECRET ? `✅ Set (${TOKEN_SECRET.length} chars)` : '❌ Not set'}`)
console.log(`   SUPABASE_SERVICE_ROLE_KEY: ${SUPABASE_SERVICE_ROLE_KEY ? `✅ Set (${SUPABASE_SERVICE_ROLE_KEY.length} chars)` : '❌ Not set'}`)
console.log(`   Using SECRET: ${SECRET.substring(0, 10)}... (${SECRET.length} chars)`)
console.log('')

// Test token generation
const bookingId = process.argv[2] || 'test-booking-id'
const action = 'complete'
const exp = Date.now() + 14 * 24 * 60 * 60 * 1000

const payload = { id: bookingId, action, exp }
const data = JSON.stringify(payload)
const signature = createHmac('sha256', SECRET)
  .update(data)
  .digest('hex')

const token = Buffer.from(JSON.stringify({ data, signature })).toString('base64url')

console.log('📝 Generated Token:')
console.log(`   Booking ID: ${bookingId}`)
console.log(`   Action: ${action}`)
console.log(`   Expires: ${new Date(exp).toISOString()}`)
console.log(`   Token: ${token}`)
console.log('')

// Test token verification
console.log('🔐 Verifying token...')
try {
  const decoded = JSON.parse(Buffer.from(token, 'base64url').toString())
  const { data: decodedData, signature: decodedSignature } = decoded
  
  const expectedSignature = createHmac('sha256', SECRET)
    .update(decodedData)
    .digest('hex')
  
  const signatureMatch = timingSafeEqual(
    Buffer.from(decodedSignature), 
    Buffer.from(expectedSignature)
  )
  
  if (!signatureMatch) {
    console.log('❌ Signature verification FAILED')
    console.log(`   Expected: ${expectedSignature.substring(0, 20)}...`)
    console.log(`   Got:      ${decodedSignature.substring(0, 20)}...`)
  } else {
    console.log('✅ Signature verification PASSED')
  }
  
  const payloadData = JSON.parse(decodedData)
  const isExpired = payloadData.exp < Date.now()
  
  if (isExpired) {
    console.log('❌ Token is EXPIRED')
  } else {
    console.log('✅ Token is VALID')
  }
  
  console.log('')
  console.log('💡 If verification fails on server:')
  console.log('   1. Check TOKEN_SECRET in Vercel Environment Variables')
  console.log('   2. Make sure it matches your local .env file')
  console.log('   3. Redeploy after changing environment variables')
  
} catch (err) {
  console.error('❌ Token verification error:', err.message)
}
