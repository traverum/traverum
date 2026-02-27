/**
 * Test script to send completion check email to supplier
 * Usage: node scripts/send-test-completion-email.js
 */

const { createClient } = require('@supabase/supabase-js')
const { Resend } = require('resend')
const { createHmac } = require('crypto')
const fs = require('fs')

// Read .env file manually
let SUPABASE_URL = ''
let SUPABASE_SERVICE_ROLE_KEY = ''
let RESEND_API_KEY = ''
let APP_URL = ''
let TOKEN_SECRET = ''

try {
  const envLocal = fs.existsSync('.env.local') ? fs.readFileSync('.env.local', 'utf8') : ''
  const env = fs.existsSync('.env') ? fs.readFileSync('.env', 'utf8') : ''
  const envContent = envLocal + '\n' + env
  
  const urlMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/)
  const keyMatch = envContent.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/)
  const resendMatch = envContent.match(/RESEND_API_KEY=(.+)/)
  const appUrlMatch = envContent.match(/NEXT_PUBLIC_APP_URL=(.+)/)
  const tokenMatch = envContent.match(/TOKEN_SECRET=(.+)/)
  
  if (urlMatch) SUPABASE_URL = urlMatch[1].trim()
  if (keyMatch) SUPABASE_SERVICE_ROLE_KEY = keyMatch[1].trim()
  if (resendMatch) RESEND_API_KEY = resendMatch[1].trim()
  if (appUrlMatch) APP_URL = appUrlMatch[1].trim()
  if (tokenMatch) TOKEN_SECRET = tokenMatch[1].trim()
} catch (e) {
  console.error('❌ Error: Could not read .env file')
  process.exit(1)
}

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required in .env')
  process.exit(1)
}

if (!RESEND_API_KEY) {
  console.error('❌ Error: RESEND_API_KEY required in .env')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
const resend = new Resend(RESEND_API_KEY)
const FROM_EMAIL = process.env.FROM_EMAIL || 'Veyond <bookings@veyond.eu>'

// Allow URL override via command line argument or use env var
// Usage: node scripts/send-test-completion-email.js http://localhost:3000
//        node scripts/send-test-completion-email.js https://traverum-v0-1-0-hotel-rosa.vercel.app
const args = process.argv.slice(2)
const appUrl = args[0] || APP_URL || 'http://localhost:3000'

// Token generation functions - must match what the server uses
const SECRET = TOKEN_SECRET || SUPABASE_SERVICE_ROLE_KEY || 'fallback-secret'

console.log('🔧 Configuration:')
console.log(`   App URL: ${appUrl}`)
console.log(`   Token Secret: ${TOKEN_SECRET ? '✅ Using TOKEN_SECRET' : SUPABASE_SERVICE_ROLE_KEY ? '✅ Using SUPABASE_SERVICE_ROLE_KEY' : '⚠️  Using fallback-secret'}`)
console.log('')

function signToken(payload) {
  const data = JSON.stringify(payload)
  const signature = createHmac('sha256', SECRET)
    .update(data)
    .digest('hex')
  
  const token = Buffer.from(JSON.stringify({ data, signature })).toString('base64url')
  return token
}

function generateCompleteToken(bookingId, expiresInDays = 14) {
  return signToken({
    id: bookingId,
    action: 'complete',
    exp: Date.now() + expiresInDays * 24 * 60 * 60 * 1000,
  })
}

function generateNoExperienceToken(bookingId, expiresInDays = 14) {
  return signToken({
    id: bookingId,
    action: 'no-experience',
    exp: Date.now() + expiresInDays * 24 * 60 * 60 * 1000,
  })
}

// Email formatting functions
function formatEmailDate(date) {
  return new Date(date).toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function formatEmailTime(time) {
  const [hours, minutes] = time.split(':')
  return `${hours}:${minutes}`
}

function formatEmailPrice(cents, currency = 'EUR') {
  return new Intl.NumberFormat('fi-FI', {
    style: 'currency',
    currency,
  }).format(cents / 100)
}

// Email template
function baseTemplate(content, title) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .card { background: white; border-radius: 12px; padding: 32px; margin: 20px 0; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .header { text-align: center; margin-bottom: 24px; }
    .header h1 { margin: 0; font-size: 24px; color: #111; }
    .info-box { background: #f8f9fa; border-radius: 8px; padding: 16px; margin: 20px 0; }
    .info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
    .info-row:last-child { border-bottom: none; }
    .info-label { color: #666; }
    .info-value { font-weight: 600; color: #111; }
    .btn { display: inline-block; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px; margin: 8px 4px; }
    .btn-success { background: #16a34a; color: white; }
    .btn-danger { background: #dc2626; color: white; }
    .footer { text-align: center; color: #666; font-size: 12px; margin-top: 24px; }
    .text-center { text-align: center; }
    .mt-4 { margin-top: 16px; }
    .text-muted { color: #666; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    ${content}
    <div class="footer">
      <p>Powered by Veyond</p>
    </div>
  </div>
</body>
</html>
`
}

function supplierCompletionCheck(data) {
  const content = `
    <div class="card">
      <div class="header">
        <h1>Did the experience happen?</h1>
      </div>
      <p>We hope your experience with ${data.guestName} went well!</p>
      
      <div class="info-box">
        <div class="info-row">
          <span class="info-label">Experience</span>
          <span class="info-value">${data.experienceTitle}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Date</span>
          <span class="info-value">${formatEmailDate(data.date)}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Guest</span>
          <span class="info-value">${data.guestName}</span>
        </div>
      </div>
      
      <p>Please confirm whether this experience took place:</p>
      
      <div class="text-center mt-4">
        <a href="${data.completeUrl}" class="btn btn-success">Yes, it happened</a>
        <a href="${data.noExperienceUrl}" class="btn btn-danger">No, it didn't</a>
      </div>
      
      <p class="text-muted text-center mt-4">If you confirm, payment will be transferred to your account. If you click "No", the guest will receive a full refund.</p>
    </div>
  `
  return baseTemplate(content, 'Confirm Experience')
}

async function sendTestCompletionEmail() {
  console.log('🔍 Finding the most recent confirmed booking...\n')

  // Get the most recent confirmed booking
  const { data: bookings, error } = await supabase
    .from('bookings')
    .select(`
      *,
      reservation:reservations(
        *,
        experience:experiences(
          title,
          currency,
          supplier:partners!experiences_partner_fk(email, name)
        ),
        session:experience_sessions(session_date, start_time)
      )
    `)
    .eq('booking_status', 'confirmed')
    .order('created_at', { ascending: false })
    .limit(1)

  if (error) {
    console.error('❌ Error fetching bookings:', error)
    process.exit(1)
  }

  if (!bookings || bookings.length === 0) {
    console.error('❌ No confirmed bookings found')
    process.exit(1)
  }

  const booking = bookings[0]
  const reservation = booking.reservation
  const session = reservation?.session
  const experience = reservation.experience
  const supplier = experience.supplier

  console.log('📦 Booking found:')
  console.log(`   Booking ID: ${booking.id}`)
  console.log(`   Experience: ${experience.title}`)
  console.log(`   Guest: ${reservation.guest_name}`)
  console.log(`   Date: ${session?.session_date || reservation.requested_date}`)
  console.log(`   Supplier: ${supplier.name} (${supplier.email})`)
  console.log('')

  // Override supplier email for testing
  const testEmail = 'elias.salmi@traverum.com'
  console.log(`📧 Sending completion check email to: ${testEmail}\n`)

  const experienceDate = session?.session_date || reservation.requested_date || ''
  const experienceTime = session?.start_time || reservation.requested_time || ''

  // Generate tokens
  const completeToken = generateCompleteToken(booking.id)
  const noExperienceToken = generateNoExperienceToken(booking.id)

  const completeUrl = `${appUrl}/api/bookings/${booking.id}/complete?token=${completeToken}`
  const noExperienceUrl = `${appUrl}/api/bookings/${booking.id}/no-experience?token=${noExperienceToken}`

  // Generate email HTML
  const emailHtml = supplierCompletionCheck({
    experienceTitle: experience.title,
    guestName: reservation.guest_name,
    date: experienceDate,
    time: experienceTime,
    participants: reservation.participants,
    totalCents: booking.amount_cents,
    currency: experience.currency,
    bookingId: booking.id,
    completeUrl,
    noExperienceUrl,
  })

  // Send email
  try {
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: testEmail,
      subject: `Did the experience happen? - ${experience.title}`,
      html: emailHtml,
    })

  console.log('✅ Email sent successfully!')
  console.log('')
  console.log('📋 Email details:')
  console.log(`   To: ${testEmail}`)
  console.log(`   Subject: Did the experience happen? - ${experience.title}`)
  console.log(`   Complete URL: ${completeUrl}`)
  console.log(`   No Experience URL: ${noExperienceUrl}`)
  console.log(`   Resend ID: ${result.data?.id || 'N/A'}`)
  console.log('')
  console.log('💡 Debug info:')
  console.log(`   Token Secret Length: ${SECRET.length} chars`)
  console.log(`   Token Secret Preview: ${SECRET.substring(0, 10)}...`)
  console.log(`   Booking ID: ${booking.id}`)
  console.log(`   Token Action: complete / no-experience`)
  console.log('')
  console.log('⚠️  If you get "Invalid or expired token" error:')
  console.log('   1. Make sure TOKEN_SECRET in your .env matches the deployed app')
  console.log('   2. For Vercel: Check Environment Variables in Vercel dashboard')
  console.log('   3. For localhost: Make sure .env.local has the same TOKEN_SECRET')
  } catch (err) {
    console.error('❌ Error sending email:', err)
    process.exit(1)
  }
}

sendTestCompletionEmail().catch(console.error)
