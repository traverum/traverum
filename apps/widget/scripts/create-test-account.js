/**
 * Create a test connected account for the supplier
 * Run: node scripts/create-test-account.js
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

async function createTestAccount() {
  try {
    console.log('Creating test connected account...\n');
    
    // Create a test Express account (simplest for testing)
    const account = await stripe.accounts.create({
      type: 'express',
      country: 'IT', // Italy (matches your setup)
      email: 'supplier@test.com',
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
    });
    
    console.log('✅ Connected account created!');
    console.log(`Account ID: ${account.id}`);
    console.log(`\n📋 Next steps:`);
    console.log(`1. Update the database:`);
    console.log(`   UPDATE partners SET stripe_account_id = '${account.id}' WHERE id = 'b2222222-2222-2222-2222-222222222222';`);
    console.log(`\n2. Complete onboarding (optional for test mode):`);
    console.log(`   Visit: https://dashboard.stripe.com/test/connect/accounts/${account.id}`);
    console.log(`\n⚠️  Note: In test mode, transfers may work without full onboarding.`);
    console.log(`   If transfers fail, you may need to complete onboarding via the dashboard.`);
    
    return account.id;
  } catch (error) {
    console.error('❌ Error creating account:', error.message);
    if (error.type === 'StripeInvalidRequestError') {
      console.error('Details:', error.raw);
    }
    process.exit(1);
  }
}

createTestAccount();
