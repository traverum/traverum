/**
 * Update supplier with new Stripe account ID
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

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
  console.error('❌ Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const newAccountId = 'acct_1SuHIGKZDQXRznBB';
const supplierId = 'b2222222-2222-2222-2222-222222222222';

async function updateAccount() {
  try {
    const { data, error } = await supabase
      .from('partners')
      .update({ 
        stripe_account_id: newAccountId,
        updated_at: new Date().toISOString()
      })
      .eq('id', supplierId)
      .select();
    
    if (error) {
      console.error('❌ Error updating:', error);
      process.exit(1);
    }
    
    console.log('✅ Supplier account updated!');
    console.log(`   New Stripe Account ID: ${newAccountId}`);
    console.log(`\n🧪 Now try the complete URL again - the transfer should work!`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

updateAccount();
