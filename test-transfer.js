const crypto = require('crypto');
const fs = require('fs');

// Read .env file manually
let SECRET = '';
try {
  const envContent = fs.readFileSync('.env', 'utf8');
  const match = envContent.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/);
  if (match) SECRET = match[1].trim();
} catch (e) {}

if (!SECRET) {
  console.log('❌ Error: Could not find SUPABASE_SERVICE_ROLE_KEY in .env file');
  process.exit(1);
}

const BOOKING_ID = '8378235c-e160-4f61-bd1d-e974943f7835';

const payload = {
  id: BOOKING_ID,
  action: 'complete',
  exp: Date.now() + 14 * 24 * 60 * 60 * 1000
};

const data = JSON.stringify(payload);
const signature = crypto.createHmac('sha256', SECRET).update(data).digest('hex');
const token = Buffer.from(JSON.stringify({ data, signature })).toString('base64url');

console.log('\n✅ Complete URL:');
console.log(`http://localhost:3000/api/bookings/${BOOKING_ID}/complete?token=${token}\n`);
