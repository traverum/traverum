/**
 * Check if a Stripe connected account exists
 * Usage: node scripts/check-stripe-account.js <account-id>
 */

const Stripe = require('stripe');
const fs = require('fs');

// Read .env file manually
let STRIPE_SECRET_KEY = '';
try {
  const envContent = fs.readFileSync('.env', 'utf8');
  const match = envContent.match(/STRIPE_SECRET_KEY=(.+)/);
  if (match) STRIPE_SECRET_KEY = match[1].trim();
} catch (e) {
  console.error('❌ Error: Could not read .env file');
  process.exit(1);
}

if (!STRIPE_SECRET_KEY) {
  console.error('❌ Error: STRIPE_SECRET_KEY not found in .env file');
  process.exit(1);
}

const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

const accountId = process.argv[2] || 'acct_1SuF0B4290RddUYh';

async function checkAccount() {
  try {
    console.log(`🔍 Checking Stripe account: ${accountId}\n`);
    
    const account = await stripe.accounts.retrieve(accountId);
    
    console.log('✅ Account exists!');
    console.log(`   ID: ${account.id}`);
    console.log(`   Type: ${account.type}`);
    console.log(`   Country: ${account.country}`);
    console.log(`   Email: ${account.email || 'N/A'}`);
    console.log(`   Charges Enabled: ${account.charges_enabled}`);
    console.log(`   Payouts Enabled: ${account.payouts_enabled}`);
    console.log(`   Details Submitted: ${account.details_submitted}`);
    
    if (!account.charges_enabled || !account.payouts_enabled) {
      console.log(`\n⚠️  Warning: Account may not be fully set up for transfers.`);
      console.log(`   Visit: https://dashboard.stripe.com/test/connect/accounts/${account.id}`);
    }
    
  } catch (error) {
    if (error.code === 'resource_missing') {
      console.error(`❌ Account ${accountId} does not exist in this Stripe account.`);
      console.log(`\n💡 Possible reasons:`);
      console.log(`   1. Account was created in a different Stripe account (test vs live)`);
      console.log(`   2. Account was deleted`);
      console.log(`   3. Using wrong API key`);
      console.log(`\n🔧 Solution: Create a new account with:`);
      console.log(`   node scripts/create-test-account.js`);
    } else {
      console.error('❌ Error:', error.message);
    }
    process.exit(1);
  }
}

checkAccount();
