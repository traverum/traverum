/**
 * Generate a fresh complete token for testing
 * Usage: node scripts/generate-complete-token.js <booking-id>
 */

const crypto = require('crypto');
const fs = require('fs');

// Read .env file manually
let SECRET = '';
try {
  const envContent = fs.readFileSync('.env', 'utf8');
  
  // Match server priority: TOKEN_SECRET first, then SUPABASE_SERVICE_ROLE_KEY
  const tokenMatch = envContent.match(/TOKEN_SECRET=(.+)/);
  if (tokenMatch) {
    SECRET = tokenMatch[1].trim();
    console.log('✅ Using TOKEN_SECRET from .env');
  } else {
    const match = envContent.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/);
    if (match) {
      SECRET = match[1].trim();
      console.log('✅ Using SUPABASE_SERVICE_ROLE_KEY from .env');
    }
  }
} catch (e) {
  console.error('❌ Error: Could not read .env file');
  process.exit(1);
}

if (!SECRET) {
  console.error('❌ Error: TOKEN_SECRET or SUPABASE_SERVICE_ROLE_KEY not found in .env file');
  process.exit(1);
}

console.log(`🔑 Secret length: ${SECRET.length} characters\n`);

const bookingId = process.argv[2];

if (!bookingId) {
  console.error('❌ Usage: node scripts/generate-complete-token.js <booking-id>');
  console.log('\nExample:');
  console.log('  node scripts/generate-complete-token.js 8378235c-e160-4f61-bd1d-e974943f7835');
  process.exit(1);
}

// Generate token (same logic as src/lib/tokens.ts)
function generateCompleteToken(bookingId) {
  const payload = {
    id: bookingId,
    action: 'complete',
    exp: Date.now() + 14 * 24 * 60 * 60 * 1000, // 14 days
  };
  
  const data = JSON.stringify(payload);
  const signature = crypto.createHmac('sha256', SECRET)
    .update(data)
    .digest('hex');
  
  return Buffer.from(JSON.stringify({ data, signature })).toString('base64url');
}

const token = generateCompleteToken(bookingId);
const completeUrl = `http://localhost:3000/api/bookings/${bookingId}/complete?token=${token}`;

console.log('\n✅ Complete URL generated:');
console.log(completeUrl);
console.log('\n📋 Copy and paste this URL in your browser to test.');
