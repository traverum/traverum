/**
 * Check why completion check email wasn't sent
 * Run: node scripts/check-completion-email.js
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const { format, subDays } = require('date-fns');

// Read .env file manually
let SUPABASE_URL = '';
let SUPABASE_SERVICE_ROLE_KEY = '';
try {
  const envContent = fs.readFileSync('.env', 'utf8');
  const urlMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/);
  const keyMatch = envContent.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/);
  if (urlMatch) SUPABASE_URL = urlMatch[1].trim();
  if (keyMatch) SUPABASE_SERVICE_ROLE_KEY = keyMatch[1].trim();
} catch (e) {
  console.error('❌ Error: Could not read .env file');
  process.exit(1);
}

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required in .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function checkBookings() {
  console.log('🔍 Checking bookings for completion check email...\n');
  
  const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd');
  console.log(`📅 Looking for bookings with session_date = ${yesterday}\n`);
  
  // Get all confirmed bookings
  const { data: bookings, error } = await supabase
    .from('bookings')
    .select(`
      id,
      booking_status,
      amount_cents,
      reservation:reservations(
        id,
        guest_name,
        session_id,
        requested_date,
        experience:experiences(
          title,
          supplier:partners!experiences_partner_fk(
            name,
            email
          )
        ),
        session:experience_sessions(
          session_date,
          start_time
        )
      )
    `)
    .eq('booking_status', 'confirmed');
  
  if (error) {
    console.error('❌ Error fetching bookings:', error);
    return;
  }
  
  console.log(`📊 Found ${bookings?.length || 0} confirmed bookings\n`);
  
  if (!bookings || bookings.length === 0) {
    console.log('⚠️  No confirmed bookings found.');
    return;
  }
  
  let foundMatch = false;
  
  for (const booking of bookings) {
    const reservation = booking.reservation;
    const session = reservation?.session;
    const experienceDate = session?.session_date || reservation?.requested_date;
    
    console.log(`\n📦 Booking ${booking.id}:`);
    console.log(`   Status: ${booking.booking_status}`);
    console.log(`   Experience Date: ${experienceDate || 'N/A'}`);
    console.log(`   Yesterday: ${yesterday}`);
    console.log(`   Match: ${experienceDate === yesterday ? '✅ YES' : '❌ NO'}`);
    
    if (experienceDate === yesterday) {
      foundMatch = true;
      const supplier = reservation.experience?.supplier;
      console.log(`   Supplier: ${supplier?.name || 'N/A'}`);
      console.log(`   Supplier Email: ${supplier?.email || '❌ MISSING'}`);
      console.log(`   Experience: ${reservation.experience?.title || 'N/A'}`);
    }
  }
  
  if (!foundMatch) {
    console.log(`\n⚠️  No bookings found with session_date = ${yesterday}`);
    console.log(`\n💡 To test, update a session date to yesterday:`);
    console.log(`   UPDATE experience_sessions SET session_date = CURRENT_DATE - INTERVAL '1 day' WHERE id = 'YOUR_SESSION_ID';`);
  } else {
    console.log(`\n✅ Found matching booking! Try calling the cron endpoint:`);
    console.log(`   curl http://localhost:3000/api/cron/completion-check`);
  }
}

checkBookings().catch(console.error);
