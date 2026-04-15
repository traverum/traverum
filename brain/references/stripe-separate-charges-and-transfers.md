# Create separate charges and transfers

Create charges on your platform account and transfer funds to multiple connected accounts.

Instructions for LLMs: Before implementing, read the official Stripe skill from this repo: `vendor/stripe-ai/skills/stripe-best-practices/SKILL.md` and its `references/` (git submodule [stripe/ai](https://github.com/stripe/ai); update with `git submodule update --remote vendor/stripe-ai`). See also `.agents/skills/stripe-best-practices-official/SKILL.md`. 

Create *separate charges and transfers* to transfer funds from one payment to multiple connected accounts, or when a specific user isn’t known at the time of the payment. The charge on your platform account is decoupled from the transfers to your connected accounts. With this charge type:

- You create a charge on your platform’s account and also transfer funds to your connected accounts. The payment appears as a charge on your account and there are also transfers to connected accounts (amount determined by you), which are withdrawn from your account balance.
- You can transfer funds to multiple connected accounts.
- Your account balance is debited for the cost of the Stripe fees, refunds, and chargebacks.

This charge type helps marketplaces split payments between multiple parties. For example, a restaurant delivery platform that splits payments between the restaurant and the deliverer.

> Funds segregation is a private preview feature that keeps payment funds in a protected holding state before you transfer them to connected accounts. This prevents allocated funds from being used for unrelated platform operations. Contact your Stripe account manager to request access.

Stripe supports separate charges and transfers in the following regions:

- AT
- AU
- BE
- BG
- BR
- CA
- CH
- CY
- CZ
- DE
- DK
- EE
- ES
- FI
- FR
- GB
- GR
- HR
- HU
- IE
- IT
- JP
- LI
- LT
- LU
- LV
- MT
- MX
- MY
- NL
- NO
- NZ
- PL
- PT
- RO
- SE
- SG
- SI
- SK
- US

## Cross-border transfers

Stripe supports cross-border transfers on the payments balance between the United States, Canada, United Kingdom, EEA, and Switzerland. In other scenarios, your platform and any connected account must be in the same region. Attempting to transfer funds across unsupported borders or balances returns an error. See [Cross-border payouts](https://docs.stripe.com/connect/cross-border-payouts.md) for supported funds flows between other regions.

You must only use transfers in combination with the permitted use cases for [charges](https://docs.stripe.com/connect/charges.md), [tops-ups](https://docs.stripe.com/connect/top-ups.md) and [fees](https://docs.stripe.com/connect/separate-charges-and-transfers.md#collect-fees). We recommend using separate charges and transfers only when you’re responsible for negative balances of your connected accounts.

Redirect to a Stripe-hosted payment page using [Stripe Checkout](https://docs.stripe.com/payments/checkout.md). See how this integration [compares to Stripe’s other integration types](https://docs.stripe.com/payments/online-payments.md#compare-features-and-availability).

#### Integration effort
Complexity: 2/5
#### Integration type

Redirect to Stripe-hosted payment page

#### UI customization
Limited customization
- 20 preset fonts
- 3 preset border radius
- Custom background and border color
- Custom logo

[Try it out](https://checkout.stripe.dev/)

Use our official libraries to access the Stripe API from your application:

#### Ruby

```bash
# Available as a gem
sudo gem install stripe
```

```ruby
# If you use bundler, you can add this line to your Gemfile
gem 'stripe'
```

## Create a Checkout Session [Client-side] [Server-side]

A [Checkout Session](https://docs.stripe.com/api/checkout/sessions.md) controls what your customer sees in the payment form such as line items, the order amount and currency, and acceptable payment methods. Add a checkout button to your website that calls a server-side endpoint to create a Checkout Session.

```html
<html>
  <head>
    <title>Checkout</title>
  </head>
  <body>
    <form action="/create-checkout-session" method="POST">
      <button type="submit">Checkout</button>
    </form>
  </body>
</html>
```

On your server, create a Checkout Session and redirect your customer to the [URL](https://docs.stripe.com/api/checkout/sessions/object.md#checkout_session_object-url) returned in the response.

```curl
curl https://api.stripe.com/v1/checkout/sessions \
  -u "<<YOUR_SECRET_KEY>>:" \
  -d "line_items[0][price_data][currency]=usd" \
  -d "line_items[0][price_data][product_data][name]=Restaurant delivery service" \
  -d "line_items[0][price_data][unit_amount]=10000" \
  -d "line_items[0][quantity]=1" \
  -d "payment_intent_data[transfer_group]=ORDER100" \
  -d mode=payment \
  --data-urlencode "success_url=https://example.com/success?session_id={CHECKOUT_SESSION_ID}"
```

- `line_items` - This attribute represents the items the customer is purchasing. The items are displayed in the Stripe-hosted checkout page.
- `payment_intent_data[transfer_group]` - Use a unique string as the `transfer_group` to identify objects that are associated with each other. When Stripe automatically creates a charge for a PaymentIntent with a `transfer_group` value, it assigns the same value to the charge’s `transfer_group`.
- `success_url` - Stripe redirects the customer to the success URL after they complete a payment and replaces the `{CHECKOUT_SESSION_ID}` string with the Checkout Session ID. Use this to retrieve the Checkout Session and inspect the status to decide what to show your customer. You can also append your own query parameters, which persist through the redirect process. See [customize redirect behavior with a Stripe-hosted page](https://docs.stripe.com/payments/checkout/custom-success-page.md) for more information.
 (See full diagram at https://docs.stripe.com/connect/separate-charges-and-transfers)
## Handle post-payment events [Server-side]

Stripe sends a [checkout.session.completed](https://docs.stripe.com/api/events/types.md#event_types-checkout.session.completed) event when the payment completes. [Use a webhook to receive these events](https://docs.stripe.com/webhooks/quickstart.md) and run actions, like sending an order confirmation email to your customer, logging the sale in a database, or starting a shipping workflow.

Listen for these events rather than waiting on a callback from the client. On the client, the customer could close the browser window or quit the app before the callback executes. Some payment methods also take 2-14 days for payment confirmation. Setting up your integration to listen for asynchronous events enables you to accept multiple [payment methods](https://stripe.com/payments/payment-methods-guide) with a single integration.

Stripe recommends handling all of the following events when collecting payments with Checkout:

| Event                                                                                                                                        | Description                                                                           | Next steps                                                                  |
| -------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| [checkout.session.completed](https://docs.stripe.com/api/events/types.md#event_types-checkout.session.completed)                             | The customer has successfully authorized the payment by submitting the Checkout form. | Wait for the payment to succeed or fail.                                    |
| [checkout.session.async_payment_succeeded](https://docs.stripe.com/api/events/types.md#event_types-checkout.session.async_payment_succeeded) | The customer’s payment succeeded.                                                     | Fulfill the purchased goods or services.                                    |
| [checkout.session.async_payment_failed](https://docs.stripe.com/api/events/types.md#event_types-checkout.session.async_payment_failed)       | The payment was declined, or failed for some other reason.                            | Contact the customer through email and request that they place a new order. |

These events all include the [Checkout Session](https://docs.stripe.com/api/checkout/sessions.md) object. After the payment succeeds, the underlying *PaymentIntent* (The Payment Intents API tracks the lifecycle of a customer checkout flow and triggers additional authentication steps when required by regulatory mandates, custom Radar fraud rules, or redirect-based payment methods) [status](https://docs.stripe.com/payments/paymentintents/lifecycle.md) changes from `processing` to `succeeded` or a failure status.

## Create a Transfer [Server-side]

On your server, send funds from your account to a connected account by creating a [Transfer](https://docs.stripe.com/api/transfers/create.md) and specifying the `transfer_group` used.

```curl
curl https://api.stripe.com/v1/transfers \
  -u "<<YOUR_SECRET_KEY>>:" \
  -d amount=7000 \
  -d currency=usd \
  -d "destination={{CONNECTEDACCOUNT_ID}}" \
  -d transfer_group=ORDER100
```

Transfer and charge amounts don’t have to match. You can split a single charge between multiple transfers or include multiple charges in a single transfer. The following example creates an additional transfer associated with the same `transfer_group`.

```curl
curl https://api.stripe.com/v1/transfers \
  -u "<<YOUR_SECRET_KEY>>:" \
  -d amount=2000 \
  -d currency=usd \
  -d destination={{OTHER_CONNECTED_ACCOUNT_ID}} \
  -d transfer_group=ORDER100
```

### Transfer options

You can assign any value to the `transfer_group` string, but it must represent a single business action. You can also make a transfer with neither an associated charge nor a `transfer_group`—for example, when you must pay a provider but there’s no associated customer payment.

> The `transfer_group` only identifies associated objects. It doesn’t affect any standard functionality. To prevent a transfer from executing before the funds from the associated charge are available, use the transfer’s `source_transaction` attribute.

By default, a transfer request fails when the amount exceeds the platform’s [available account balance](https://docs.stripe.com/connect/account-balances.md). Stripe doesn’t automatically retry failed transfer requests.

You can avoid failed transfer requests for transfers that are associated with charges. When you specify the associated charge [as the transfer’s source_transaction](https://docs.stripe.com/connect/separate-charges-and-transfers.md#transfer-availability), the transfer request automatically succeeds. However, we don’t execute the transfer until the funds from that charge are available in the platform account.

> If you use separate charges and transfers, take that into account when planning your *payout* (A payout is the transfer of funds to an external account, usually a bank account, in the form of a deposit) schedule. Automatic payouts can interfere with transfers that don’t have a defined `source_transaction`.

### Asynchronous payment methods

If you’re using *asynchronous payment methods* (Asynchronous payment methods can take up to several days to confirm whether the payment has been successful. During this time, the payment can't be guaranteed) (such as ACH Debit or SEPA Debit), wait for a [charge.succeeded](https://docs.stripe.com/api/events/types.md#event_types-charge.succeeded) event before creating a transfer. Unlike destination charges, Stripe doesn’t automatically reverse a transfer if the associated async payment fails. If you create a transfer and the payment subsequently fails, your platform’s balance is debited for the transfer amount. You must then manually [reverse the transfer](https://docs.stripe.com/connect/separate-charges-and-transfers.md#reverse-transfers) to recover the funds.

## Test the integration

#### Cards

| Card number         | Scenario                                                                                                                                                                                                                                                                                      | How to test                                                                                           |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| 4242424242424242    | The card payment succeeds and doesn’t require authentication.                                                                                                                                                                                                                                 | Fill out the credit card form using the credit card number with any expiration, CVC, and postal code. |
| 4000002500003155    | The card payment requires *authentication* (Strong Customer Authentication (SCA) is a regulatory requirement in effect as of September 14, 2019, that impacts many European online payments. It requires customers to use two-factor authentication like 3D Secure to verify their purchase). | Fill out the credit card form using the credit card number with any expiration, CVC, and postal code. |
| 4000000000009995    | The card is declined with a decline code like `insufficient_funds`.                                                                                                                                                                                                                           | Fill out the credit card form using the credit card number with any expiration, CVC, and postal code. |
| 6205500000000000004 | The UnionPay card has a variable length of 13-19 digits.                                                                                                                                                                                                                                      | Fill out the credit card form using the credit card number with any expiration, CVC, and postal code. |

#### Wallets

| Payment method | Scenario                                                                                                                                                                     | How to test                                                                                                                                                  |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Alipay         | Your customer successfully pays with a redirect-based and [immediate notification](https://docs.stripe.com/payments/payment-methods.md#payment-notification) payment method. | Choose any redirect-based payment method, fill out the required details, and confirm the payment. Then click **Complete test payment** on the redirect page. |

#### Bank redirects

| Payment method                         | Scenario                                                                                                                                                                                        | How to test                                                                                                                                                                                             |
| -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| BECS Direct Debit                      | Your customer successfully pays with BECS Direct Debit.                                                                                                                                         | Fill out the form using the account number `900123456` and BSB `000000`. The confirmed PaymentIntent initially transitions to `processing`, then transitions to the `succeeded` status 3 minutes later. |
| BECS Direct Debit                      | Your customer’s payment fails with an `account_closed` error code.                                                                                                                              | Fill out the form using the account number `111111113` and BSB `000000`.                                                                                                                                |
| Bancontact, EPS, iDEAL, and Przelewy24 | Your customer fails to authenticate on the redirect page for a redirect-based and immediate notification payment method.                                                                        | Choose any redirect-based payment method, fill out the required details, and confirm the payment. Then click **Fail test payment** on the redirect page.                                                |
| Pay by Bank                            | Your customer successfully pays with a redirect-based and [delayed notification](https://docs.stripe.com/payments/payment-methods.md#payment-notification) payment method.                      | Choose the payment method, fill out the required details, and confirm the payment. Then click **Complete test payment** on the redirect page.                                                           |
| Pay by Bank                            | Your customer fails to authenticate on the redirect page for a redirect-based and delayed notification payment method.                                                                          | Choose the payment method, fill out the required details, and confirm the payment. Then click **Fail test payment** on the redirect page.                                                               |
| BLIK                                   | BLIK payments fail in a variety of ways—immediate failures (for example, the code is expired or invalid), delayed errors (the bank declines) or timeouts (the customer didn’t respond in time). | Use email patterns to [simulate the different failures.](https://docs.stripe.com/payments/blik/accept-a-payment.md#simulate-failures)                                                                   |

#### Bank debits

| Payment method    | Scenario                                                                                          | How to test                                                                                                                                                                                       |
| ----------------- | ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SEPA Direct Debit | Your customer successfully pays with SEPA Direct Debit.                                           | Fill out the form using the account number `AT321904300235473204`. The confirmed PaymentIntent initially transitions to processing, then transitions to the succeeded status three minutes later. |
| SEPA Direct Debit | Your customer’s payment intent status transitions from `processing` to `requires_payment_method`. | Fill out the form using the account number `AT861904300235473202`.                                                                                                                                |

#### Vouchers

| Payment method | Scenario                                          | How to test                                                                                            |
| -------------- | ------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Boleto, OXXO   | Your customer pays with a Boleto or OXXO voucher. | Select Boleto or OXXO as the payment method and submit the payment. Close the dialog after it appears. |

See [Testing](https://docs.stripe.com/testing.md) for additional information to test your integration.

## Optional: Enable additional payment methods

Navigate to [Manage payment methods for your connected accounts](https://dashboard.stripe.com/settings/payment_methods/connected_accounts) in the Dashboard to configure which payment methods your connected accounts accept. Changes to default settings apply to all new and existing connected accounts.

Consult the following resources for payment method information:

- [A guide to payment methods](https://stripe.com/payments/payment-methods-guide#choosing-the-right-payment-methods-for-your-business) to help you choose the correct payment methods for your platform.
- [Account capabilities](https://docs.stripe.com/connect/account-capabilities.md) to make sure your chosen payment methods work for your connected accounts.
- [Payment method and product support](https://docs.stripe.com/payments/payment-methods/payment-method-support.md#product-support) tables to make sure your chosen payment methods work for your Stripe products and payments flows.

For each payment method, you can select one of the following dropdown options:

|  |
|  |
| **On by default**  | Your connected accounts accept this payment method during checkout. Some payment methods can only be off or blocked. This is because your connected accounts with *access to the Stripe Dashboard* (Platforms can provide connected accounts with access to the full Stripe Dashboard or the Express Dashboard. Otherwise, platforms build an interface for connected accounts using embedded components or the Stripe API) must activate them in their settings page. |
| **Off by default** | Your connected accounts don’t accept this payment method during checkout. If you allow your connected accounts with *access to the Stripe Dashboard* (Platforms can provide connected accounts with access to the full Stripe Dashboard or the Express Dashboard. Otherwise, platforms build an interface for connected accounts using embedded components or the Stripe API) to manage their own payment methods, they have the ability to turn it on.                |
| **Blocked**        | Your connected accounts don’t accept this payment method during checkout. If you allow your connected accounts with *access to the Stripe Dashboard* (Platforms can provide connected accounts with access to the full Stripe Dashboard or the Express Dashboard. Otherwise, platforms build an interface for connected accounts using embedded components or the Stripe API) to manage their own payment methods, they don’t have the option to turn it on.           |
![Dropdown options for payment methods, each showing an available option (blocked, on by default, off by default)](https://b.stripecdn.com/docs-statics-srv/assets/dropdowns.ef651d721d5939d81521dd34dde4577f.png)

Payment method options

If you make a change to a payment method, you must click **Review changes** in the bottom bar of your screen and **Save and apply** to update your connected accounts.
![Dialog that shows after clicking Save button with a list of what the user changed](https://b.stripecdn.com/docs-statics-srv/assets/dialog.a56ea7716f60db9778706790320d13be.png)

Save dialog

### Allow connected accounts to manage payment methods

Stripe recommends allowing your connected accounts to customize their own payment methods. This option allows each connected account with *access to the Stripe Dashboard* (Platforms can provide connected accounts with access to the full Stripe Dashboard or the Express Dashboard. Otherwise, platforms build an interface for connected accounts using embedded components or the Stripe API) to view and update their [Payment methods](https://dashboard.stripe.com/settings/payment_methods) page. Only owners of the connected accounts can customize their payment methods. The Stripe Dashboard displays the set of payment method defaults you applied to all new and existing connected accounts. Your connected accounts can override these defaults, excluding payment methods you have blocked.

Check the **Account customization** checkbox to enable this option. You must click **Review changes** in the bottom bar of your screen and then select **Save and apply** to update this setting.
![Screenshot of the checkbox to select when allowing connected owners to customize payment methods](https://b.stripecdn.com/docs-statics-srv/assets/checkbox.275bd35d2a025272f03af029a144e577.png)

Account customization checkbox

### Payment method capabilities

To allow your connected accounts to accept additional payment methods, their `Accounts` must have active payment method capabilities.

If you selected the “On by default” option for a payment method in [Manage payment methods for your connected accounts](https://dashboard.stripe.com/settings/payment_methods/connected_accounts), Stripe automatically requests the necessary capability for new and existing connected accounts if they meet the verification requirements. If the connected account doesn’t meet the requirements or if you want to have direct control, you can manually request the capability in the Dashboard or with the API.

Most payment methods have the same verification requirements as the `card_payments` capability, with some restrictions and exceptions. The [payment method capabilities table](https://docs.stripe.com/connect/account-capabilities.md#payment-methods) lists the payment methods that require additional verification.

#### Dashboard

[Find a connected account](https://docs.stripe.com/connect/dashboard/managing-individual-accounts.md#finding-accounts) in the Dashboard to edit its capabilities and view outstanding verification requirements.

#### Accounts v2 API

For an existing connected account, you can retrieve the `Account` and inspect their [merchant capabilities](https://docs.stripe.com/api/v2/core/accounts/retrieve.md#v2_retrieve_accounts-response-configuration-merchant-capabilities) to determine whether you need to request additional capabilities.

```curl
curl -G https://api.stripe.com/v2/core/accounts/{{CONNECTEDACCOUNT_ID}} \
  -H "Authorization: Bearer <<YOUR_SECRET_KEY>>" \
  -H "Stripe-Version: 2025-11-17.preview" \
  -d "include[0]=configuration.merchant"
```

Request additional capabilities by [updating](https://docs.stripe.com/api/v2/core/accounts/update.md#v2_update_accounts-configuration-merchant-capabilities) each connected account’s capabilities.

```curl
curl -X POST https://api.stripe.com/v2/accounts/{{CONNECTEDACCOUNT_ID}} \
  -H "Authorization: Bearer <<YOUR_SECRET_KEY>>" \
  -H "Stripe-Version: 2025-11-17.preview" \
  --json '{
    "configuration": {
        "merchant": {
            "capabilities": {
                "ach_debit_payments": {
                    "requested": true
                }
            }
        }
    },
    "include": [
        "configuration.merchant",
        "requirements"
    ]
  }'
```

Requested capabilities might be delayed before becoming active. If the capability has any activation requirements, the response includes them in the `requirements` arrays.

#### Accounts v1 API

For an existing connected account, you can [list](https://docs.stripe.com/api/capabilities/list.md) their existing capabilities to determine whether you need to request additional capabilities.

```curl
curl https://api.stripe.com/v1/accounts/{{CONNECTEDACCOUNT_ID}}/capabilities \
  -u "<<YOUR_SECRET_KEY>>:"
```

Request additional capabilities by [updating](https://docs.stripe.com/api/capabilities/update.md) each connected account’s capabilities.

```curl
curl https://api.stripe.com/v1/accounts/{{CONNECTEDACCOUNT_ID}}/capabilities/us_bank_account_ach_payments \
  -u "<<YOUR_SECRET_KEY>>:" \
  -d requested=true
```

There can be a delay before the requested capability becomes active. If the capability has any activation requirements, the response includes them in the `requirements` arrays.

## Specify the settlement merchant 

The settlement merchant is dependent on the [capabilities](https://docs.stripe.com/connect/account-capabilities.md) set on an account and how a charge is created. The settlement merchant determines whose information is used to make the charge. This includes the statement descriptor (either the platform’s or the connected account’s) that’s displayed on the customer’s credit card or bank statement for that charge.

Specifying the settlement merchant allows you to be more explicit about who to create charges for. For example, some platforms prefer to be the settlement merchant because the end customer interacts directly with their platform (such as on-demand platforms). However, some platforms have connected accounts that interact directly with end customers instead (such as a storefront on an e-commerce platform). In these scenarios, it might make more sense for the connected account to be the settlement merchant.

You can set the `on_behalf_of` parameter to the ID of a connected account to make that account the settlement merchant for the payment. When using `on_behalf_of`:

- Charges *settle* (When funds are available in your Stripe balance) in the connected account’s country and *settlement currency* (The settlement currency is the currency your bank account uses).
- The fee structure for the connected account’s country is used.
- The connected account’s statement descriptor is displayed on the customer’s credit card statement.
- If the connected account is in a different country than the platform, the connected account’s address and phone number are displayed on the customer’s credit card statement.
- The number of days that a [pending balance](https://docs.stripe.com/connect/account-balances.md) is held before being paid out depends on the [delay_days](https://docs.stripe.com/api/accounts/create.md#create_account-settings-payouts-schedule-delay_days) setting on the connected account.

> #### Accounts v2 API
> 
> You can’t use the Accounts v2 API to manage payout settings. Use the Accounts v1 API.

If `on_behalf_of` is omitted, the platform is the business of record for the payment.

> The `on_behalf_of` parameter is supported only for connected accounts with a payments capability such as [card_payments](https://docs.stripe.com/connect/account-capabilities.md#card-payments). Accounts under the [recipient service agreement](https://docs.stripe.com/connect/service-agreement-types.md#recipient) can’t request `card_payments` or other payments capabilities.

```curl
curl https://api.stripe.com/v1/checkout/sessions \
  -u "<<YOUR_SECRET_KEY>>:" \
  -d "line_items[0][price_data][currency]=usd" \
  -d "line_items[0][price_data][product_data][name]=Restaurant delivery service" \
  -d "line_items[0][price_data][unit_amount]=10000" \
  -d "line_items[0][quantity]=1" \
  -d "payment_intent_data[on_behalf_of]={{CONNECTEDACCOUNT_ID}}" \
  -d "payment_intent_data[transfer_group]=ORDER100" \
  -d mode=payment \
  --data-urlencode "success_url=https://example.com/success"
```

Embed a prebuilt payment form on your site using [Stripe Checkout](https://docs.stripe.com/payments/checkout.md). See how this integration [compares to Stripe’s other integration types](https://docs.stripe.com/payments/online-payments.md#compare-features-and-availability).

#### Integration effort
Complexity: 2/5
#### Integration type

Embed prebuilt payment form on your site

#### UI customization
Limited customization
- 20 preset fonts
- 3 preset border radius
- Custom background and border color
- Custom logo

Use our official libraries to access the Stripe API from your application:

#### Ruby

```bash
# Available as a gem
sudo gem install stripe
```

```ruby
# If you use bundler, you can add this line to your Gemfile
gem 'stripe'
```

## Create a Checkout Session [Client-side] [Server-side]

A [Checkout Session](https://docs.stripe.com/api/checkout/sessions.md) controls what your customer sees in the embeddable payment form such as line items, the order amount and currency. Create a Checkout Session in a server-side endpoint (for example, `/create-checkout-session`). The response includes a `client_secret` which you’ll use in the next step to mount Checkout.

```curl
curl https://api.stripe.com/v1/checkout/sessions \
  -u "<<YOUR_SECRET_KEY>>:" \
  -d "line_items[0][price_data][currency]=usd" \
  -d "line_items[0][price_data][product_data][name]=Restaurant delivery service" \
  -d "line_items[0][price_data][unit_amount]=10000" \
  -d "line_items[0][quantity]=1" \
  -d "payment_intent_data[transfer_group]=ORDER100" \
  -d mode=payment \
  -d ui_mode=embedded \
  --data-urlencode "return_url=https://example.com/return?session_id={CHECKOUT_SESSION_ID}"
```

- `line_items` - This attribute represents the items the customer is purchasing. The items are displayed in the embedded payment form.
- `payment_intent_data[transfer_group]` - Use a unique string as the `transfer_group` to identify objects that are associated with each other. When Stripe automatically creates a charge for a PaymentIntent with a `transfer_group` value, it assigns the same value to the charge’s `transfer_group`.
- `return_url` - Stripe redirects the customer to the return URL after they complete a payment attempt and replaces the `{CHECKOUT_SESSION_ID}` string with the Checkout Session ID. Use this to retrieve the Checkout Session and inspect the status to decide what to show your customer. Make sure the return URL corresponds to a page on your website that provides the status of the payment. You can also append your own query parameters, which persist through the redirect process. See [customize redirect behavior with an embedded form](https://docs.stripe.com/payments/checkout/custom-success-page.md?payment-ui=embedded-form) for more information.
 (See full diagram at https://docs.stripe.com/connect/separate-charges-and-transfers)
## Mount Checkout [Client-side]

#### HTML + JS

Checkout is available as part of [Stripe.js](https://docs.stripe.com/js.md). Include the Stripe.js script on your page by adding it to the head of your HTML file. Next, create an empty DOM node (container) to use for mounting.

```html
<head>
  <script src="https://js.stripe.com/clover/stripe.js"></script>
</head>
<body>
  <div id="checkout">
    <!-- Checkout will insert the payment form here -->
  </div>
</body>
```

Initialize Stripe.js with your publishable API key. Pass the `client_secret` from the previous step into `options` when you create the Checkout instance:

```javascript
// Initialize Stripe.js
const stripe = Stripe('<<YOUR_PUBLISHABLE_KEY>>');

initialize();

// Fetch Checkout Session and retrieve the client secret
async function initialize() {
  const fetchClientSecret = async () => {
    const response = await fetch("/create-checkout-session", {
      method: "POST",
    });
    const { clientSecret } = await response.json();
    return clientSecret;
  };

  // Initialize Checkout
  const checkout = await stripe.initEmbeddedCheckout({
    fetchClientSecret,
  });

  // Mount Checkout
  checkout.mount('#checkout');
}
```

#### React

Install Connect.js and the React Connect.js libraries from the [npm public registry](https://www.npmjs.com/package/@stripe/react-connect-js).

```bash
npm install --save @stripe/connect-js @stripe/react-connect-js
```

To use the Embedded Checkout component, create an `EmbeddedCheckoutProvider`. Call `loadStripe` with your publishable API key and pass the returned `Promise` to the provider. Use the `options` prop accepted by the provider to pass the `client_secret` from the previous step.

```jsx
import * as React from 'react';
import {loadStripe} from '@stripe/stripe-js';
import {
  EmbeddedCheckoutProvider,
  EmbeddedCheckout
} from '@stripe/react-stripe-js';
// Make sure to call `loadStripe` outside of a component’s render to avoid
// recreating the `Stripe` object on every render.
const stripePromise = loadStripe('<<YOUR_PUBLISHABLE_KEY>>');
const App = ({clientSecret}) => {
  const options = {clientSecret};
  return (
    <EmbeddedCheckoutProvider
      stripe={stripePromise}
      options={options}
    >
      <EmbeddedCheckout />
    </EmbeddedCheckoutProvider>
  )
}
```

Checkout is rendered in an iframe that securely sends payment information to Stripe over an HTTPS connection. Avoid placing Checkout within another iframe because some payment methods require redirecting to another page for payment confirmation.

## Handle post-payment events [Server-side]

Stripe sends a [checkout.session.completed](https://docs.stripe.com/api/events/types.md#event_types-checkout.session.completed) event when the payment completes. [Use a webhook to receive these events](https://docs.stripe.com/webhooks/quickstart.md) and run actions, like sending an order confirmation email to your customer, logging the sale in a database, or starting a shipping workflow.

Listen for these events rather than waiting on a callback from the client. On the client, the customer could close the browser window or quit the app before the callback executes. Some payment methods also take 2-14 days for payment confirmation. Setting up your integration to listen for asynchronous events enables you to accept multiple [payment methods](https://stripe.com/payments/payment-methods-guide) with a single integration.

Stripe recommends handling all of the following events when collecting payments with Checkout:

| Event                                                                                                                                        | Description                                                                           | Next steps                                                                  |
| -------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| [checkout.session.completed](https://docs.stripe.com/api/events/types.md#event_types-checkout.session.completed)                             | The customer has successfully authorized the payment by submitting the Checkout form. | Wait for the payment to succeed or fail.                                    |
| [checkout.session.async_payment_succeeded](https://docs.stripe.com/api/events/types.md#event_types-checkout.session.async_payment_succeeded) | The customer’s payment succeeded.                                                     | Fulfill the purchased goods or services.                                    |
| [checkout.session.async_payment_failed](https://docs.stripe.com/api/events/types.md#event_types-checkout.session.async_payment_failed)       | The payment was declined, or failed for some other reason.                            | Contact the customer through email and request that they place a new order. |

These events all include the [Checkout Session](https://docs.stripe.com/api/checkout/sessions.md) object. After the payment succeeds, the underlying *PaymentIntent* (The Payment Intents API tracks the lifecycle of a customer checkout flow and triggers additional authentication steps when required by regulatory mandates, custom Radar fraud rules, or redirect-based payment methods) [status](https://docs.stripe.com/payments/paymentintents/lifecycle.md) changes from `processing` to `succeeded` or a failure status.

## Create a Transfer [Server-side]

On your server, send funds from your account to a connected account by creating a [Transfer](https://docs.stripe.com/api/transfers/create.md) and specifying the `transfer_group` used.

```curl
curl https://api.stripe.com/v1/transfers \
  -u "<<YOUR_SECRET_KEY>>:" \
  -d amount=7000 \
  -d currency=usd \
  -d "destination={{CONNECTEDACCOUNT_ID}}" \
  -d transfer_group=ORDER100
```

Transfer and charge amounts don’t have to match. You can split a single charge between multiple transfers or include multiple charges in a single transfer. The following example creates an additional transfer associated with the same `transfer_group`.

```curl
curl https://api.stripe.com/v1/transfers \
  -u "<<YOUR_SECRET_KEY>>:" \
  -d amount=2000 \
  -d currency=usd \
  -d destination={{OTHER_CONNECTED_ACCOUNT_ID}} \
  -d transfer_group=ORDER100
```

### Transfer options

You can assign any value to the `transfer_group` string, but it must represent a single business action. You can also make a transfer with neither an associated charge nor a `transfer_group`—for example, when you must pay a provider but there’s no associated customer payment.

> The `transfer_group` only identifies associated objects. It doesn’t affect any standard functionality. To prevent a transfer from executing before the funds from the associated charge are available, use the transfer’s `source_transaction` attribute.

By default, a transfer request fails when the amount exceeds the platform’s [available account balance](https://docs.stripe.com/connect/account-balances.md). Stripe doesn’t automatically retry failed transfer requests.

You can avoid failed transfer requests for transfers that are associated with charges. When you specify the associated charge [as the transfer’s source_transaction](https://docs.stripe.com/connect/separate-charges-and-transfers.md#transfer-availability), the transfer request automatically succeeds. However, we don’t execute the transfer until the funds from that charge are available in the platform account.

> If you use separate charges and transfers, take that into account when planning your *payout* (A payout is the transfer of funds to an external account, usually a bank account, in the form of a deposit) schedule. Automatic payouts can interfere with transfers that don’t have a defined `source_transaction`.

### Asynchronous payment methods

If you’re using *asynchronous payment methods* (Asynchronous payment methods can take up to several days to confirm whether the payment has been successful. During this time, the payment can't be guaranteed) (such as ACH Debit or SEPA Debit), wait for a [charge.succeeded](https://docs.stripe.com/api/events/types.md#event_types-charge.succeeded) event before creating a transfer. Unlike destination charges, Stripe doesn’t automatically reverse a transfer if the associated async payment fails. If you create a transfer and the payment subsequently fails, your platform’s balance is debited for the transfer amount. You must then manually [reverse the transfer](https://docs.stripe.com/connect/separate-charges-and-transfers.md#reverse-transfers) to recover the funds.

## Test the integration

#### Cards

| Card number         | Scenario                                                                                                                                                                                                                                                                                      | How to test                                                                                           |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| 4242424242424242    | The card payment succeeds and doesn’t require authentication.                                                                                                                                                                                                                                 | Fill out the credit card form using the credit card number with any expiration, CVC, and postal code. |
| 4000002500003155    | The card payment requires *authentication* (Strong Customer Authentication (SCA) is a regulatory requirement in effect as of September 14, 2019, that impacts many European online payments. It requires customers to use two-factor authentication like 3D Secure to verify their purchase). | Fill out the credit card form using the credit card number with any expiration, CVC, and postal code. |
| 4000000000009995    | The card is declined with a decline code like `insufficient_funds`.                                                                                                                                                                                                                           | Fill out the credit card form using the credit card number with any expiration, CVC, and postal code. |
| 6205500000000000004 | The UnionPay card has a variable length of 13-19 digits.                                                                                                                                                                                                                                      | Fill out the credit card form using the credit card number with any expiration, CVC, and postal code. |

#### Wallets

| Payment method | Scenario                                                                                                                                                                     | How to test                                                                                                                                                  |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Alipay         | Your customer successfully pays with a redirect-based and [immediate notification](https://docs.stripe.com/payments/payment-methods.md#payment-notification) payment method. | Choose any redirect-based payment method, fill out the required details, and confirm the payment. Then click **Complete test payment** on the redirect page. |

#### Bank redirects

| Payment method                         | Scenario                                                                                                                                                                                        | How to test                                                                                                                                                                                             |
| -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| BECS Direct Debit                      | Your customer successfully pays with BECS Direct Debit.                                                                                                                                         | Fill out the form using the account number `900123456` and BSB `000000`. The confirmed PaymentIntent initially transitions to `processing`, then transitions to the `succeeded` status 3 minutes later. |
| BECS Direct Debit                      | Your customer’s payment fails with an `account_closed` error code.                                                                                                                              | Fill out the form using the account number `111111113` and BSB `000000`.                                                                                                                                |
| Bancontact, EPS, iDEAL, and Przelewy24 | Your customer fails to authenticate on the redirect page for a redirect-based and immediate notification payment method.                                                                        | Choose any redirect-based payment method, fill out the required details, and confirm the payment. Then click **Fail test payment** on the redirect page.                                                |
| Pay by Bank                            | Your customer successfully pays with a redirect-based and [delayed notification](https://docs.stripe.com/payments/payment-methods.md#payment-notification) payment method.                      | Choose the payment method, fill out the required details, and confirm the payment. Then click **Complete test payment** on the redirect page.                                                           |
| Pay by Bank                            | Your customer fails to authenticate on the redirect page for a redirect-based and delayed notification payment method.                                                                          | Choose the payment method, fill out the required details, and confirm the payment. Then click **Fail test payment** on the redirect page.                                                               |
| BLIK                                   | BLIK payments fail in a variety of ways—immediate failures (for example, the code is expired or invalid), delayed errors (the bank declines) or timeouts (the customer didn’t respond in time). | Use email patterns to [simulate the different failures.](https://docs.stripe.com/payments/blik/accept-a-payment.md#simulate-failures)                                                                   |

#### Bank debits

| Payment method    | Scenario                                                                                          | How to test                                                                                                                                                                                       |
| ----------------- | ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SEPA Direct Debit | Your customer successfully pays with SEPA Direct Debit.                                           | Fill out the form using the account number `AT321904300235473204`. The confirmed PaymentIntent initially transitions to processing, then transitions to the succeeded status three minutes later. |
| SEPA Direct Debit | Your customer’s payment intent status transitions from `processing` to `requires_payment_method`. | Fill out the form using the account number `AT861904300235473202`.                                                                                                                                |

#### Vouchers

| Payment method | Scenario                                          | How to test                                                                                            |
| -------------- | ------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Boleto, OXXO   | Your customer pays with a Boleto or OXXO voucher. | Select Boleto or OXXO as the payment method and submit the payment. Close the dialog after it appears. |

See [Testing](https://docs.stripe.com/testing.md) for additional information to test your integration.

## Optional: Enable additional payment methods

Navigate to [Manage payment methods for your connected accounts](https://dashboard.stripe.com/settings/payment_methods/connected_accounts) in the Dashboard to configure which payment methods your connected accounts accept. Changes to default settings apply to all new and existing connected accounts.

Consult the following resources for payment method information:

- [A guide to payment methods](https://stripe.com/payments/payment-methods-guide#choosing-the-right-payment-methods-for-your-business) to help you choose the correct payment methods for your platform.
- [Account capabilities](https://docs.stripe.com/connect/account-capabilities.md) to make sure your chosen payment methods work for your connected accounts.
- [Payment method and product support](https://docs.stripe.com/payments/payment-methods/payment-method-support.md#product-support) tables to make sure your chosen payment methods work for your Stripe products and payments flows.

For each payment method, you can select one of the following dropdown options:

|  |
|  |
| **On by default**  | Your connected accounts accept this payment method during checkout. Some payment methods can only be off or blocked. This is because your connected accounts with *access to the Stripe Dashboard* (Platforms can provide connected accounts with access to the full Stripe Dashboard or the Express Dashboard. Otherwise, platforms build an interface for connected accounts using embedded components or the Stripe API) must activate them in their settings page. |
| **Off by default** | Your connected accounts don’t accept this payment method during checkout. If you allow your connected accounts with *access to the Stripe Dashboard* (Platforms can provide connected accounts with access to the full Stripe Dashboard or the Express Dashboard. Otherwise, platforms build an interface for connected accounts using embedded components or the Stripe API) to manage their own payment methods, they have the ability to turn it on.                |
| **Blocked**        | Your connected accounts don’t accept this payment method during checkout. If you allow your connected accounts with *access to the Stripe Dashboard* (Platforms can provide connected accounts with access to the full Stripe Dashboard or the Express Dashboard. Otherwise, platforms build an interface for connected accounts using embedded components or the Stripe API) to manage their own payment methods, they don’t have the option to turn it on.           |
![Dropdown options for payment methods, each showing an available option (blocked, on by default, off by default)](https://b.stripecdn.com/docs-statics-srv/assets/dropdowns.ef651d721d5939d81521dd34dde4577f.png)

Payment method options

If you make a change to a payment method, you must click **Review changes** in the bottom bar of your screen and **Save and apply** to update your connected accounts.
![Dialog that shows after clicking Save button with a list of what the user changed](https://b.stripecdn.com/docs-statics-srv/assets/dialog.a56ea7716f60db9778706790320d13be.png)

Save dialog

### Allow connected accounts to manage payment methods

Stripe recommends allowing your connected accounts to customize their own payment methods. This option allows each connected account with *access to the Stripe Dashboard* (Platforms can provide connected accounts with access to the full Stripe Dashboard or the Express Dashboard. Otherwise, platforms build an interface for connected accounts using embedded components or the Stripe API) to view and update their [Payment methods](https://dashboard.stripe.com/settings/payment_methods) page. Only owners of the connected accounts can customize their payment methods. The Stripe Dashboard displays the set of payment method defaults you applied to all new and existing connected accounts. Your connected accounts can override these defaults, excluding payment methods you have blocked.

Check the **Account customization** checkbox to enable this option. You must click **Review changes** in the bottom bar of your screen and then select **Save and apply** to update this setting.
![Screenshot of the checkbox to select when allowing connected owners to customize payment methods](https://b.stripecdn.com/docs-statics-srv/assets/checkbox.275bd35d2a025272f03af029a144e577.png)

Account customization checkbox

### Payment method capabilities

To allow your connected accounts to accept additional payment methods, their `Accounts` must have active payment method capabilities.

If you selected the “On by default” option for a payment method in [Manage payment methods for your connected accounts](https://dashboard.stripe.com/settings/payment_methods/connected_accounts), Stripe automatically requests the necessary capability for new and existing connected accounts if they meet the verification requirements. If the connected account doesn’t meet the requirements or if you want to have direct control, you can manually request the capability in the Dashboard or with the API.

Most payment methods have the same verification requirements as the `card_payments` capability, with some restrictions and exceptions. The [payment method capabilities table](https://docs.stripe.com/connect/account-capabilities.md#payment-methods) lists the payment methods that require additional verification.

#### Dashboard

[Find a connected account](https://docs.stripe.com/connect/dashboard/managing-individual-accounts.md#finding-accounts) in the Dashboard to edit its capabilities and view outstanding verification requirements.

#### Accounts v2 API

For an existing connected account, you can retrieve the `Account` and inspect their [merchant capabilities](https://docs.stripe.com/api/v2/core/accounts/retrieve.md#v2_retrieve_accounts-response-configuration-merchant-capabilities) to determine whether you need to request additional capabilities.

```curl
curl -G https://api.stripe.com/v2/core/accounts/{{CONNECTEDACCOUNT_ID}} \
  -H "Authorization: Bearer <<YOUR_SECRET_KEY>>" \
  -H "Stripe-Version: 2025-11-17.preview" \
  -d "include[0]=configuration.merchant"
```

Request additional capabilities by [updating](https://docs.stripe.com/api/v2/core/accounts/update.md#v2_update_accounts-configuration-merchant-capabilities) each connected account’s capabilities.

```curl
curl -X POST https://api.stripe.com/v2/accounts/{{CONNECTEDACCOUNT_ID}} \
  -H "Authorization: Bearer <<YOUR_SECRET_KEY>>" \
  -H "Stripe-Version: 2025-11-17.preview" \
  --json '{
    "configuration": {
        "merchant": {
            "capabilities": {
                "ach_debit_payments": {
                    "requested": true
                }
            }
        }
    },
    "include": [
        "configuration.merchant",
        "requirements"
    ]
  }'
```

Requested capabilities might be delayed before becoming active. If the capability has any activation requirements, the response includes them in the `requirements` arrays.

#### Accounts v1 API

For an existing connected account, you can [list](https://docs.stripe.com/api/capabilities/list.md) their existing capabilities to determine whether you need to request additional capabilities.

```curl
curl https://api.stripe.com/v1/accounts/{{CONNECTEDACCOUNT_ID}}/capabilities \
  -u "<<YOUR_SECRET_KEY>>:"
```

Request additional capabilities by [updating](https://docs.stripe.com/api/capabilities/update.md) each connected account’s capabilities.

```curl
curl https://api.stripe.com/v1/accounts/{{CONNECTEDACCOUNT_ID}}/capabilities/us_bank_account_ach_payments \
  -u "<<YOUR_SECRET_KEY>>:" \
  -d requested=true
```

There can be a delay before the requested capability becomes active. If the capability has any activation requirements, the response includes them in the `requirements` arrays.

## Specify the settlement merchant 

The settlement merchant is dependent on the [capabilities](https://docs.stripe.com/connect/account-capabilities.md) set on an account and how a charge is created. The settlement merchant determines whose information is used to make the charge. This includes the statement descriptor (either the platform’s or the connected account’s) that’s displayed on the customer’s credit card or bank statement for that charge.

Specifying the settlement merchant allows you to be more explicit about who to create charges for. For example, some platforms prefer to be the settlement merchant because the end customer interacts directly with their platform (such as on-demand platforms). However, some platforms have connected accounts that interact directly with end customers instead (such as a storefront on an e-commerce platform). In these scenarios, it might make more sense for the connected account to be the settlement merchant.

You can set the `on_behalf_of` parameter to the ID of a connected account to make that account the settlement merchant for the payment. When using `on_behalf_of`:

- Charges *settle* (When funds are available in your Stripe balance) in the connected account’s country and *settlement currency* (The settlement currency is the currency your bank account uses).
- The fee structure for the connected account’s country is used.
- The connected account’s statement descriptor is displayed on the customer’s credit card statement.
- If the connected account is in a different country than the platform, the connected account’s address and phone number are displayed on the customer’s credit card statement.
- The number of days that a [pending balance](https://docs.stripe.com/connect/account-balances.md) is held before being paid out depends on the [delay_days](https://docs.stripe.com/api/accounts/create.md#create_account-settings-payouts-schedule-delay_days) setting on the connected account.

> #### Accounts v2 API
> 
> You can’t use the Accounts v2 API to manage payout settings. Use the Accounts v1 API.

If `on_behalf_of` is omitted, the platform is the business of record for the payment.

> The `on_behalf_of` parameter is supported only for connected accounts with a payments capability such as [card_payments](https://docs.stripe.com/connect/account-capabilities.md#card-payments). Accounts under the [recipient service agreement](https://docs.stripe.com/connect/service-agreement-types.md#recipient) can’t request `card_payments` or other payments capabilities.

```curl
curl https://api.stripe.com/v1/checkout/sessions \
  -u "<<YOUR_SECRET_KEY>>:" \
  -d "line_items[0][price_data][currency]=usd" \
  -d "line_items[0][price_data][product_data][name]=Restaurant delivery service" \
  -d "line_items[0][price_data][unit_amount]=10000" \
  -d "line_items[0][quantity]=1" \
  -d "payment_intent_data[on_behalf_of]={{CONNECTEDACCOUNT_ID}}" \
  -d "payment_intent_data[transfer_group]=ORDER100" \
  -d mode=payment \
  -d ui_mode=embedded \
  --data-urlencode "return_url=https://example.com/return"
```

Build a custom payments integration by embedding UI components on your site, using [Stripe Elements](https://docs.stripe.com/payments/elements.md). The client-side and server-side code builds a checkout form that accepts various payment methods. See how this integration [compares to Stripe’s other integration types](https://docs.stripe.com/payments/online-payments.md#compare-features-and-availability).

#### Integration effort
Complexity: 3/5
#### Integration type

Combine UI components into a custom payment flow

#### UI customization

CSS-level customization with the [Appearance API](https://docs.stripe.com/elements/appearance-api.md)

Use our official libraries to access the Stripe API from your application:

#### Ruby

```bash
# Available as a gem
sudo gem install stripe
```

```ruby
# If you use bundler, you can add this line to your Gemfile
gem 'stripe'
```

## Create a PaymentIntent [Server-side]

Stripe uses a [PaymentIntent](https://docs.stripe.com/api/payment_intents.md) object to represent your intent to collect payment from a customer, tracking charge attempts and payment state changes throughout the process.
A high-level overview of the payments integration this document describes. (See full diagram at https://docs.stripe.com/connect/separate-charges-and-transfers)
The payment methods shown to customers during the checkout process are also included on the PaymentIntent. You can let Stripe automatically pull payment methods from your Dashboard settings or you can list them manually.

Unless your integration requires a code-based option for offering payment methods, don’t list payment methods manually. Stripe evaluates the currency, payment method restrictions, and other parameters to determine the list of supported payment methods. Stripe prioritizes payment methods that help increase conversion and are most relevant to the currency and the customer’s location. Stripe hides lower priority payment methods in an overflow menu.

#### Manage payment methods from the Dashboard

Create a PaymentIntent on your server with an amount, currency, and a `transfer_group` value to associate with the transfer of funds later. In the latest version of the API, specifying the `automatic_payment_methods` parameter is optional because Stripe enables its functionality by default. You can manage payment methods from the [Dashboard](https://dashboard.stripe.com/settings/payment_methods). Stripe handles the return of eligible payment methods based on factors such as the transaction’s amount, currency, and payment flow.

```curl
curl https://api.stripe.com/v1/payment_intents \
  -u "<<YOUR_SECRET_KEY>>:" \
  -d amount=10000 \
  -d currency=usd \
  -d "automatic_payment_methods[enabled]=true" \
  -d transfer_group=ORDER100
```

#### List payment methods manually

Create a PaymentIntent on your server with an amount, currency, a list of payment method types, and a `transfer_group` value to associate with the transfer of funds later. Always decide how much to charge on the server side, a trusted environment, as opposed to the client. This prevents malicious customers from being able to choose their own prices.

```curl
curl https://api.stripe.com/v1/payment_intents \
  -u "<<YOUR_SECRET_KEY>>:" \
  -d amount=10000 \
  -d currency=eur \
  -d "payment_method_types[]=bancontact" \
  -d "payment_method_types[]=card" \
  -d "payment_method_types[]=eps" \
  -d "payment_method_types[]=ideal" \
  -d "payment_method_types[]=p24" \
  -d "payment_method_types[]=sepa_debit" \
  -d transfer_group=ORDER100
```

Choose the currency based on the payment methods you want to offer. Some payment methods support multiple currencies and countries. This example uses Bancontact, credit cards, EPS, iDEAL, Przelewy24, and SEPA Direct Debit.

> Each payment method needs to support the currency passed in the PaymentIntent and your business needs to be based in one of the countries each payment method supports. See [payment method integration options](https://docs.stripe.com/payments/payment-methods/integration-options.md) for more details about what’s supported.

### Retrieve the client secret

The PaymentIntent includes a *client secret* (The client secret is a unique key returned from Stripe as part of a PaymentIntent. This key lets the client access important fields from the PaymentIntent (status, amount, currency) while hiding sensitive ones (metadata, customer)) that the client side uses to securely complete the payment process. You can use different approaches to pass the client secret to the client side.

#### Single-page application

Retrieve the client secret from an endpoint on your server, using the browser’s `fetch` function. This approach is best if your client side is a single-page application, particularly one built with a modern frontend framework like React. Create the server endpoint that serves the client secret:

#### Ruby

```ruby
get '/secret' do
  intent = # ... Create or retrieve the PaymentIntent
  {client_secret: intent.client_secret}.to_json
end
```

And then fetch the client secret with JavaScript on the client side:

```javascript
(async () => {
  const response = await fetch('/secret');
  const {client_secret: clientSecret} = await response.json();
  // Render the form using the clientSecret
})();
```

#### Server-side rendering

Pass the client secret to the client from your server. This approach works best if your application generates static content on the server before sending it to the browser.

Add the [client_secret](https://docs.stripe.com/api/payment_intents/object.md#payment_intent_object-client_secret) in your checkout form. In your server-side code, retrieve the client secret from the PaymentIntent:

#### Ruby

```erb
<form id="payment-form" data-secret="<%= @intent.client_secret %>">
  <div id="payment-element">
    <!-- placeholder for Elements -->
  </div>
  <button id="submit">Submit</button>
</form>
```

```ruby
get '/checkout' do
  @intent = # ... Fetch or create the PaymentIntent
  erb :checkout
end
```

## Collect payment details [Client-side]

Collect payment details on the client with the [Payment Element](https://docs.stripe.com/payments/payment-element.md). The Payment Element is a prebuilt UI component that simplifies collecting payment details for a variety of payment methods.

The Payment Element contains an iframe that securely sends payment information to Stripe over an HTTPS connection. Avoid placing the Payment Element within another iframe because some payment methods require redirecting to another page for payment confirmation.

If you choose to use an iframe and want to accept Apple Pay or Google Pay, the iframe must have the [allow](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/iframe#attr-allowpaymentrequest) attribute set to equal `"payment *"`.

The checkout page address must start with `https://` rather than `http://` for your integration to work. You can test your integration without using HTTPS, but remember to [enable it](https://docs.stripe.com/security/guide.md#tls) when you’re ready to accept live payments.

#### HTML + JS

### Set up Stripe.js

The Payment Element is automatically available as a feature of Stripe.js. Include the Stripe.js script on your checkout page by adding it to the `head` of your HTML file. Always load Stripe.js directly from js.stripe.com to remain PCI compliant. Don’t include the script in a bundle or host a copy of it yourself.

```html
<head>
  <title>Checkout</title>
  <script src="https://js.stripe.com/clover/stripe.js"></script>
</head>
```

Create an instance of Stripe with the following JavaScript on your checkout page:

```javascript
// Set your publishable key: remember to change this to your live publishable key in production
// See your keys here: https://dashboard.stripe.com/apikeys
const stripe = Stripe('<<YOUR_PUBLISHABLE_KEY>>');
```

### Add the Payment Element to your payment page

The Payment Element needs a place to live on your payment page. Create an empty DOM node (container) with a unique ID in your payment form:

```html
<form id="payment-form">
  <div id="payment-element">
    <!-- Elements will create form elements here -->
  </div>
  <button id="submit">Submit</button>
  <div id="error-message">
    <!-- Display error message to your customers here -->
  </div>
</form>
```

When the previous form loads, create an instance of the Payment Element and mount it to the container DOM node. Pass the [client secret](https://docs.stripe.com/api/payment_intents/object.md#payment_intent_object-client_secret) from the previous step into `options` when you create the [Elements](https://docs.stripe.com/js/elements_object/create) instance:

Handle the client secret carefully because it can complete the charge. Don’t log it, embed it in URLs, or expose it to anyone but the customer.

```javascript
const options = {
  clientSecret: '{{CLIENT_SECRET}}',
  // Fully customizable with appearance API.
  appearance: {/*...*/},
};

// Set up Stripe.js and Elements to use in checkout form, passing the client secret obtained in a previous stepconst elements = stripe.elements(options);

// Create and mount the Payment Element
const paymentElementOptions = { layout: 'accordion'};
const paymentElement = elements.create('payment', paymentElementOptions);
paymentElement.mount('#payment-element');

```

#### React

### Set up Stripe.js

Install [React Stripe.js](https://www.npmjs.com/package/@stripe/react-stripe-js) and the [Stripe.js loader](https://www.npmjs.com/package/@stripe/stripe-js) from the npm public registry:

```bash
npm install --save @stripe/react-stripe-js @stripe/stripe-js
```

### Add and configure the Elements provider to your payment page

To use the Payment Element component, wrap your checkout page component in an [Elements provider](https://docs.stripe.com/sdks/stripejs-react.md#elements-provider). Call `loadStripe` with your publishable key, and pass the returned `Promise` to the `Elements` provider. Also pass the [client secret](https://docs.stripe.com/api/payment_intents/object.md#payment_intent_object-client_secret) from the previous step as `options` to the `Elements` provider.

```jsx
import React from 'react';
import ReactDOM from 'react-dom';
import {Elements} from '@stripe/react-stripe-js';
import {loadStripe} from '@stripe/stripe-js';

import CheckoutForm from './CheckoutForm';

// Make sure to call `loadStripe` outside of a component’s render to avoid
// recreating the `Stripe` object on every render.
const stripePromise = loadStripe('<<YOUR_PUBLISHABLE_KEY>>');

function App() {
  const options = {
    // passing the client secret obtained in step 3
    clientSecret: '{{CLIENT_SECRET}}',
    // Fully customizable with appearance API.
    appearance: {/*...*/},
  };

  return (
    <Elements stripe={stripePromise} options={options}>
      <CheckoutForm />
    </Elements>
  );
};

ReactDOM.render(<App />, document.getElementById('root'));
```

### Add the Payment Element component

Use the `PaymentElement` component to build your form:

```jsx
import React from 'react';
import {PaymentElement} from '@stripe/react-stripe-js';

const CheckoutForm = () => {
  return (
    <form><PaymentElement />
      <button>Submit</button>
    </form>
  );
};

export default CheckoutForm;
```

Stripe Elements is a collection of drop-in UI components. To further customize your form or collect different customer information, browse the [Elements docs](https://docs.stripe.com/payments/elements.md).

The Payment Element renders a dynamic form that allows your customer to pick a payment method. For each payment method, the form automatically asks the customer to fill in all necessary payment details.

### Customize appearance

Customize the Payment Element to match the design of your site by passing the [appearance object](https://docs.stripe.com/js/elements_object/create#stripe_elements-options-appearance) into `options` when creating the `Elements` provider.

### Collect addresses

By default, the Payment Element only collects the necessary billing address details. Some behavior, such as [calculating tax](https://docs.stripe.com/api/tax/calculations/create.md) or entering shipping details, requires your customer’s full address. You can:

- Use the [Address Element](https://docs.stripe.com/elements/address-element.md) to take advantage of autocomplete and localization features to collect your customer’s full address. This helps ensure the most accurate tax calculation.
- Collect address details using your own custom form.

### Request Apple Pay merchant token

If you’ve configured your integration to [accept Apple Pay payments](https://docs.stripe.com/payments/accept-a-payment.md?payment-ui=elements&api-integration=checkout), we recommend configuring the Apple Pay interface to return a merchant token to enable merchant initiated transactions (MIT). [Request the relevant merchant token type](https://docs.stripe.com/apple-pay/merchant-tokens.md?pay-element=web-pe) in the Payment Element.

## Submit the payment to Stripe [Client-side]

Use [stripe.confirmPayment](https://docs.stripe.com/js/payment_intents/confirm_payment) to complete the payment using details from the Payment Element. Provide a [return_url](https://docs.stripe.com/api/payment_intents/create.md#create_payment_intent-return_url) to this function to indicate where Stripe should redirect the user after they complete the payment. Your user may be first redirected to an intermediate site, like a bank authorization page, before being redirected to the `return_url`. Card payments immediately redirect to the `return_url` when a payment is successful.

If you don’t want to redirect for card payments after payment completion, you can set [redirect](https://docs.stripe.com/js/payment_intents/confirm_payment#confirm_payment_intent-options-redirect) to `if_required`. This only redirects customers that check out with redirect-based payment methods.

#### HTML + JS

```javascript
const form = document.getElementById('payment-form');

form.addEventListener('submit', async (event) => {
  event.preventDefault();
const {error} = await stripe.confirmPayment({
    //`Elements` instance that was used to create the Payment Element
    elements,
    confirmParams: {
      return_url: 'https://example.com/order/123/complete',
    },
  });

  if (error) {
    // This point will only be reached if there is an immediate error when
    // confirming the payment. Show error to your customer (for example, payment
    // details incomplete)
    const messageContainer = document.querySelector('#error-message');
    messageContainer.textContent = error.message;
  } else {
    // Your customer will be redirected to your `return_url`. For some payment
    // methods like iDEAL, your customer will be redirected to an intermediate
    // site first to authorize the payment, then redirected to the `return_url`.
  }
});
```

#### React

To call [stripe.confirmPayment](https://docs.stripe.com/js/payment_intents/confirm_payment) from your payment form component, use the [useStripe](https://docs.stripe.com/sdks/stripejs-react.md#usestripe-hook) and [useElements](https://docs.stripe.com/sdks/stripejs-react.md#useelements-hook) hooks.

If you prefer traditional class components over hooks, you can instead use an [ElementsConsumer](https://docs.stripe.com/sdks/stripejs-react.md#elements-consumer).

```jsx
import React, {useState} from 'react';
import {useStripe, useElements, PaymentElement} from '@stripe/react-stripe-js';

const CheckoutForm = () => {
  const stripe = useStripe();
  const elements = useElements();

  const [errorMessage, setErrorMessage] = useState(null);

  const handleSubmit = async (event) => {
    // We don't want to let default form submission happen here,
    // which would refresh the page.
    event.preventDefault();

    if (!stripe || !elements) {
      // Stripe.js hasn't yet loaded.
      // Make sure to disable form submission until Stripe.js has loaded.
      return;
    }
const {error} = await stripe.confirmPayment({
      //`Elements` instance that was used to create the Payment Element
      elements,
      confirmParams: {
        return_url: 'https://example.com/order/123/complete',
      },
    });


    if (error) {
      // This point will only be reached if there is an immediate error when
      // confirming the payment. Show error to your customer (for example, payment
      // details incomplete)
      setErrorMessage(error.message);
    } else {
      // Your customer will be redirected to your `return_url`. For some payment
      // methods like iDEAL, your customer will be redirected to an intermediate
      // site first to authorize the payment, then redirected to the `return_url`.
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement />
      <button disabled={!stripe}>Submit</button>
      {/* Show error message to your customers */}
      {errorMessage && <div>{errorMessage}</div>}
    </form>
  );
};

export default CheckoutForm;
```

Make sure the `return_url` corresponds to a page on your website that provides the status of the payment. When Stripe redirects the customer to the `return_url`, we provide the following URL query parameters:

| Parameter                      | Description                                                                                                                                   |
| ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `payment_intent`               | The unique identifier for the `PaymentIntent`.                                                                                                |
| `payment_intent_client_secret` | The [client secret](https://docs.stripe.com/api/payment_intents/object.md#payment_intent_object-client_secret) of the `PaymentIntent` object. |

> If you have tooling that tracks the customer’s browser session, you might need to add the `stripe.com` domain to the referrer exclude list. Redirects cause some tools to create new sessions, which prevents you from tracking the complete session.

Use one of the query parameters to retrieve the PaymentIntent. Inspect the [status of the PaymentIntent](https://docs.stripe.com/payments/paymentintents/lifecycle.md) to decide what to show your customers. You can also append your own query parameters when providing the `return_url`, which persist through the redirect process.

#### HTML + JS

```javascript

// Initialize Stripe.js using your publishable key
const stripe = Stripe('<<YOUR_PUBLISHABLE_KEY>>');

// Retrieve the "payment_intent_client_secret" query parameter appended to
// your return_url by Stripe.js
const clientSecret = new URLSearchParams(window.location.search).get(
  'payment_intent_client_secret'
);

// Retrieve the PaymentIntent
stripe.retrievePaymentIntent(clientSecret).then(({paymentIntent}) => {
  const message = document.querySelector('#message')

  // Inspect the PaymentIntent `status` to indicate the status of the payment
  // to your customer.
  //
  // Some payment methods will [immediately succeed or fail][0] upon
  // confirmation, while others will first enter a `processing` state.
  //
  // [0]: https://stripe.com/docs/payments/payment-methods#payment-notification
  switch (paymentIntent.status) {
    case 'succeeded':
      message.innerText = 'Success! Payment received.';
      break;

    case 'processing':
      message.innerText = "Payment processing. We'll update you when payment is received.";
      break;

    case 'requires_payment_method':
      message.innerText = 'Payment failed. Please try another payment method.';
      // Redirect your user back to your payment page to attempt collecting
      // payment again
      break;

    default:
      message.innerText = 'Something went wrong.';
      break;
  }
});
```

#### React

```jsx
import React, {useState, useEffect} from 'react';
import {useStripe} from '@stripe/react-stripe-js';

const PaymentStatus = () => {
  const stripe = useStripe();
  const [message, setMessage] = useState(null);

  useEffect(() => {
    if (!stripe) {
      return;
    }

    // Retrieve the "payment_intent_client_secret" query parameter appended to
    // your return_url by Stripe.js
    const clientSecret = new URLSearchParams(window.location.search).get(
      'payment_intent_client_secret'
    );

    // Retrieve the PaymentIntent
    stripe
      .retrievePaymentIntent(clientSecret)
      .then(({paymentIntent}) => {
        // Inspect the PaymentIntent `status` to indicate the status of the payment
        // to your customer.
        //
        // Some payment methods will [immediately succeed or fail][0] upon
        // confirmation, while others will first enter a `processing` state.
        //
        // [0]: https://stripe.com/docs/payments/payment-methods#payment-notification
        switch (paymentIntent.status) {
          case 'succeeded':
            setMessage('Success! Payment received.');
            break;

          case 'processing':
            setMessage("Payment processing. We'll update you when payment is received.");
            break;

          case 'requires_payment_method':
            // Redirect your user back to your payment page to attempt collecting
            // payment again
            setMessage('Payment failed. Please try another payment method.');
            break;

          default:
            setMessage('Something went wrong.');
            break;
        }
      });
  }, [stripe]);


  return message;
};

export default PaymentStatus;
```

## Handle post-payment events [Server-side]

Stripe sends a [payment_intent.succeeded](https://docs.stripe.com/api/events/types.md#event_types-payment_intent.succeeded) event when the payment completes. Use the [Dashboard webhook tool](https://dashboard.stripe.com/webhooks) or follow the [webhook guide](https://docs.stripe.com/webhooks/quickstart.md) to receive these events and run actions, such as sending an order confirmation email to your customer, logging the sale in a database, or starting a shipping workflow.

Listen for these events rather than waiting on a callback from the client. On the client, the customer could close the browser window or quit the app before the callback executes, and malicious clients could manipulate the response. Setting up your integration to listen for asynchronous events is what enables you to accept [different types of payment methods](https://stripe.com/payments/payment-methods-guide) with a single integration.

In addition to handling the `payment_intent.succeeded` event, we recommend handling these other events when collecting payments with the Payment Element:

| Event                                                                                                                           | Description                                                                                                                                                                                                                                                                         | Action                                                                                                                                                                                           |
| ------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| [payment_intent.succeeded](https://docs.stripe.com/api/events/types.md?lang=php#event_types-payment_intent.succeeded)           | Sent when a customer successfully completes a payment.                                                                                                                                                                                                                              | Send the customer an order confirmation and *fulfill* (Fulfillment is the process of providing the goods or services purchased by a customer, typically after payment is collected) their order. |
| [payment_intent.processing](https://docs.stripe.com/api/events/types.md?lang=php#event_types-payment_intent.processing)         | Sent when a customer successfully initiates a payment, but the payment has yet to complete. This event is most commonly sent when the customer initiates a bank debit. It’s followed by either a `payment_intent.succeeded` or `payment_intent.payment_failed` event in the future. | Send the customer an order confirmation that indicates their payment is pending. For digital goods, you might want to fulfill the order before waiting for payment to complete.                  |
| [payment_intent.payment_failed](https://docs.stripe.com/api/events/types.md?lang=php#event_types-payment_intent.payment_failed) | Sent when a customer attempts a payment, but the payment fails.                                                                                                                                                                                                                     | If a payment transitions from `processing` to `payment_failed`, offer the customer another attempt to pay.                                                                                       |

## Create a Transfer [Server-side]

On your server, send funds from your account to a connected account by creating a [Transfer](https://docs.stripe.com/api/transfers/create.md) and specifying the `transfer_group` used.

```curl
curl https://api.stripe.com/v1/transfers \
  -u "<<YOUR_SECRET_KEY>>:" \
  -d amount=7000 \
  -d currency=usd \
  -d "destination={{CONNECTEDACCOUNT_ID}}" \
  -d transfer_group=ORDER100
```

Transfer and charge amounts don’t have to match. You can split a single charge between multiple transfers or include multiple charges in a single transfer. The following example creates an additional transfer associated with the same `transfer_group`.

```curl
curl https://api.stripe.com/v1/transfers \
  -u "<<YOUR_SECRET_KEY>>:" \
  -d amount=2000 \
  -d currency=usd \
  -d destination={{OTHER_CONNECTED_ACCOUNT_ID}} \
  -d transfer_group=ORDER100
```

### Transfer options

You can assign any value to the `transfer_group` string, but it must represent a single business action. You can also make a transfer with neither an associated charge nor a `transfer_group`—for example, when you must pay a provider but there’s no associated customer payment.

> The `transfer_group` only identifies associated objects. It doesn’t affect any standard functionality. To prevent a transfer from executing before the funds from the associated charge are available, use the transfer’s `source_transaction` attribute.

By default, a transfer request fails when the amount exceeds the platform’s [available account balance](https://docs.stripe.com/connect/account-balances.md). Stripe doesn’t automatically retry failed transfer requests.

You can avoid failed transfer requests for transfers that are associated with charges. When you specify the associated charge [as the transfer’s source_transaction](https://docs.stripe.com/connect/separate-charges-and-transfers.md#transfer-availability), the transfer request automatically succeeds. However, we don’t execute the transfer until the funds from that charge are available in the platform account.

> If you use separate charges and transfers, take that into account when planning your *payout* (A payout is the transfer of funds to an external account, usually a bank account, in the form of a deposit) schedule. Automatic payouts can interfere with transfers that don’t have a defined `source_transaction`.

### Asynchronous payment methods

If you’re using *asynchronous payment methods* (Asynchronous payment methods can take up to several days to confirm whether the payment has been successful. During this time, the payment can't be guaranteed) (such as ACH Debit or SEPA Debit), wait for a [charge.succeeded](https://docs.stripe.com/api/events/types.md#event_types-charge.succeeded) event before creating a transfer. Unlike destination charges, Stripe doesn’t automatically reverse a transfer if the associated async payment fails. If you create a transfer and the payment subsequently fails, your platform’s balance is debited for the transfer amount. You must then manually [reverse the transfer](https://docs.stripe.com/connect/separate-charges-and-transfers.md#reverse-transfers) to recover the funds.

## Test the integration

#### Cards

| Card number         | Scenario                                                                                                                                                                                                                                                                                      | How to test                                                                                           |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| 4242424242424242    | The card payment succeeds and doesn’t require authentication.                                                                                                                                                                                                                                 | Fill out the credit card form using the credit card number with any expiration, CVC, and postal code. |
| 4000002500003155    | The card payment requires *authentication* (Strong Customer Authentication (SCA) is a regulatory requirement in effect as of September 14, 2019, that impacts many European online payments. It requires customers to use two-factor authentication like 3D Secure to verify their purchase). | Fill out the credit card form using the credit card number with any expiration, CVC, and postal code. |
| 4000000000009995    | The card is declined with a decline code like `insufficient_funds`.                                                                                                                                                                                                                           | Fill out the credit card form using the credit card number with any expiration, CVC, and postal code. |
| 6205500000000000004 | The UnionPay card has a variable length of 13-19 digits.                                                                                                                                                                                                                                      | Fill out the credit card form using the credit card number with any expiration, CVC, and postal code. |

#### Wallets

| Payment method | Scenario                                                                                                                                                                     | How to test                                                                                                                                                  |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Alipay         | Your customer successfully pays with a redirect-based and [immediate notification](https://docs.stripe.com/payments/payment-methods.md#payment-notification) payment method. | Choose any redirect-based payment method, fill out the required details, and confirm the payment. Then click **Complete test payment** on the redirect page. |

#### Bank redirects

| Payment method                         | Scenario                                                                                                                                                                                        | How to test                                                                                                                                                                                             |
| -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| BECS Direct Debit                      | Your customer successfully pays with BECS Direct Debit.                                                                                                                                         | Fill out the form using the account number `900123456` and BSB `000000`. The confirmed PaymentIntent initially transitions to `processing`, then transitions to the `succeeded` status 3 minutes later. |
| BECS Direct Debit                      | Your customer’s payment fails with an `account_closed` error code.                                                                                                                              | Fill out the form using the account number `111111113` and BSB `000000`.                                                                                                                                |
| Bancontact, EPS, iDEAL, and Przelewy24 | Your customer fails to authenticate on the redirect page for a redirect-based and immediate notification payment method.                                                                        | Choose any redirect-based payment method, fill out the required details, and confirm the payment. Then click **Fail test payment** on the redirect page.                                                |
| Pay by Bank                            | Your customer successfully pays with a redirect-based and [delayed notification](https://docs.stripe.com/payments/payment-methods.md#payment-notification) payment method.                      | Choose the payment method, fill out the required details, and confirm the payment. Then click **Complete test payment** on the redirect page.                                                           |
| Pay by Bank                            | Your customer fails to authenticate on the redirect page for a redirect-based and delayed notification payment method.                                                                          | Choose the payment method, fill out the required details, and confirm the payment. Then click **Fail test payment** on the redirect page.                                                               |
| BLIK                                   | BLIK payments fail in a variety of ways—immediate failures (for example, the code is expired or invalid), delayed errors (the bank declines) or timeouts (the customer didn’t respond in time). | Use email patterns to [simulate the different failures.](https://docs.stripe.com/payments/blik/accept-a-payment.md#simulate-failures)                                                                   |

#### Bank debits

| Payment method    | Scenario                                                                                          | How to test                                                                                                                                                                                       |
| ----------------- | ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SEPA Direct Debit | Your customer successfully pays with SEPA Direct Debit.                                           | Fill out the form using the account number `AT321904300235473204`. The confirmed PaymentIntent initially transitions to processing, then transitions to the succeeded status three minutes later. |
| SEPA Direct Debit | Your customer’s payment intent status transitions from `processing` to `requires_payment_method`. | Fill out the form using the account number `AT861904300235473202`.                                                                                                                                |

#### Vouchers

| Payment method | Scenario                                          | How to test                                                                                            |
| -------------- | ------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Boleto, OXXO   | Your customer pays with a Boleto or OXXO voucher. | Select Boleto or OXXO as the payment method and submit the payment. Close the dialog after it appears. |

See [Testing](https://docs.stripe.com/testing.md) for additional information to test your integration.

## Optional: Enable additional payment methods

Navigate to [Manage payment methods for your connected accounts](https://dashboard.stripe.com/settings/payment_methods/connected_accounts) in the Dashboard to configure which payment methods your connected accounts accept. Changes to default settings apply to all new and existing connected accounts.

Consult the following resources for payment method information:

- [A guide to payment methods](https://stripe.com/payments/payment-methods-guide#choosing-the-right-payment-methods-for-your-business) to help you choose the correct payment methods for your platform.
- [Account capabilities](https://docs.stripe.com/connect/account-capabilities.md) to make sure your chosen payment methods work for your connected accounts.
- [Payment method and product support](https://docs.stripe.com/payments/payment-methods/payment-method-support.md#product-support) tables to make sure your chosen payment methods work for your Stripe products and payments flows.

For each payment method, you can select one of the following dropdown options:

|  |
|  |
| **On by default**  | Your connected accounts accept this payment method during checkout. Some payment methods can only be off or blocked. This is because your connected accounts with *access to the Stripe Dashboard* (Platforms can provide connected accounts with access to the full Stripe Dashboard or the Express Dashboard. Otherwise, platforms build an interface for connected accounts using embedded components or the Stripe API) must activate them in their settings page. |
| **Off by default** | Your connected accounts don’t accept this payment method during checkout. If you allow your connected accounts with *access to the Stripe Dashboard* (Platforms can provide connected accounts with access to the full Stripe Dashboard or the Express Dashboard. Otherwise, platforms build an interface for connected accounts using embedded components or the Stripe API) to manage their own payment methods, they have the ability to turn it on.                |
| **Blocked**        | Your connected accounts don’t accept this payment method during checkout. If you allow your connected accounts with *access to the Stripe Dashboard* (Platforms can provide connected accounts with access to the full Stripe Dashboard or the Express Dashboard. Otherwise, platforms build an interface for connected accounts using embedded components or the Stripe API) to manage their own payment methods, they don’t have the option to turn it on.           |
![Dropdown options for payment methods, each showing an available option (blocked, on by default, off by default)](https://b.stripecdn.com/docs-statics-srv/assets/dropdowns.ef651d721d5939d81521dd34dde4577f.png)

Payment method options

If you make a change to a payment method, you must click **Review changes** in the bottom bar of your screen and **Save and apply** to update your connected accounts.
![Dialog that shows after clicking Save button with a list of what the user changed](https://b.stripecdn.com/docs-statics-srv/assets/dialog.a56ea7716f60db9778706790320d13be.png)

Save dialog

### Allow connected accounts to manage payment methods

Stripe recommends allowing your connected accounts to customize their own payment methods. This option allows each connected account with *access to the Stripe Dashboard* (Platforms can provide connected accounts with access to the full Stripe Dashboard or the Express Dashboard. Otherwise, platforms build an interface for connected accounts using embedded components or the Stripe API) to view and update their [Payment methods](https://dashboard.stripe.com/settings/payment_methods) page. Only owners of the connected accounts can customize their payment methods. The Stripe Dashboard displays the set of payment method defaults you applied to all new and existing connected accounts. Your connected accounts can override these defaults, excluding payment methods you have blocked.

Check the **Account customization** checkbox to enable this option. You must click **Review changes** in the bottom bar of your screen and then select **Save and apply** to update this setting.
![Screenshot of the checkbox to select when allowing connected owners to customize payment methods](https://b.stripecdn.com/docs-statics-srv/assets/checkbox.275bd35d2a025272f03af029a144e577.png)

Account customization checkbox

### Payment method capabilities

To allow your connected accounts to accept additional payment methods, their `Accounts` must have active payment method capabilities.

If you selected the “On by default” option for a payment method in [Manage payment methods for your connected accounts](https://dashboard.stripe.com/settings/payment_methods/connected_accounts), Stripe automatically requests the necessary capability for new and existing connected accounts if they meet the verification requirements. If the connected account doesn’t meet the requirements or if you want to have direct control, you can manually request the capability in the Dashboard or with the API.

Most payment methods have the same verification requirements as the `card_payments` capability, with some restrictions and exceptions. The [payment method capabilities table](https://docs.stripe.com/connect/account-capabilities.md#payment-methods) lists the payment methods that require additional verification.

#### Dashboard

[Find a connected account](https://docs.stripe.com/connect/dashboard/managing-individual-accounts.md#finding-accounts) in the Dashboard to edit its capabilities and view outstanding verification requirements.

#### Accounts v2 API

For an existing connected account, you can retrieve the `Account` and inspect their [merchant capabilities](https://docs.stripe.com/api/v2/core/accounts/retrieve.md#v2_retrieve_accounts-response-configuration-merchant-capabilities) to determine whether you need to request additional capabilities.

```curl
curl -G https://api.stripe.com/v2/core/accounts/{{CONNECTEDACCOUNT_ID}} \
  -H "Authorization: Bearer <<YOUR_SECRET_KEY>>" \
  -H "Stripe-Version: 2025-11-17.preview" \
  -d "include[0]=configuration.merchant"
```

Request additional capabilities by [updating](https://docs.stripe.com/api/v2/core/accounts/update.md#v2_update_accounts-configuration-merchant-capabilities) each connected account’s capabilities.

```curl
curl -X POST https://api.stripe.com/v2/accounts/{{CONNECTEDACCOUNT_ID}} \
  -H "Authorization: Bearer <<YOUR_SECRET_KEY>>" \
  -H "Stripe-Version: 2025-11-17.preview" \
  --json '{
    "configuration": {
        "merchant": {
            "capabilities": {
                "ach_debit_payments": {
                    "requested": true
                }
            }
        }
    },
    "include": [
        "configuration.merchant",
        "requirements"
    ]
  }'
```

Requested capabilities might be delayed before becoming active. If the capability has any activation requirements, the response includes them in the `requirements` arrays.

#### Accounts v1 API

For an existing connected account, you can [list](https://docs.stripe.com/api/capabilities/list.md) their existing capabilities to determine whether you need to request additional capabilities.

```curl
curl https://api.stripe.com/v1/accounts/{{CONNECTEDACCOUNT_ID}}/capabilities \
  -u "<<YOUR_SECRET_KEY>>:"
```

Request additional capabilities by [updating](https://docs.stripe.com/api/capabilities/update.md) each connected account’s capabilities.

```curl
curl https://api.stripe.com/v1/accounts/{{CONNECTEDACCOUNT_ID}}/capabilities/us_bank_account_ach_payments \
  -u "<<YOUR_SECRET_KEY>>:" \
  -d requested=true
```

There can be a delay before the requested capability becomes active. If the capability has any activation requirements, the response includes them in the `requirements` arrays.

## Specify the settlement merchant 

The settlement merchant is dependent on the [capabilities](https://docs.stripe.com/connect/account-capabilities.md) set on an account and how a charge is created. The settlement merchant determines whose information is used to make the charge. This includes the statement descriptor (either the platform’s or the connected account’s) that’s displayed on the customer’s credit card or bank statement for that charge.

Specifying the settlement merchant allows you to be more explicit about who to create charges for. For example, some platforms prefer to be the settlement merchant because the end customer interacts directly with their platform (such as on-demand platforms). However, some platforms have connected accounts that interact directly with end customers instead (such as a storefront on an e-commerce platform). In these scenarios, it might make more sense for the connected account to be the settlement merchant.

You can set the `on_behalf_of` parameter to the ID of a connected account to make that account the settlement merchant for the payment. When using `on_behalf_of`:

- Charges *settle* (When funds are available in your Stripe balance) in the connected account’s country and *settlement currency* (The settlement currency is the currency your bank account uses).
- The fee structure for the connected account’s country is used.
- The connected account’s statement descriptor is displayed on the customer’s credit card statement.
- If the connected account is in a different country than the platform, the connected account’s address and phone number are displayed on the customer’s credit card statement.
- The number of days that a [pending balance](https://docs.stripe.com/connect/account-balances.md) is held before being paid out depends on the [delay_days](https://docs.stripe.com/api/accounts/create.md#create_account-settings-payouts-schedule-delay_days) setting on the connected account.

> #### Accounts v2 API
> 
> You can’t use the Accounts v2 API to manage payout settings. Use the Accounts v1 API.

If `on_behalf_of` is omitted, the platform is the business of record for the payment.

> The `on_behalf_of` parameter is supported only for connected accounts with a payments capability such as [card_payments](https://docs.stripe.com/connect/account-capabilities.md#card-payments). Accounts under the [recipient service agreement](https://docs.stripe.com/connect/service-agreement-types.md#recipient) can’t request `card_payments` or other payments capabilities.

```curl
curl https://api.stripe.com/v1/payment_intents \
  -u "<<YOUR_SECRET_KEY>>:" \
  -d amount=10000 \
  -d currency=eur \
  -d "automatic_payment_methods[enabled]=true" \
  -d "on_behalf_of={{CONNECTEDACCOUNT_ID}}" \
  -d transfer_group=ORDER100
```
![](https://b.stripecdn.com/docs-statics-srv/assets/ios-overview.9e0d68d009dc005f73a6f5df69e00458.png)

Integrate Stripe’s prebuilt payment UI into the checkout of your iOS app with the [PaymentSheet](https://stripe.dev/stripe-ios/stripe-paymentsheet/Classes/PaymentSheet.html) class. See our sample integration [on GitHub](https://github.com/stripe/stripe-ios/tree/master/Example/PaymentSheet%20Example).

## Set up Stripe [Server-side] [Client-side]

### Server-side 

This integration requires endpoints on your server that talk to the Stripe API. Use our official libraries for access to the Stripe API from your server:

#### Ruby

```bash
# Available as a gem
sudo gem install stripe
```

```ruby
# If you use bundler, you can add this line to your Gemfile
gem 'stripe'
```

### Client-side 

The [Stripe iOS SDK](https://github.com/stripe/stripe-ios) is open source, [fully documented](https://stripe.dev/stripe-ios/index.html), and compatible with apps supporting iOS 13 or above.

#### Swift Package Manager

To install the SDK, follow these steps:

1. In Xcode, select **File** > **Add Package Dependencies…** and enter `https://github.com/stripe/stripe-ios-spm` as the repository URL.
1. Select the latest version number from our [releases page](https://github.com/stripe/stripe-ios/releases).
1. Add the **StripePaymentSheet** product to the [target of your app](https://developer.apple.com/documentation/swift_packages/adding_package_dependencies_to_your_app).

#### CocoaPods

1. If you haven’t already, install the latest version of [CocoaPods](https://guides.cocoapods.org/using/getting-started.html).
1. If you don’t have an existing [Podfile](https://guides.cocoapods.org/syntax/podfile.html), run the following command to create one:
   ```bash
   pod init
   ```
1. Add this line to your `Podfile`:
   ```podfile
   pod 'StripePaymentSheet'
   ```
1. Run the following command:
   ```bash
   pod install
   ```
1. Don’t forget to use the `.xcworkspace` file to open your project in Xcode, instead of the `.xcodeproj` file, from here on out.
1. In the future, to update to the latest version of the SDK, run:
   ```bash
   pod update StripePaymentSheet
   ```

#### Carthage

1. If you haven’t already, install the latest version of [Carthage](https://github.com/Carthage/Carthage#installing-carthage).
1. Add this line to your `Cartfile`:
   ```cartfile
   github "stripe/stripe-ios"
   ```
1. Follow the [Carthage installation instructions](https://github.com/Carthage/Carthage#if-youre-building-for-ios-tvos-or-watchos). Make sure to embed all of the required frameworks listed [here](https://github.com/stripe/stripe-ios/tree/master/StripePaymentSheet/README.md#manual-linking).
1. In the future, to update to the latest version of the SDK, run the following command:
   ```bash
   carthage update stripe-ios --platform ios
   ```

#### Manual Framework

1. Head to our [GitHub releases page](https://github.com/stripe/stripe-ios/releases/latest) and download and unzip **Stripe.xcframework.zip**.
1. Drag **StripePaymentSheet.xcframework** to the **Embedded Binaries** section of the **General** settings in your Xcode project. Make sure to select **Copy items if needed**.
1. Repeat step 2 for all required frameworks listed [here](https://github.com/stripe/stripe-ios/tree/master/StripePaymentSheet/README.md#manual-linking).
1. In the future, to update to the latest version of our SDK, repeat steps 1–3.

> For details on the latest SDK release and past versions, see the [Releases](https://github.com/stripe/stripe-ios/releases) page on GitHub. To receive notifications when a new release is published, [watch releases](https://help.github.com/en/articles/watching-and-unwatching-releases-for-a-repository#watching-releases-for-a-repository) for the repository.

Configure the SDK with your Stripe [publishable key](https://dashboard.stripe.com/test/apikeys) on app start. This enables your app to make requests to the Stripe API.

#### Swift

```swift
import UIKitimportStripePaymentSheet

@main
class AppDelegate: UIResponder, UIApplicationDelegate {

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {StripeAPI.defaultPublishableKey = "<<YOUR_PUBLISHABLE_KEY>>"
        // do any other necessary launch configuration
        return true
    }
}
```

> Use your [test keys](https://docs.stripe.com/keys.md#obtain-api-keys) while you test and develop, and your [live mode](https://docs.stripe.com/keys.md#test-live-modes) keys when you publish your app.

## Add an endpoint [Server-side]

This integration uses three Stripe API objects:

1. A [PaymentIntent](https://docs.stripe.com/api/payment_intents.md). Stripe uses this to represent your intent to collect a payment from a customer, tracking your charge attempts and payment state changes throughout the process.
1. A *Customer* (Customer objects represent customers of your business. They let you reuse payment methods and give you the ability to track multiple payments)(optional). To set up a payment method for future payments, it must be attached to a Customer. Create a Customer object when your customer creates an account with your business. If your customer is making a payment as a guest, you can create a Customer object before payment and associate it with your own internal representation of the customer’s account later.
1. A Customer Ephemeral Key (optional). Information on the Customer object is sensitive, and can’t be retrieved directly from an app. An Ephemeral Key grants the SDK temporary access to the Customer.

If you want to save cards and allow returning customers to reuse saved cards, you need the Customer and Customer Ephemeral Key objects for your integration. Otherwise, you can omit these objects.

For security reasons, your app can’t create these objects. Instead, add an endpoint on your server that:

1. Retrieves the Customer, or creates a new one.
1. Creates an Ephemeral Key for the Customer.
1. Creates a PaymentIntent with the [amount](https://docs.stripe.com/api/payment_intents/create.md#create_payment_intent-amount), [currency](https://docs.stripe.com/api/payment_intents/create.md#create_payment_intent-currency), [customer](https://docs.stripe.com/api/payment_intents/create.md#create_payment_intent-customer), and a [transfer group](https://docs.stripe.com/api/payment_intents/create.md#create_payment_intent-transfer_group) to associate with the transfer of funds later.
1. Returns the Payment Intent’s *client secret* (The client secret is a unique key returned from Stripe as part of a PaymentIntent. This key lets the client access important fields from the PaymentIntent (status, amount, currency) while hiding sensitive ones (metadata, customer)), the Ephemeral Key’s `secret`, the [Customer ID](https://docs.stripe.com/api/customers/object.md#customer_object-id), and your [publishable key](https://dashboard.stripe.com/apikeys) to your app.

> #### Accounts v2 API
> 
> Instead of passing a `Customer` ID in the `customer` parameter, you can pass the ID of an `Account` that has the `customer` configuration in the [customer_account](https://docs.stripe.com/api/payment_intents/create.md?api-version=preview#create_payment_intent-customer_account) parameter. In that case, the `Account` ID returns in the [customer_account](https://docs.stripe.com/api/payment_intents/object.md?api-version=preview#payment_intent_object-customer_account) property.

The payment methods shown to customers during the checkout process are also included on the PaymentIntent. You can let Stripe pull payment methods from your [Dashboard settings](https://dashboard.stripe.com/settings/payment_methods) or you can list them manually.

Unless your integration requires a code-based option for offering payment methods, don’t list payment methods manually. Stripe evaluates the currency, payment method restrictions, and other parameters to determine the list of supported payment methods. Stripe prioritizes payment methods that help increase conversion and are most relevant to the currency and the customer’s location. We hide lower priority payment methods in an overflow menu.

#### Manage payment methods from the Dashboard

You can fork and deploy an implementation of this endpoint on [CodeSandbox](https://codesandbox.io/p/devbox/suspicious-lalande-l325w6) for testing.

#### curl

```bash
# Create a Customer (use an existing Customer ID if this is a returning customer)
curl https://api.stripe.com/v1/customers \
  -u <<YOUR_SECRET_KEY>>: \
  -X "POST"

# Create an Ephemeral Key for the Customer
curl https://api.stripe.com/v1/ephemeral_keys \
  -u <<YOUR_SECRET_KEY>>: \
  -H "Stripe-Version: 2025-07-30.basil" \
  -X "POST" \
  -d "customer"="{{CUSTOMER_ID}}" \

# Create a PaymentIntent
curl https://api.stripe.com/v1/payment_intents \
  -u <<YOUR_SECRET_KEY>>: \
  -X "POST" \
  -d "customer"="{{CUSTOMER_ID}}" \
  -d "amount"=10000 \
  -d "currency"="usd" \
  # In the latest version of the API, specifying the `automatic_payment_methods` parameter
  # is optional because Stripe enables its functionality by default.
  -d "automatic_payment_methods[enabled]"=true \
  -d transfer_group="ORDER100" \
```

#### Listing payment methods manually

You can fork and deploy an implementation of this endpoint on [CodeSandbox](https://codesandbox.io/p/devbox/suspicious-lalande-l325w6) for testing.

#### curl

```bash
# Create a Customer (use an existing Customer ID if this is a returning customer)
curl https://api.stripe.com/v1/customers \
  -u <<YOUR_SECRET_KEY>>: \
  -X "POST"

# Create an Ephemeral Key for the Customer
curl https://api.stripe.com/v1/ephemeral_keys \
  -u <<YOUR_SECRET_KEY>>: \
  -H "Stripe-Version: 2025-07-30.basil" \
  -X "POST" \
  -d "customer"="{{CUSTOMER_ID}}" \

# Create a PaymentIntent
curl https://api.stripe.com/v1/payment_intents \
  -u <<YOUR_SECRET_KEY>>: \
  -X "POST" \
  -d "customer"="{{CUSTOMER_ID}}" \
  -d "amount"=10000 \
  -d "currency"="eur" \
  -d "payment_method_types[]"="bancontact" \
  -d "payment_method_types[]"="card" \
  -d "payment_method_types[]"="ideal" \
  -d "payment_method_types[]"="klarna" \
  -d "payment_method_types[]"="sepa_debit" \
  -d transfer_group="ORDER100" \
```

Each payment method needs to support the currency passed in the PaymentIntent and your business needs to be based in one of the countries each payment method supports. See the [Payment method integration options](https://docs.stripe.com/payments/payment-methods/integration-options.md) page for more details about what’s supported.

## Integrate the payment sheet [Client-side]

To display the mobile Payment Element on your checkout screen, make sure you:

- Display the products the customer is purchasing along with the total amount
- Use the [Address Element](https://docs.stripe.com/elements/address-element.md?platform=ios) to collect any required shipping information from the customer
- Add a checkout button to display Stripe’s UI

#### UIKit

In your app’s checkout screen, fetch the PaymentIntent client secret, CustomerSession client secret, Customer ID, and publishable key from the endpoint you created in the previous step. Use `STPAPIClient.shared` to set your publishable key and initialize the [PaymentSheet](https://stripe.dev/stripe-ios/stripe-paymentsheet/Classes/PaymentSheet.html).

#### iOS (Swift)

```swift
import UIKit@_spi(CustomerSessionBetaAccess) import StripePaymentSheet

class CheckoutViewController: UIViewController {
  @IBOutlet weak var checkoutButton: UIButton!
  var paymentSheet: PaymentSheet?
  let backendCheckoutUrl = URL(string: "Your backend endpoint/payment-sheet")! // Your backend endpoint

  override func viewDidLoad() {
    super.viewDidLoad()

    checkoutButton.addTarget(self, action: #selector(didTapCheckoutButton), for: .touchUpInside)
    checkoutButton.isEnabled = false

    // MARK: Fetch the PaymentIntent client secret, CustomerSession client secret, Customer ID, and publishable key
    var request = URLRequest(url: backendCheckoutUrl)
    request.httpMethod = "POST"
    let task = URLSession.shared.dataTask(with: request, completionHandler: { [weak self] (data, response, error) in
      guard let data = data,
            let json = try? JSONSerialization.jsonObject(with: data, options: []) as? [String : Any],
            let customerId = json["customer"] as? String,
            let customerSessionClientSecret = json["customerSessionClientSecret"] as? String,
            let paymentIntentClientSecret = json["paymentIntent"] as? String,
            let publishableKey = json["publishableKey"] as? String,
            let self = self else {
        // Handle error
        return
      }
STPAPIClient.shared.publishableKey = publishableKey// MARK: Create a PaymentSheet instance
      var configuration = PaymentSheet.Configuration()
      configuration.merchantDisplayName = "Example, Inc."
      configuration.customer = .init(id: customerId, customerSessionClientSecret: customerSessionClientSecret)
      // Set `allowsDelayedPaymentMethods` to true if your business handles
      // delayed notification payment methods like US bank accounts.
      configuration.allowsDelayedPaymentMethods = true
      self.paymentSheet = PaymentSheet(paymentIntentClientSecret:paymentIntentClientSecret, configuration: configuration)

      DispatchQueue.main.async {
        self.checkoutButton.isEnabled = true
      }
    })
    task.resume()
  }

}
```

When the customer taps the **Checkout** button, call `present` to present the PaymentSheet. After the customer completes the payment, Stripe dismisses the PaymentSheet and calls the completion block with [PaymentSheetResult](https://stripe.dev/stripe-ios/stripe-paymentsheet/Enums/PaymentSheetResult.html).

#### iOS (Swift)

```swift
@objc
func didTapCheckoutButton() {
  // MARK: Start the checkout process
  paymentSheet?.present(from: self) { paymentResult in
    // MARK: Handle the payment result
    switch paymentResult {
    case .completed:
      print("Your order is confirmed")
    case .canceled:
      print("Canceled!")
    case .failed(let error):
      print("Payment failed: \(error)")
    }
  }
}
```

#### SwiftUI

Create an `ObservableObject` model for your checkout screen. This model publishes a [PaymentSheet](https://stripe.dev/stripe-ios/stripe-paymentsheet/Classes/PaymentSheet.html) and a [PaymentSheetResult](https://stripe.dev/stripe-ios/stripe-paymentsheet/Enums/PaymentSheetResult.html).

```swift
import StripePaymentSheet
import SwiftUI

class CheckoutViewModel: ObservableObject {
  let backendCheckoutUrl = URL(string: "Your backend endpoint/payment-sheet")! // Your backend endpoint
  @Published var paymentSheet: PaymentSheet?
  @Published var paymentResult: PaymentSheetResult?
}
```

Fetch the PaymentIntent client secret, CustomerSession client secret, Customer ID, and publishable key from the endpoint you created in the previous step. Use `STPAPIClient.shared` to set your publishable key and initialize the [PaymentSheet](https://stripe.dev/stripe-ios/stripe-paymentsheet/Classes/PaymentSheet.html).

```swift
@_spi(CustomerSessionBetaAccess) import StripePaymentSheet
import SwiftUI

class CheckoutViewModel: ObservableObject {
  let backendCheckoutUrl = URL(string: "Your backend endpoint/payment-sheet")! // Your backend endpoint
  @Published var paymentSheet: PaymentSheet?
  @Published var paymentResult: PaymentSheetResult?
func preparePaymentSheet() {
    // MARK: Fetch thePaymentIntent and Customer information from the backend
    var request = URLRequest(url: backendCheckoutUrl)
    request.httpMethod = "POST"
    let task = URLSession.shared.dataTask(with: request, completionHandler: { [weak self] (data, response, error) in
      guard let data = data,
            let json = try? JSONSerialization.jsonObject(with: data, options: []) as? [String : Any],
            let customerId = json["customer"] as? String,
            let customerSessionClientSecret = json["customerSessionClientSecret"] as? String,
            letpaymentIntentClientSecret = json["paymentIntent"] as? String,
            let publishableKey = json["publishableKey"] as? String,
            let self = self else {
        // Handle error
        return
      }

      STPAPIClient.shared.publishableKey = publishableKey// MARK: Create a PaymentSheet instance
      var configuration = PaymentSheet.Configuration()
      configuration.merchantDisplayName = "Example, Inc."
      configuration.customer = .init(id: customerId, customerSessionClientSecret: customerSessionClientSecret)
      // Set `allowsDelayedPaymentMethods` to true if your business handles
      // delayed notification payment methods like US bank accounts.
      configuration.allowsDelayedPaymentMethods = true

      DispatchQueue.main.async {
        self.paymentSheet = PaymentSheet(paymentIntentClientSecret:paymentIntentClientSecret, configuration: configuration)
      }
    })
    task.resume()
  }
}
struct CheckoutView: View {
  @ObservedObject var model = CheckoutViewModel()

  var body: some View {
    VStack {
      if model.paymentSheet != nil {
        Text("Ready to pay.")
      } else {
        Text("Loading…")
      }
    }.onAppear { model.preparePaymentSheet() }
  }
}
```

Add a [PaymentSheet.PaymentButton](https://stripe.dev/stripe-ios/stripe-paymentsheet/Classes/PaymentSheet/PaymentButton.html) to your `View`. This behaves similarly to a SwiftUI `Button`, which allows you to customize it by adding a `View`. When you tap the button, it displays the PaymentSheet. After you complete the payment, Stripe dismisses the PaymentSheet and calls the `onCompletion` handler with a [PaymentSheetResult](https://stripe.dev/stripe-ios/stripe-paymentsheet/Enums/PaymentSheetResult.html) object.

```swift
@_spi(CustomerSessionBetaAccess) import StripePaymentSheet
import SwiftUI

class CheckoutViewModel: ObservableObject {
  let backendCheckoutUrl = URL(string: "Your backend endpoint/payment-sheet")! // Your backend endpoint
  @Published var paymentSheet: PaymentSheet?
  @Published var paymentResult: PaymentSheetResult?

  func preparePaymentSheet() {
    // MARK: Fetch the PaymentIntent and Customer information from the backend
    var request = URLRequest(url: backendCheckoutUrl)
    request.httpMethod = "POST"
    let task = URLSession.shared.dataTask(with: request, completionHandler: { [weak self] (data, response, error) in
      guard let data = data,
            let json = try? JSONSerialization.jsonObject(with: data, options: []) as? [String : Any],
            let customerId = json["customer"] as? String,
            let customerSessionClientSecret = json["customerSessionClientSecret"] as? String,
            let paymentIntentClientSecret = json["paymentIntent"] as? String,
            let publishableKey = json["publishableKey"] as? String,
            let self = self else {
        // Handle error
        return
      }

      STPAPIClient.shared.publishableKey = publishableKey
      // MARK: Create a PaymentSheet instance
      var configuration = PaymentSheet.Configuration()
      configuration.merchantDisplayName = "Example, Inc."
      configuration.customer = .init(id: customerId, customerSessionClientSecret: customerSessionClientSecret)
      // Set `allowsDelayedPaymentMethods` to true if your business can handle payment methods
      // that complete payment after a delay, like SEPA Debit and Sofort.
      configuration.allowsDelayedPaymentMethods = true

      DispatchQueue.main.async {
        self.paymentSheet = PaymentSheet(paymentIntentClientSecret: paymentIntentClientSecret, configuration: configuration)
      }
    })
    task.resume()
  }
func onPaymentCompletion(result: PaymentSheetResult) {
    self.paymentResult = result
  }
}

struct CheckoutView: View {
  @ObservedObject var model = CheckoutViewModel()

  var body: some View {
    VStack {if let paymentSheet = model.paymentSheet {
        PaymentSheet.PaymentButton(
          paymentSheet: paymentSheet,
          onCompletion: model.onPaymentCompletion
        ) {
          Text("Buy")
        }
      } else {
        Text("Loading…")
      }if let result = model.paymentResult {
        switch result {
        case .completed:
          Text("Payment complete")
        case .failed(let error):
          Text("Payment failed: \(error.localizedDescription)")
        case .canceled:
          Text("Payment canceled.")
        }
      }
    }.onAppear { model.preparePaymentSheet() }
  }
}
```

If `PaymentSheetResult` is `.completed`, inform the user (for example, by displaying an order confirmation screen).

Setting `allowsDelayedPaymentMethods` to true allows [delayed notification](https://docs.stripe.com/payments/payment-methods.md#payment-notification) payment methods like US bank accounts. For these payment methods, the final payment status isn’t known when the `PaymentSheet` completes, and instead succeeds or fails later. If you support these types of payment methods, inform the customer their order is confirmed and only fulfill their order (for example, ship their product) when the payment is successful.

## Set up a return URL [Client-side]

The customer might navigate away from your app to authenticate (for example, in Safari or their banking app). To allow them to automatically return to your app after authenticating, [configure a custom URL scheme](https://developer.apple.com/documentation/xcode/defining-a-custom-url-scheme-for-your-app) and set up your app delegate to forward the URL to the SDK. Stripe doesn’t support [universal links](https://developer.apple.com/documentation/xcode/allowing-apps-and-websites-to-link-to-your-content).

#### SceneDelegate

#### Swift

```swift
// This method handles opening custom URL schemes (for example, "your-app://stripe-redirect")
func scene(_ scene: UIScene, openURLContexts URLContexts: Set<UIOpenURLContext>) {
    guard let url = URLContexts.first?.url else {
        return
    }
    let stripeHandled = StripeAPI.handleURLCallback(with: url)
    if (!stripeHandled) {
        // This was not a Stripe url – handle the URL normally as you would
    }
}

```

#### AppDelegate

#### Swift

```swift
// This method handles opening custom URL schemes (for example, "your-app://stripe-redirect")
func application(_ app: UIApplication, open url: URL, options: [UIApplication.OpenURLOptionsKey: Any] = [:]) -> Bool {
    let stripeHandled = StripeAPI.handleURLCallback(with: url)
    if (stripeHandled) {
        return true
    } else {
        // This was not a Stripe url – handle the URL normally as you would
    }
    return false
}
```

#### SwiftUI

#### Swift

```swift

@main
struct MyApp: App {
  var body: some Scene {
    WindowGroup {
      Text("Hello, world!").onOpenURL { incomingURL in
          let stripeHandled = StripeAPI.handleURLCallback(with: incomingURL)
          if (!stripeHandled) {
            // This was not a Stripe url – handle the URL normally as you would
          }
        }
    }
  }
}
```

## Handle post-payment events [Server-side]

Stripe sends a [payment_intent.succeeded](https://docs.stripe.com/api/events/types.md#event_types-payment_intent.succeeded) event when the payment completes. Use the [Dashboard webhook tool](https://dashboard.stripe.com/webhooks) or follow the [webhook guide](https://docs.stripe.com/webhooks/quickstart.md) to receive these events and run actions, such as sending an order confirmation email to your customer, logging the sale in a database, or starting a shipping workflow.

Listen for these events rather than waiting on a callback from the client. On the client, the customer could close the browser window or quit the app before the callback executes, and malicious clients could manipulate the response. Setting up your integration to listen for asynchronous events is what enables you to accept [different types of payment methods](https://stripe.com/payments/payment-methods-guide) with a single integration.

In addition to handling the `payment_intent.succeeded` event, we recommend handling these other events when collecting payments with the Payment Element:

| Event                                                                                                                           | Description                                                                                                                                                                                                                                                                         | Action                                                                                                                                                                                           |
| ------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| [payment_intent.succeeded](https://docs.stripe.com/api/events/types.md?lang=php#event_types-payment_intent.succeeded)           | Sent when a customer successfully completes a payment.                                                                                                                                                                                                                              | Send the customer an order confirmation and *fulfill* (Fulfillment is the process of providing the goods or services purchased by a customer, typically after payment is collected) their order. |
| [payment_intent.processing](https://docs.stripe.com/api/events/types.md?lang=php#event_types-payment_intent.processing)         | Sent when a customer successfully initiates a payment, but the payment has yet to complete. This event is most commonly sent when the customer initiates a bank debit. It’s followed by either a `payment_intent.succeeded` or `payment_intent.payment_failed` event in the future. | Send the customer an order confirmation that indicates their payment is pending. For digital goods, you might want to fulfill the order before waiting for payment to complete.                  |
| [payment_intent.payment_failed](https://docs.stripe.com/api/events/types.md?lang=php#event_types-payment_intent.payment_failed) | Sent when a customer attempts a payment, but the payment fails.                                                                                                                                                                                                                     | If a payment transitions from `processing` to `payment_failed`, offer the customer another attempt to pay.                                                                                       |

## Create a Transfer [Server-side]

On your server, send funds from your account to a connected account by creating a [Transfer](https://docs.stripe.com/api/transfers/create.md) and specifying the `transfer_group` used.

```curl
curl https://api.stripe.com/v1/transfers \
  -u "<<YOUR_SECRET_KEY>>:" \
  -d amount=7000 \
  -d currency=usd \
  -d "destination={{CONNECTEDACCOUNT_ID}}" \
  -d transfer_group=ORDER100
```

Transfer and charge amounts don’t have to match. You can split a single charge between multiple transfers or include multiple charges in a single transfer. The following example creates an additional transfer associated with the same `transfer_group`.

```curl
curl https://api.stripe.com/v1/transfers \
  -u "<<YOUR_SECRET_KEY>>:" \
  -d amount=2000 \
  -d currency=usd \
  -d destination={{OTHER_CONNECTED_ACCOUNT_ID}} \
  -d transfer_group=ORDER100
```

### Transfer options

You can assign any value to the `transfer_group` string, but it must represent a single business action. You can also make a transfer with neither an associated charge nor a `transfer_group`—for example, when you must pay a provider but there’s no associated customer payment.

> The `transfer_group` only identifies associated objects. It doesn’t affect any standard functionality. To prevent a transfer from executing before the funds from the associated charge are available, use the transfer’s `source_transaction` attribute.

By default, a transfer request fails when the amount exceeds the platform’s [available account balance](https://docs.stripe.com/connect/account-balances.md). Stripe doesn’t automatically retry failed transfer requests.

You can avoid failed transfer requests for transfers that are associated with charges. When you specify the associated charge [as the transfer’s source_transaction](https://docs.stripe.com/connect/separate-charges-and-transfers.md#transfer-availability), the transfer request automatically succeeds. However, we don’t execute the transfer until the funds from that charge are available in the platform account.

> If you use separate charges and transfers, take that into account when planning your *payout* (A payout is the transfer of funds to an external account, usually a bank account, in the form of a deposit) schedule. Automatic payouts can interfere with transfers that don’t have a defined `source_transaction`.

### Asynchronous payment methods

If you’re using *asynchronous payment methods* (Asynchronous payment methods can take up to several days to confirm whether the payment has been successful. During this time, the payment can't be guaranteed) (such as ACH Debit or SEPA Debit), wait for a [charge.succeeded](https://docs.stripe.com/api/events/types.md#event_types-charge.succeeded) event before creating a transfer. Unlike destination charges, Stripe doesn’t automatically reverse a transfer if the associated async payment fails. If you create a transfer and the payment subsequently fails, your platform’s balance is debited for the transfer amount. You must then manually [reverse the transfer](https://docs.stripe.com/connect/separate-charges-and-transfers.md#reverse-transfers) to recover the funds.

## Test the integration

#### Cards

| Card number         | Scenario                                                                                                                                                                                                                                                                                      | How to test                                                                                           |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| 4242424242424242    | The card payment succeeds and doesn’t require authentication.                                                                                                                                                                                                                                 | Fill out the credit card form using the credit card number with any expiration, CVC, and postal code. |
| 4000002500003155    | The card payment requires *authentication* (Strong Customer Authentication (SCA) is a regulatory requirement in effect as of September 14, 2019, that impacts many European online payments. It requires customers to use two-factor authentication like 3D Secure to verify their purchase). | Fill out the credit card form using the credit card number with any expiration, CVC, and postal code. |
| 4000000000009995    | The card is declined with a decline code like `insufficient_funds`.                                                                                                                                                                                                                           | Fill out the credit card form using the credit card number with any expiration, CVC, and postal code. |
| 6205500000000000004 | The UnionPay card has a variable length of 13-19 digits.                                                                                                                                                                                                                                      | Fill out the credit card form using the credit card number with any expiration, CVC, and postal code. |

#### Bank redirects

| Payment method    | Scenario                                                                                                                                                                                        | How to test                                                                                                                                              |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Bancontact, iDEAL | Your customer fails to authenticate on the redirect page for a redirect-based and immediate notification payment method.                                                                        | Choose any redirect-based payment method, fill out the required details, and confirm the payment. Then click **Fail test payment** on the redirect page. |
| Pay by Bank       | Your customer successfully pays with a redirect-based and [delayed notification](https://docs.stripe.com/payments/payment-methods.md#payment-notification) payment method.                      | Choose the payment method, fill out the required details, and confirm the payment. Then click **Complete test payment** on the redirect page.            |
| Pay by Bank       | Your customer fails to authenticate on the redirect page for a redirect-based and delayed notification payment method.                                                                          | Choose the payment method, fill out the required details, and confirm the payment. Then click **Fail test payment** on the redirect page.                |
| BLIK              | BLIK payments fail in a variety of ways—immediate failures (for example, the code is expired or invalid), delayed errors (the bank declines) or timeouts (the customer didn’t respond in time). | Use email patterns to [simulate the different failures.](https://docs.stripe.com/payments/blik/accept-a-payment.md#simulate-failures)                    |

#### Bank debits

| Payment method    | Scenario                                                                                          | How to test                                                                                                                                                                                       |
| ----------------- | ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SEPA Direct Debit | Your customer successfully pays with SEPA Direct Debit.                                           | Fill out the form using the account number `AT321904300235473204`. The confirmed PaymentIntent initially transitions to processing, then transitions to the succeeded status three minutes later. |
| SEPA Direct Debit | Your customer’s payment intent status transitions from `processing` to `requires_payment_method`. | Fill out the form using the account number `AT861904300235473202`.                                                                                                                                |

See [Testing](https://docs.stripe.com/testing.md) for additional information to test your integration.

## Enable card scanning

To enable card scanning support for iOS, set the `NSCameraUsageDescription` (**Privacy - Camera Usage Description**) in the `Info.plist` of your application, and provide a reason for accessing the camera (for example, “To scan cards”).

## Optional: Enable Apple Pay

> If your checkout screen has a dedicated **Apple Pay button**, follow the [Apple Pay guide](https://docs.stripe.com/apple-pay.md#present-payment-sheet) and use `ApplePayContext` to collect payment from your Apple Pay button. You can use `PaymentSheet` to handle other payment method types.

### Register for an Apple Merchant ID

Obtain an Apple Merchant ID by [registering for a new identifier](https://developer.apple.com/account/resources/identifiers/add/merchant) on the Apple Developer website.

Fill out the form with a description and identifier. Your description is for your own records and you can modify it in the future. Stripe recommends using the name of your app as the identifier (for example, `merchant.com.{{YOUR_APP_NAME}}`).

### Create a new Apple Pay certificate

Create a certificate for your app to encrypt payment data.

Go to the [iOS Certificate Settings](https://dashboard.stripe.com/settings/ios_certificates) in the Dashboard, click **Add new application**, and follow the guide.

Download a Certificate Signing Request (CSR) file to get a secure certificate from Apple that allows you to use Apple Pay.

One CSR file must be used to issue exactly one certificate. If you switch your Apple Merchant ID, you must go to the [iOS Certificate Settings](https://dashboard.stripe.com/settings/ios_certificates) in the Dashboard to obtain a new CSR and certificate.

### Integrate with Xcode

Add the Apple Pay capability to your app. In Xcode, open your project settings, click the **Signing & Capabilities** tab, and add the **Apple Pay** capability. You might be prompted to log in to your developer account at this point. Select the merchant ID you created earlier, and your app is ready to accept Apple Pay.
![](https://b.stripecdn.com/docs-statics-srv/assets/xcode.a701d4c1922d19985e9c614a6f105bf1.png)

Enable the Apple Pay capability in Xcode

### Add Apple Pay

#### One-time payment

To add Apple Pay to PaymentSheet, set [applePay](https://stripe.dev/stripe-ios/stripe-paymentsheet/Classes/PaymentSheet/Configuration.html#/s:6Stripe12PaymentSheetC13ConfigurationV8applePayAC05ApplefD0VSgvp) after initializing `PaymentSheet.Configuration` with your Apple merchant ID and the [country code of your business](https://dashboard.stripe.com/settings/account).

#### iOS (Swift)

```swift
var configuration = PaymentSheet.Configuration()
configuration.applePay = .init(
  merchantId: "merchant.com.your_app_name",
  merchantCountryCode: "US"
)
```

#### Recurring payments

To add Apple Pay to PaymentSheet, set [applePay](https://stripe.dev/stripe-ios/stripe-paymentsheet/Classes/PaymentSheet/Configuration.html#/s:6Stripe12PaymentSheetC13ConfigurationV8applePayAC05ApplefD0VSgvp) after initializing `PaymentSheet.Configuration` with your Apple merchant ID and the [country code of your business](https://dashboard.stripe.com/settings/account).

Per [Apple’s guidelines](https://developer.apple.com/design/human-interface-guidelines/apple-pay#Supporting-subscriptions) for recurring payments, you must also set additional attributes on the `PKPaymentRequest`. Add a handler in [ApplePayConfiguration.paymentRequestHandlers](https://stripe.dev/stripe-ios/stripepaymentsheet/documentation/stripepaymentsheet/paymentsheet/applepayconfiguration/handlers/paymentrequesthandler) to configure the [PKPaymentRequest.paymentSummaryItems](https://developer.apple.com/documentation/passkit/pkpaymentrequest/1619231-paymentsummaryitems) with the amount you intend to charge (for example, 9.95 USD a month).

You can also adopt [merchant tokens](https://developer.apple.com/apple-pay/merchant-tokens/) by setting the `recurringPaymentRequest` or `automaticReloadPaymentRequest` properties on the `PKPaymentRequest`.

To learn more about how to use recurring payments with Apple Pay, see [Apple’s PassKit documentation](https://developer.apple.com/documentation/passkit/pkpaymentrequest).

#### iOS (Swift)

```swift
let customHandlers = PaymentSheet.ApplePayConfiguration.Handlers(
    paymentRequestHandler: { request in
        // PKRecurringPaymentSummaryItem is available on iOS 15 or later
        if #available(iOS 15.0, *) {
            let billing = PKRecurringPaymentSummaryItem(label: "My Subscription", amount: NSDecimalNumber(string: "59.99"))

            // Payment starts today
            billing.startDate = Date()

            // Payment ends in one year
            billing.endDate = Date().addingTimeInterval(60 * 60 * 24 * 365)

            // Pay once a month.
            billing.intervalUnit = .month
            billing.intervalCount = 1

            // recurringPaymentRequest is only available on iOS 16 or later
            if #available(iOS 16.0, *) {
                request.recurringPaymentRequest = PKRecurringPaymentRequest(paymentDescription: "Recurring",
                                                                            regularBilling: billing,
                                                                            managementURL: URL(string: "https://my-backend.example.com/customer-portal")!)
                request.recurringPaymentRequest?.billingAgreement = "You'll be billed $59.99 every month for the next 12 months. To cancel at any time, go to Account and click 'Cancel Membership.'"
            }
            request.paymentSummaryItems = [billing]
            request.currencyCode = "USD"
        } else {
            // On older iOS versions, set alternative summary items.
            request.paymentSummaryItems = [PKPaymentSummaryItem(label: "Monthly plan starting July 1, 2022", amount: NSDecimalNumber(string: "59.99"), type: .final)]
        }
        return request
    }
)
var configuration = PaymentSheet.Configuration()
configuration.applePay = .init(merchantId: "merchant.com.your_app_name",
                                merchantCountryCode: "US",
                                customHandlers: customHandlers)
```

### Order tracking

To add [order tracking](https://developer.apple.com/design/human-interface-guidelines/technologies/wallet/designing-order-tracking) information in iOS 16 or later, configure an [authorizationResultHandler](https://stripe.dev/stripe-ios/stripepaymentsheet/documentation/stripepaymentsheet/paymentsheet/applepayconfiguration/handlers/authorizationresulthandler) in your `PaymentSheet.ApplePayConfiguration.Handlers`. Stripe calls your implementation after the payment is complete, but before iOS dismisses the Apple Pay sheet.

In your `authorizationResultHandler` implementation, fetch the order details from your server for the completed order. Add the details to the provided [PKPaymentAuthorizationResult](https://developer.apple.com/documentation/passkit/pkpaymentauthorizationresult) and return the modified result.

To learn more about order tracking, see [Apple’s Wallet Orders documentation](https://developer.apple.com/documentation/walletorders).

#### iOS (Swift)

```swift
let customHandlers = PaymentSheet.ApplePayConfiguration.Handlers(
    authorizationResultHandler: { result in
      do {
        // Fetch the order details from your service
        let myOrderDetails = try await MyAPIClient.shared.fetchOrderDetails(orderID: orderID)
        result.orderDetails = PKPaymentOrderDetails(
          orderTypeIdentifier: myOrderDetails.orderTypeIdentifier, // "com.myapp.order"
          orderIdentifier: myOrderDetails.orderIdentifier, // "ABC123-AAAA-1111"
          webServiceURL: myOrderDetails.webServiceURL, // "https://my-backend.example.com/apple-order-tracking-backend"
          authenticationToken: myOrderDetails.authenticationToken) // "abc123"
        // Return your modified PKPaymentAuthorizationResult
        return result
      } catch {
        return PKPaymentAuthorizationResult(status: .failure, errors: [error])
      }
    }
)
var configuration = PaymentSheet.Configuration()
configuration.applePay = .init(merchantId: "merchant.com.your_app_name",
                               merchantCountryCode: "US",
                               customHandlers: customHandlers)
```

## Optional: Customize the sheet

All customization is configured through the [PaymentSheet.Configuration](https://stripe.dev/stripe-ios/stripe-paymentsheet/Classes/PaymentSheet/Configuration.html) object.

### Appearance

Customize colors, fonts, and so on to match the look and feel of your app by using the [appearance API](https://docs.stripe.com/elements/appearance-api/mobile.md?platform=ios).

### Payment method layout

Configure the layout of payment methods in the sheet using [paymentMethodLayout](https://stripe.dev/stripe-ios/stripepaymentsheet/documentation/stripepaymentsheet/paymentsheet/configuration-swift.struct/paymentmethodlayout). You can display them horizontally, vertically, or let Stripe optimize the layout automatically.
![](https://b.stripecdn.com/docs-statics-srv/assets/ios-mpe-payment-method-layouts.9d0513e2fcec5660378ba1824d952054.png)

#### Swift

```swift
var configuration = PaymentSheet.Configuration()
configuration.paymentMethodLayout = .automatic
```

### Collect users addresses

Collect local and international shipping or billing addresses from your customers using the [Address Element](https://docs.stripe.com/elements/address-element.md?platform=ios).

### Merchant display name

Specify a customer-facing business name by setting [merchantDisplayName](https://stripe.dev/stripe-ios/stripe-paymentsheet/Classes/PaymentSheet/Configuration.html#/s:18StripePaymentSheet0bC0C13ConfigurationV19merchantDisplayNameSSvp). By default, this is your app’s name.

#### Swift

```swift
var configuration = PaymentSheet.Configuration()
configuration.merchantDisplayName = "My app, Inc."
```

### Dark mode

`PaymentSheet` automatically adapts to the user’s system-wide appearance settings (light and dark mode). If your app doesn’t support dark mode, you can set [style](https://stripe.dev/stripe-ios/stripe-paymentsheet/Classes/PaymentSheet/Configuration.html#/s:18StripePaymentSheet0bC0C13ConfigurationV5styleAC18UserInterfaceStyleOvp) to `alwaysLight` or `alwaysDark` mode.

```swift
var configuration = PaymentSheet.Configuration()
configuration.style = .alwaysLight
```

### Default billing details

To set default values for billing details collected in the payment sheet, configure the `defaultBillingDetails` property. The `PaymentSheet` pre-populates its fields with the values that you provide.

```swift
var configuration = PaymentSheet.Configuration()
configuration.defaultBillingDetails.address.country = "US"
configuration.defaultBillingDetails.email = "foo@bar.com"
```

### Billing details collection

Use `billingDetailsCollectionConfiguration` to specify how you want to collect billing details in the payment sheet.

You can collect your customer’s name, email, phone number, and address.

If you only want to billing details required by the payment method, set `billingDetailsCollectionConfiguration.attachDefaultsToPaymentMethod` to true. In that case, the `PaymentSheet.Configuration.defaultBillingDetails` are set as the payment method’s [billing details](https://docs.stripe.com/api/payment_methods/object.md?lang=node#payment_method_object-billing_details).

If you want to collect additional billing details that aren’t necessarily required by the payment method, set `billingDetailsCollectionConfiguration.attachDefaultsToPaymentMethod` to false. In that case, the billing details collected through the `PaymentSheet` are set as the payment method’s billing details.

```swift
var configuration = PaymentSheet.Configuration()
configuration.defaultBillingDetails.email = "foo@bar.com"
configuration.billingDetailsCollectionConfiguration.name = .always
configuration.billingDetailsCollectionConfiguration.email = .never
configuration.billingDetailsCollectionConfiguration.address = .full
configuration.billingDetailsCollectionConfiguration.attachDefaultsToPaymentMethod = true
```

> Consult with your legal counsel regarding laws that apply to collecting information. Only collect phone numbers if you need them for the transaction.

## Optional: Complete payment in your UI

You can present the Payment Sheet to only collect payment method details and then later call a `confirm` method to complete payment in your app’s UI. This is useful if you have a custom buy button or require additional steps after you collect payment details.
![](https://b.stripecdn.com/docs-statics-srv/assets/ios-multi-step.cd631ea4f1cd8cf3f39b6b9e1e92b6c5.png)

Complete the payment in your app’s UI

#### UIKit

The following steps walk you through how to complete payment in your app’s UI. See our sample integration out on [GitHub](https://github.com/stripe/stripe-ios/blob/master/Example/PaymentSheet%20Example/PaymentSheet%20Example/ExampleCustomCheckoutViewController.swift).

1. First, initialize [PaymentSheet.FlowController](https://stripe.dev/stripe-ios/stripepaymentsheet/documentation/stripepaymentsheet/paymentsheet/flowcontroller) instead of `PaymentSheet` and update your UI with its `paymentOption` property. This property contains an image and label representing the customer’s initially selected, default payment method.

```swift
PaymentSheet.FlowController.create(paymentIntentClientSecret: paymentIntentClientSecret, configuration: configuration) { [weak self] result in
  switch result {
  case .failure(let error):
    print(error)
  case .success(let paymentSheetFlowController):
    self?.paymentSheetFlowController = paymentSheetFlowController
    // Update your UI using paymentSheetFlowController.paymentOption
  }
}
```

1. Next, call `presentPaymentOptions` to collect payment details. When completed, update your UI again with the `paymentOption` property.

```swift
paymentSheetFlowController.presentPaymentOptions(from: self) {
  // Update your UI using paymentSheetFlowController.paymentOption
}
```

1. Finally, call `confirm`.

```swift
paymentSheetFlowController.confirm(from: self) { paymentResult in
  // MARK: Handle the payment result
  switch paymentResult {
  case .completed:
    print("Payment complete!")
  case .canceled:
    print("Canceled!")
  case .failed(let error):
    print(error)
  }
}
```

#### SwiftUI

The following steps walk you through how to complete payment in your app’s UI. See our sample integration out on [GitHub](https://github.com/stripe/stripe-ios/blob/master/Example/PaymentSheet%20Example/PaymentSheet%20Example/ExampleSwiftUICustomPaymentFlow.swift).

1. First, initialize [PaymentSheet.FlowController](https://stripe.dev/stripe-ios/stripepaymentsheet/documentation/stripepaymentsheet/paymentsheet/flowcontroller) instead of `PaymentSheet`. Its `paymentOption` property contains an image and label representing the customer’s currently selected payment method, which you can use in your UI.

```swift
PaymentSheet.FlowController.create(paymentIntentClientSecret: paymentIntentClientSecret, configuration: configuration) { [weak self] result in
  switch result {
  case .failure(let error):
    print(error)
  case .success(let paymentSheetFlowController):
    self?.paymentSheetFlowController = paymentSheetFlowController
    // Use the paymentSheetFlowController.paymentOption properties in your UI
    myPaymentMethodLabel = paymentSheetFlowController.paymentOption?.label ?? "Select a payment method"
    myPaymentMethodImage = paymentSheetFlowController.paymentOption?.image ?? UIImage(systemName: "square.and.pencil")!
  }
}
```

1. Use [PaymentSheet.FlowController.PaymentOptionsButton](https://stripe.dev/stripe-ios/stripepaymentsheet/documentation/stripepaymentsheet/paymentsheet/flowcontroller/paymentoptionsbutton) to wrap the button that presents the sheet to collect payment details. When `PaymentSheet.FlowController` calls the `onSheetDismissed` argument, the `paymentOption` for the `PaymentSheet.FlowController` instance reflects the currently selected payment method.

```swift
PaymentSheet.FlowController.PaymentOptionsButton(
  paymentSheetFlowController: paymentSheetFlowController,
  onSheetDismissed: {
    myPaymentMethodLabel = paymentSheetFlowController.paymentOption?.label ?? "Select a payment method"
    myPaymentMethodImage = paymentSheetFlowController.paymentOption?.image ?? UIImage(systemName: "square.and.pencil")!
  },
  content: {
    /* An example button */
    HStack {
      Text(myPaymentMethodLabel)
      Image(uiImage: myPaymentMethodImage)
    }
  }
)
```

1. Use [PaymentSheet.FlowController.PaymentOptionsButton](https://stripe.dev/stripe-ios/stripepaymentsheet/documentation/stripepaymentsheet/paymentsheet/flowcontroller/paymentoptionsbutton) to wrap the button that confirms the payment.

```swift
PaymentSheet.FlowController.ConfirmButton(
  paymentSheetFlowController: paymentSheetFlowController,
  onCompletion: { result in
    // MARK: Handle the payment result
    switch result {
    case .completed:
      print("Payment complete!")
    case .canceled:
      print("Canceled!")
    case .failed(let error):
      print(error)
    }
  },
  content: {
    /* An example button */
    Text("Pay")
  }
)
```

If `PaymentSheetResult` is `.completed`, inform the user (for example, by displaying an order confirmation screen).

Setting `allowsDelayedPaymentMethods` to true allows [delayed notification](https://docs.stripe.com/payments/payment-methods.md#payment-notification) payment methods like US bank accounts. For these payment methods, the final payment status isn’t known when the `PaymentSheet` completes, and instead succeeds or fails later. If you support these types of payment methods, inform the customer their order is confirmed and only fulfill their order (for example, ship their product) when the payment is successful.

## Optional: Enable additional payment methods

Navigate to [Manage payment methods for your connected accounts](https://dashboard.stripe.com/settings/payment_methods/connected_accounts) in the Dashboard to configure which payment methods your connected accounts accept. Changes to default settings apply to all new and existing connected accounts.

Consult the following resources for payment method information:

- [A guide to payment methods](https://stripe.com/payments/payment-methods-guide#choosing-the-right-payment-methods-for-your-business) to help you choose the correct payment methods for your platform.
- [Account capabilities](https://docs.stripe.com/connect/account-capabilities.md) to make sure your chosen payment methods work for your connected accounts.
- [Payment method and product support](https://docs.stripe.com/payments/payment-methods/payment-method-support.md#product-support) tables to make sure your chosen payment methods work for your Stripe products and payments flows.

For each payment method, you can select one of the following dropdown options:

|  |
|  |
| **On by default**  | Your connected accounts accept this payment method during checkout. Some payment methods can only be off or blocked. This is because your connected accounts with *access to the Stripe Dashboard* (Platforms can provide connected accounts with access to the full Stripe Dashboard or the Express Dashboard. Otherwise, platforms build an interface for connected accounts using embedded components or the Stripe API) must activate them in their settings page. |
| **Off by default** | Your connected accounts don’t accept this payment method during checkout. If you allow your connected accounts with *access to the Stripe Dashboard* (Platforms can provide connected accounts with access to the full Stripe Dashboard or the Express Dashboard. Otherwise, platforms build an interface for connected accounts using embedded components or the Stripe API) to manage their own payment methods, they have the ability to turn it on.                |
| **Blocked**        | Your connected accounts don’t accept this payment method during checkout. If you allow your connected accounts with *access to the Stripe Dashboard* (Platforms can provide connected accounts with access to the full Stripe Dashboard or the Express Dashboard. Otherwise, platforms build an interface for connected accounts using embedded components or the Stripe API) to manage their own payment methods, they don’t have the option to turn it on.           |
![Dropdown options for payment methods, each showing an available option (blocked, on by default, off by default)](https://b.stripecdn.com/docs-statics-srv/assets/dropdowns.ef651d721d5939d81521dd34dde4577f.png)

Payment method options

If you make a change to a payment method, you must click **Review changes** in the bottom bar of your screen and **Save and apply** to update your connected accounts.
![Dialog that shows after clicking Save button with a list of what the user changed](https://b.stripecdn.com/docs-statics-srv/assets/dialog.a56ea7716f60db9778706790320d13be.png)

Save dialog

### Allow connected accounts to manage payment methods

Stripe recommends allowing your connected accounts to customize their own payment methods. This option allows each connected account with *access to the Stripe Dashboard* (Platforms can provide connected accounts with access to the full Stripe Dashboard or the Express Dashboard. Otherwise, platforms build an interface for connected accounts using embedded components or the Stripe API) to view and update their [Payment methods](https://dashboard.stripe.com/settings/payment_methods) page. Only owners of the connected accounts can customize their payment methods. The Stripe Dashboard displays the set of payment method defaults you applied to all new and existing connected accounts. Your connected accounts can override these defaults, excluding payment methods you have blocked.

Check the **Account customization** checkbox to enable this option. You must click **Review changes** in the bottom bar of your screen and then select **Save and apply** to update this setting.
![Screenshot of the checkbox to select when allowing connected owners to customize payment methods](https://b.stripecdn.com/docs-statics-srv/assets/checkbox.275bd35d2a025272f03af029a144e577.png)

Account customization checkbox

### Payment method capabilities

To allow your connected accounts to accept additional payment methods, their `Accounts` must have active payment method capabilities.

If you selected the “On by default” option for a payment method in [Manage payment methods for your connected accounts](https://dashboard.stripe.com/settings/payment_methods/connected_accounts), Stripe automatically requests the necessary capability for new and existing connected accounts if they meet the verification requirements. If the connected account doesn’t meet the requirements or if you want to have direct control, you can manually request the capability in the Dashboard or with the API.

Most payment methods have the same verification requirements as the `card_payments` capability, with some restrictions and exceptions. The [payment method capabilities table](https://docs.stripe.com/connect/account-capabilities.md#payment-methods) lists the payment methods that require additional verification.

#### Dashboard

[Find a connected account](https://docs.stripe.com/connect/dashboard/managing-individual-accounts.md#finding-accounts) in the Dashboard to edit its capabilities and view outstanding verification requirements.

#### Accounts v2 API

For an existing connected account, you can retrieve the `Account` and inspect their [merchant capabilities](https://docs.stripe.com/api/v2/core/accounts/retrieve.md#v2_retrieve_accounts-response-configuration-merchant-capabilities) to determine whether you need to request additional capabilities.

```curl
curl -G https://api.stripe.com/v2/core/accounts/{{CONNECTEDACCOUNT_ID}} \
  -H "Authorization: Bearer <<YOUR_SECRET_KEY>>" \
  -H "Stripe-Version: 2025-11-17.preview" \
  -d "include[0]=configuration.merchant"
```

Request additional capabilities by [updating](https://docs.stripe.com/api/v2/core/accounts/update.md#v2_update_accounts-configuration-merchant-capabilities) each connected account’s capabilities.

```curl
curl -X POST https://api.stripe.com/v2/accounts/{{CONNECTEDACCOUNT_ID}} \
  -H "Authorization: Bearer <<YOUR_SECRET_KEY>>" \
  -H "Stripe-Version: 2025-11-17.preview" \
  --json '{
    "configuration": {
        "merchant": {
            "capabilities": {
                "ach_debit_payments": {
                    "requested": true
                }
            }
        }
    },
    "include": [
        "configuration.merchant",
        "requirements"
    ]
  }'
```

Requested capabilities might be delayed before becoming active. If the capability has any activation requirements, the response includes them in the `requirements` arrays.

#### Accounts v1 API

For an existing connected account, you can [list](https://docs.stripe.com/api/capabilities/list.md) their existing capabilities to determine whether you need to request additional capabilities.

```curl
curl https://api.stripe.com/v1/accounts/{{CONNECTEDACCOUNT_ID}}/capabilities \
  -u "<<YOUR_SECRET_KEY>>:"
```

Request additional capabilities by [updating](https://docs.stripe.com/api/capabilities/update.md) each connected account’s capabilities.

```curl
curl https://api.stripe.com/v1/accounts/{{CONNECTEDACCOUNT_ID}}/capabilities/us_bank_account_ach_payments \
  -u "<<YOUR_SECRET_KEY>>:" \
  -d requested=true
```

There can be a delay before the requested capability becomes active. If the capability has any activation requirements, the response includes them in the `requirements` arrays.

## Specify the settlement merchant 

The settlement merchant is dependent on the [capabilities](https://docs.stripe.com/connect/account-capabilities.md) set on an account and how a charge is created. The settlement merchant determines whose information is used to make the charge. This includes the statement descriptor (either the platform’s or the connected account’s) that’s displayed on the customer’s credit card or bank statement for that charge.

Specifying the settlement merchant allows you to be more explicit about who to create charges for. For example, some platforms prefer to be the settlement merchant because the end customer interacts directly with their platform (such as on-demand platforms). However, some platforms have connected accounts that interact directly with end customers instead (such as a storefront on an e-commerce platform). In these scenarios, it might make more sense for the connected account to be the settlement merchant.

You can set the `on_behalf_of` parameter to the ID of a connected account to make that account the settlement merchant for the payment. When using `on_behalf_of`:

- Charges *settle* (When funds are available in your Stripe balance) in the connected account’s country and *settlement currency* (The settlement currency is the currency your bank account uses).
- The fee structure for the connected account’s country is used.
- The connected account’s statement descriptor is displayed on the customer’s credit card statement.
- If the connected account is in a different country than the platform, the connected account’s address and phone number are displayed on the customer’s credit card statement.
- The number of days that a [pending balance](https://docs.stripe.com/connect/account-balances.md) is held before being paid out depends on the [delay_days](https://docs.stripe.com/api/accounts/create.md#create_account-settings-payouts-schedule-delay_days) setting on the connected account.

> #### Accounts v2 API
> 
> You can’t use the Accounts v2 API to manage payout settings. Use the Accounts v1 API.

If `on_behalf_of` is omitted, the platform is the business of record for the payment.

> The `on_behalf_of` parameter is supported only for connected accounts with a payments capability such as [card_payments](https://docs.stripe.com/connect/account-capabilities.md#card-payments). Accounts under the [recipient service agreement](https://docs.stripe.com/connect/service-agreement-types.md#recipient) can’t request `card_payments` or other payments capabilities.

```curl
curl https://api.stripe.com/v1/payment_intents \
  -u "<<YOUR_SECRET_KEY>>:" \
  -d amount=10000 \
  -d currency=eur \
  -d "automatic_payment_methods[enabled]=true" \
  -d "on_behalf_of={{CONNECTEDACCOUNT_ID}}" \
  -d transfer_group=ORDER100
```
![](https://b.stripecdn.com/docs-statics-srv/assets/android-overview.471eaf89a760f5b6a757fd96b6bb9b60.png)

Integrate Stripe’s prebuilt payment UI into the checkout of your Android app with the [PaymentSheet](https://stripe.dev/stripe-android/paymentsheet/com.stripe.android.paymentsheet/-payment-sheet/index.html) class.

## Set up Stripe [Server-side] [Client-side]

### Server-side 

This integration requires endpoints on your server that talk to the Stripe API. Use the official libraries for access to the Stripe API from your server:

#### Ruby

```bash
# Available as a gem
sudo gem install stripe
```

```ruby
# If you use bundler, you can add this line to your Gemfile
gem 'stripe'
```

### Client-side 

The [Stripe Android SDK](https://github.com/stripe/stripe-android) is open source and [fully documented](https://stripe.dev/stripe-android/).

To install the SDK, add `stripe-android` to the `dependencies` block of your [app/build.gradle](https://developer.android.com/studio/build/dependencies) file:

#### Kotlin

```kotlin
plugins {
    id("com.android.application")
}

android { ... }

dependencies {
  // ...

  // Stripe Android SDK
  implementation("com.stripe:stripe-android:23.1.0")
  // Include the financial connections SDK to support US bank account as a payment method
  implementation("com.stripe:financial-connections:23.1.0")
}
```

> For details on the latest SDK release and past versions, see the [Releases](https://github.com/stripe/stripe-android/releases) page on GitHub. To receive notifications when a new release is published, [watch releases for the repository](https://docs.github.com/en/github/managing-subscriptions-and-notifications-on-github/configuring-notifications#configuring-your-watch-settings-for-an-individual-repository).

Configure the SDK with your Stripe [publishable key](https://dashboard.stripe.com/apikeys) so that it can make requests to the Stripe API, such as in your `Application` subclass:

#### Kotlin

```kotlin
import com.stripe.android.PaymentConfiguration

class MyApp : Application() {
    override fun onCreate() {
        super.onCreate()
        PaymentConfiguration.init(
            applicationContext,
            "<<YOUR_PUBLISHABLE_KEY>>"
        )
    }
}
```

> Use your [test keys](https://docs.stripe.com/keys.md#obtain-api-keys) while you test and develop, and your [live mode](https://docs.stripe.com/keys.md#test-live-modes) keys when you publish your app.

## Add an endpoint [Server-side]

This integration uses three Stripe API objects:

1. A [PaymentIntent](https://docs.stripe.com/api/payment_intents.md). Stripe uses this to represent your intent to collect a payment from a customer, tracking your charge attempts and payment state changes throughout the process.
1. A *Customer* (Customer objects represent customers of your business. They let you reuse payment methods and give you the ability to track multiple payments)(optional). To set up a payment method for future payments, it must be attached to a Customer. Create a Customer object when your customer creates an account with your business. If your customer is making a payment as a guest, you can create a Customer object before payment and associate it with your own internal representation of the customer’s account later.
1. A Customer Ephemeral Key (optional). Information on the Customer object is sensitive, and can’t be retrieved directly from an app. An Ephemeral Key grants the SDK temporary access to the Customer.

If you want to save cards and allow returning customers to reuse saved cards, you need the Customer and Customer Ephemeral Key objects for your integration. Otherwise, you can omit these objects.

For security reasons, your app can’t create these objects. Instead, add an endpoint on your server that:

1. Retrieves the Customer, or creates a new one.
1. Creates an Ephemeral Key for the Customer.
1. Creates a PaymentIntent with the [amount](https://docs.stripe.com/api/payment_intents/create.md#create_payment_intent-amount), [currency](https://docs.stripe.com/api/payment_intents/create.md#create_payment_intent-currency), [customer](https://docs.stripe.com/api/payment_intents/create.md#create_payment_intent-customer), and a [transfer group](https://docs.stripe.com/api/payment_intents/create.md#create_payment_intent-transfer_group) to associate with the transfer of funds later.
1. Returns the Payment Intent’s *client secret* (The client secret is a unique key returned from Stripe as part of a PaymentIntent. This key lets the client access important fields from the PaymentIntent (status, amount, currency) while hiding sensitive ones (metadata, customer)), the Ephemeral Key’s `secret`, the [Customer ID](https://docs.stripe.com/api/customers/object.md#customer_object-id), and your [publishable key](https://dashboard.stripe.com/apikeys) to your app.

> #### Accounts v2 API
> 
> Instead of passing a `Customer` ID in the `customer` parameter, you can pass the ID of an `Account` that has the `customer` configuration in the [customer_account](https://docs.stripe.com/api/payment_intents/create.md?api-version=preview#create_payment_intent-customer_account) parameter. In that case, the `Account` ID returns in the [customer_account](https://docs.stripe.com/api/payment_intents/object.md?api-version=preview#payment_intent_object-customer_account) property.

The payment methods shown to customers during the checkout process are also included on the PaymentIntent. You can let Stripe pull payment methods from your [Dashboard settings](https://dashboard.stripe.com/settings/payment_methods) or you can list them manually.

Unless your integration requires a code-based option for offering payment methods, don’t list payment methods manually. Stripe evaluates the currency, payment method restrictions, and other parameters to determine the list of supported payment methods. Stripe prioritizes payment methods that help increase conversion and are most relevant to the currency and the customer’s location. We hide lower priority payment methods in an overflow menu.

#### Manage payment methods from the Dashboard

You can fork and deploy an implementation of this endpoint on [CodeSandbox](https://codesandbox.io/p/devbox/suspicious-lalande-l325w6) for testing.

#### curl

```bash
# Create a Customer (use an existing Customer ID if this is a returning customer)
curl https://api.stripe.com/v1/customers \
  -u <<YOUR_SECRET_KEY>>: \
  -X "POST"

# Create an Ephemeral Key for the Customer
curl https://api.stripe.com/v1/ephemeral_keys \
  -u <<YOUR_SECRET_KEY>>: \
  -H "Stripe-Version: 2025-07-30.basil" \
  -X "POST" \
  -d "customer"="{{CUSTOMER_ID}}" \

# Create a PaymentIntent
curl https://api.stripe.com/v1/payment_intents \
  -u <<YOUR_SECRET_KEY>>: \
  -X "POST" \
  -d "customer"="{{CUSTOMER_ID}}" \
  -d "amount"=10000 \
  -d "currency"="usd" \
  # In the latest version of the API, specifying the `automatic_payment_methods` parameter
  # is optional because Stripe enables its functionality by default.
  -d "automatic_payment_methods[enabled]"=true \
  -d transfer_group="ORDER100" \
```

#### Listing payment methods manually

You can fork and deploy an implementation of this endpoint on [CodeSandbox](https://codesandbox.io/p/devbox/suspicious-lalande-l325w6) for testing.

#### curl

```bash
# Create a Customer (use an existing Customer ID if this is a returning customer)
curl https://api.stripe.com/v1/customers \
  -u <<YOUR_SECRET_KEY>>: \
  -X "POST"

# Create an Ephemeral Key for the Customer
curl https://api.stripe.com/v1/ephemeral_keys \
  -u <<YOUR_SECRET_KEY>>: \
  -H "Stripe-Version: 2025-07-30.basil" \
  -X "POST" \
  -d "customer"="{{CUSTOMER_ID}}" \

# Create a PaymentIntent
curl https://api.stripe.com/v1/payment_intents \
  -u <<YOUR_SECRET_KEY>>: \
  -X "POST" \
  -d "customer"="{{CUSTOMER_ID}}" \
  -d "amount"=10000 \
  -d "currency"="eur" \
  -d "payment_method_types[]"="bancontact" \
  -d "payment_method_types[]"="card" \
  -d "payment_method_types[]"="ideal" \
  -d "payment_method_types[]"="klarna" \
  -d "payment_method_types[]"="sepa_debit" \
  -d transfer_group="ORDER100" \
```

Each payment method needs to support the currency passed in the PaymentIntent and your business needs to be based in one of the countries each payment method supports. See the [Payment method integration options](https://docs.stripe.com/payments/payment-methods/integration-options.md) page for more details about what’s supported.

## Integrate the payment sheet [Client-side]

Before displaying the mobile Payment Element, your checkout page should:

- Show the products being purchased and the total amount
- Collect any required shipping information using the [Address Element](https://docs.stripe.com/elements/address-element.md?platform=android)
- Include a checkout button to present Stripe’s UI

#### Jetpack Compose

[Initialize](https://stripe.dev/stripe-android/paymentsheet/com.stripe.android.paymentsheet/-payment-sheet/-builder/index.html) a `PaymentSheet` instance inside `onCreate` of your checkout Activity, passing a method to handle the result.

```kotlin
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import com.stripe.android.paymentsheet.PaymentSheet
import com.stripe.android.paymentsheet.PaymentSheetResult

@Composable
fun App() {
  val paymentSheet = remember { PaymentSheet.Builder(::onPaymentSheetResult) }.build()
}

private fun onPaymentSheetResult(paymentSheetResult: PaymentSheetResult) {
  // implemented in the next steps
}
```

Next, fetch the PaymentIntent client secret, Customer Session client secret, Customer ID, and publishable key from the endpoint you created in the previous step. Set the publishable key using `PaymentConfiguration` and store the others for use when you present the PaymentSheet.

```kotlin
import androidx.compose.runtime.Composable
import androidx.compose.runtime.rememberimport androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.compose.ui.platform.LocalContext
import com.stripe.android.PaymentConfiguration
import com.stripe.android.paymentsheet.PaymentSheet
import com.stripe.android.paymentsheet.PaymentSheetResult

@Composable
fun App() {
  val paymentSheet = remember { PaymentSheet.Builder(::onPaymentSheetResult) }.build()val context = LocalContext.current
  var customerConfig by remember { mutableStateOf<PaymentSheet.CustomerConfiguration?>(null) }
  varpaymentIntentClientSecret by remember { mutableStateOf<String?>(null) }

  LaunchedEffect(context) {
    // Make a request to your own server and retrieve payment configurations
    val networkResult = ...
    if (networkResult.isSuccess) {paymentIntentClientSecret = networkResult.paymentIntent
        customerConfig = PaymentSheet.CustomerConfiguration.createWithCustomerSession(
          id = networkResult.customer,
          clientSecret = networkResult.customerSessionClientSecret
        )PaymentConfiguration.init(context, networkResult.publishableKey)}
  }
}

private fun onPaymentSheetResult(paymentSheetResult: PaymentSheetResult) {
  // implemented in the next steps
}
```

When the customer taps your checkout button, call [presentWithPaymentIntent](https://stripe.dev/stripe-android/paymentsheet/com.stripe.android.paymentsheet/-payment-sheet/index.html#1814490530%2FFunctions%2F2002900378) to present the payment sheet. After the customer completes the payment, the sheet dismisses and the [PaymentSheetResultCallback](https://stripe.dev/stripe-android/paymentsheet/com.stripe.android.paymentsheet/-payment-sheet-result-callback/index.html) is called with a [PaymentSheetResult](https://stripe.dev/stripe-android/paymentsheet/com.stripe.android.paymentsheet/-payment-sheet-result/index.html).

```kotlin
import androidx.compose.material.Button
import androidx.compose.material.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.platform.LocalContext
import com.stripe.android.PaymentConfiguration
import com.stripe.android.paymentsheet.PaymentSheet
import com.stripe.android.paymentsheet.PaymentSheetResult

@Composable
fun App() {
  val paymentSheet = remember { PaymentSheet.Builder(::onPaymentSheetResult) }.build()
  val context = LocalContext.current
  var customerConfig by remember { mutableStateOf<PaymentSheet.CustomerConfiguration?>(null) }
  var paymentIntentClientSecret by remember { mutableStateOf<String?>(null) }

  LaunchedEffect(context) {
    // Make a request to your own server and retrieve payment configurations
    val networkResult = ...
    if (networkResult.isSuccess) {
        paymentIntentClientSecret = networkResult.paymentIntent
        customerConfig = PaymentSheet.CustomerConfiguration.createWithCustomerSession(
          id = networkResult.customer,
          clientSecret = networkResult.customerSessionClientSecret
        )
        PaymentConfiguration.init(context, networkResult.publishableKey)
    }
  }Button(
    onClick = {
      val currentConfig = customerConfig
      val currentClientSecret =paymentIntentClientSecret

      if (currentConfig != null && currentClientSecret != null) {
        presentPaymentSheet(paymentSheet, currentConfig, currentClientSecret)
      }
    }
  ) {
    Text("Checkout")
  }
}private fun presentPaymentSheet(
  paymentSheet: PaymentSheet,
  customerConfig: PaymentSheet.CustomerConfiguration,paymentIntentClientSecret: String
) {
  paymentSheet.presentWithPaymentIntent(paymentIntentClientSecret,
    PaymentSheet.Configuration.Builder(merchantDisplayName = "My merchant name")
      .customer(customerConfig)
      // Set `allowsDelayedPaymentMethods` to true if your business handles
      // delayed notification payment methods like US bank accounts.
      .allowsDelayedPaymentMethods(true)
      .build()
  )
}
private fun onPaymentSheetResult(paymentSheetResult: PaymentSheetResult) {when(paymentSheetResult) {
    is PaymentSheetResult.Canceled -> {
      print("Canceled")
    }
    is PaymentSheetResult.Failed -> {
      print("Error: ${paymentSheetResult.error}")
    }
    is PaymentSheetResult.Completed -> {
      // Display for example, an order confirmation screen
      print("Completed")
    }
  }
}
```

#### Views (Classic)

[Initialize](https://stripe.dev/stripe-android/paymentsheet/com.stripe.android.paymentsheet/-payment-sheet/index.html#-394860221%2FConstructors%2F2002900378) a `PaymentSheet` instance inside `onCreate` of your checkout Activity, passing a method to handle the result.

#### Kotlin

```kotlin
import com.stripe.android.paymentsheet.PaymentSheet

class CheckoutActivity : AppCompatActivity() {
  lateinit var paymentSheet: PaymentSheet

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    paymentSheet = PaymentSheet.Builder(::onPaymentSheetResult).build(this)
  }

  fun onPaymentSheetResult(paymentSheetResult: PaymentSheetResult) {
    // implemented in the next steps
  }
}
```

Next, fetch the PaymentIntent client secret, Customer Session client secret, Customer ID, and publishable key from the endpoint you created in the previous step. Set the publishable key using `PaymentConfiguration` and store the others for use when you present the PaymentSheet.

#### Kotlin

```kotlin
import com.stripe.android.paymentsheet.PaymentSheet

class CheckoutActivity : AppCompatActivity() {
  lateinit var paymentSheet: PaymentSheetlateinit var customerConfig: PaymentSheet.CustomerConfiguration
  lateinit varpaymentIntentClientSecret: String

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    paymentSheet = PaymentSheet.Builder(::onPaymentSheetResult).build(this)lifecycleScope.launch {
      // Make a request to your own server and retrieve payment configurations
      val networkResult = MyBackend.getPaymentConfig()
      if (networkResult.isSuccess) {paymentIntentClientSecret = networkResult.paymentIntent
        customerConfig = PaymentSheet.CustomerConfiguration.createWithCustomerSession(
          id = networkResult.customer,
          clientSecret = networkResult.customerSessionClientSecret
        )PaymentConfiguration.init(context, networkResult.publishableKey)}
    }
  }

  fun onPaymentSheetResult(paymentSheetResult: PaymentSheetResult) {
    // implemented in the next steps
  }
}
```

When the customer taps your checkout button, call [presentWithPaymentIntent](https://stripe.dev/stripe-android/paymentsheet/com.stripe.android.paymentsheet/-payment-sheet/index.html#1814490530%2FFunctions%2F2002900378) to present the payment sheet. After the customer completes the payment, the sheet dismisses and the [PaymentSheetResultCallback](https://stripe.dev/stripe-android/paymentsheet/com.stripe.android.paymentsheet/-payment-sheet-result-callback/index.html) is called with a [PaymentSheetResult](https://stripe.dev/stripe-android/paymentsheet/com.stripe.android.paymentsheet/-payment-sheet-result/index.html).

#### Kotlin

```kotlin
// ...
class CheckoutActivity : AppCompatActivity() {
  lateinit var paymentSheet: PaymentSheet
  lateinit var customerConfig: PaymentSheet.CustomerConfiguration
  lateinit var paymentIntentClientSecret: String
  // ...fun presentPaymentSheet() {
    paymentSheet.presentWithPaymentIntent(paymentIntentClientSecret,
      PaymentSheet.Configuration.Builder(merchantDisplayName = "My merchant name")
        .customer(customerConfig)
        // Set `allowsDelayedPaymentMethods` to true if your business handles
        // delayed notification payment methods like US bank accounts.
        .allowsDelayedPaymentMethods(true)
        .build()
    )
  }

  fun onPaymentSheetResult(paymentSheetResult: PaymentSheetResult) {when(paymentSheetResult) {
      is PaymentSheetResult.Canceled -> {
        print("Canceled")
      }
      is PaymentSheetResult.Failed -> {
        print("Error: ${paymentSheetResult.error}")
      }
      is PaymentSheetResult.Completed -> {
        // Display for example, an order confirmation screen
        print("Completed")
      }
    }
  }
}
```

Setting `allowsDelayedPaymentMethods` to true allows [delayed notification](https://docs.stripe.com/payments/payment-methods.md#payment-notification) payment methods like US bank accounts. For these payment methods, the final payment status isn’t known when the `PaymentSheet` completes, and instead succeeds or fails later. If you support these types of payment methods, inform the customer their order is confirmed and only fulfill their order (for example, ship their product) when the payment is successful.

## Handle post-payment events [Server-side]

Stripe sends a [payment_intent.succeeded](https://docs.stripe.com/api/events/types.md#event_types-payment_intent.succeeded) event when the payment completes. Use the [Dashboard webhook tool](https://dashboard.stripe.com/webhooks) or follow the [webhook guide](https://docs.stripe.com/webhooks/quickstart.md) to receive these events and run actions, such as sending an order confirmation email to your customer, logging the sale in a database, or starting a shipping workflow.

Listen for these events rather than waiting on a callback from the client. On the client, the customer could close the browser window or quit the app before the callback executes, and malicious clients could manipulate the response. Setting up your integration to listen for asynchronous events is what enables you to accept [different types of payment methods](https://stripe.com/payments/payment-methods-guide) with a single integration.

In addition to handling the `payment_intent.succeeded` event, we recommend handling these other events when collecting payments with the Payment Element:

| Event                                                                                                                           | Description                                                                                                                                                                                                                                                                         | Action                                                                                                                                                                                           |
| ------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| [payment_intent.succeeded](https://docs.stripe.com/api/events/types.md?lang=php#event_types-payment_intent.succeeded)           | Sent when a customer successfully completes a payment.                                                                                                                                                                                                                              | Send the customer an order confirmation and *fulfill* (Fulfillment is the process of providing the goods or services purchased by a customer, typically after payment is collected) their order. |
| [payment_intent.processing](https://docs.stripe.com/api/events/types.md?lang=php#event_types-payment_intent.processing)         | Sent when a customer successfully initiates a payment, but the payment has yet to complete. This event is most commonly sent when the customer initiates a bank debit. It’s followed by either a `payment_intent.succeeded` or `payment_intent.payment_failed` event in the future. | Send the customer an order confirmation that indicates their payment is pending. For digital goods, you might want to fulfill the order before waiting for payment to complete.                  |
| [payment_intent.payment_failed](https://docs.stripe.com/api/events/types.md?lang=php#event_types-payment_intent.payment_failed) | Sent when a customer attempts a payment, but the payment fails.                                                                                                                                                                                                                     | If a payment transitions from `processing` to `payment_failed`, offer the customer another attempt to pay.                                                                                       |

## Create a Transfer [Server-side]

On your server, send funds from your account to a connected account by creating a [Transfer](https://docs.stripe.com/api/transfers/create.md) and specifying the `transfer_group` used.

```curl
curl https://api.stripe.com/v1/transfers \
  -u "<<YOUR_SECRET_KEY>>:" \
  -d amount=7000 \
  -d currency=usd \
  -d "destination={{CONNECTEDACCOUNT_ID}}" \
  -d transfer_group=ORDER100
```

Transfer and charge amounts don’t have to match. You can split a single charge between multiple transfers or include multiple charges in a single transfer. The following example creates an additional transfer associated with the same `transfer_group`.

```curl
curl https://api.stripe.com/v1/transfers \
  -u "<<YOUR_SECRET_KEY>>:" \
  -d amount=2000 \
  -d currency=usd \
  -d destination={{OTHER_CONNECTED_ACCOUNT_ID}} \
  -d transfer_group=ORDER100
```

### Transfer options

You can assign any value to the `transfer_group` string, but it must represent a single business action. You can also make a transfer with neither an associated charge nor a `transfer_group`—for example, when you must pay a provider but there’s no associated customer payment.

> The `transfer_group` only identifies associated objects. It doesn’t affect any standard functionality. To prevent a transfer from executing before the funds from the associated charge are available, use the transfer’s `source_transaction` attribute.

By default, a transfer request fails when the amount exceeds the platform’s [available account balance](https://docs.stripe.com/connect/account-balances.md). Stripe doesn’t automatically retry failed transfer requests.

You can avoid failed transfer requests for transfers that are associated with charges. When you specify the associated charge [as the transfer’s source_transaction](https://docs.stripe.com/connect/separate-charges-and-transfers.md#transfer-availability), the transfer request automatically succeeds. However, we don’t execute the transfer until the funds from that charge are available in the platform account.

> If you use separate charges and transfers, take that into account when planning your *payout* (A payout is the transfer of funds to an external account, usually a bank account, in the form of a deposit) schedule. Automatic payouts can interfere with transfers that don’t have a defined `source_transaction`.

### Asynchronous payment methods

If you’re using *asynchronous payment methods* (Asynchronous payment methods can take up to several days to confirm whether the payment has been successful. During this time, the payment can't be guaranteed) (such as ACH Debit or SEPA Debit), wait for a [charge.succeeded](https://docs.stripe.com/api/events/types.md#event_types-charge.succeeded) event before creating a transfer. Unlike destination charges, Stripe doesn’t automatically reverse a transfer if the associated async payment fails. If you create a transfer and the payment subsequently fails, your platform’s balance is debited for the transfer amount. You must then manually [reverse the transfer](https://docs.stripe.com/connect/separate-charges-and-transfers.md#reverse-transfers) to recover the funds.

## Test the integration

#### Cards

| Card number         | Scenario                                                                                                                                                                                                                                                                                      | How to test                                                                                           |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| 4242424242424242    | The card payment succeeds and doesn’t require authentication.                                                                                                                                                                                                                                 | Fill out the credit card form using the credit card number with any expiration, CVC, and postal code. |
| 4000002500003155    | The card payment requires *authentication* (Strong Customer Authentication (SCA) is a regulatory requirement in effect as of September 14, 2019, that impacts many European online payments. It requires customers to use two-factor authentication like 3D Secure to verify their purchase). | Fill out the credit card form using the credit card number with any expiration, CVC, and postal code. |
| 4000000000009995    | The card is declined with a decline code like `insufficient_funds`.                                                                                                                                                                                                                           | Fill out the credit card form using the credit card number with any expiration, CVC, and postal code. |
| 6205500000000000004 | The UnionPay card has a variable length of 13-19 digits.                                                                                                                                                                                                                                      | Fill out the credit card form using the credit card number with any expiration, CVC, and postal code. |

#### Bank redirects

| Payment method    | Scenario                                                                                                                                                                                        | How to test                                                                                                                                              |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Bancontact, iDEAL | Your customer fails to authenticate on the redirect page for a redirect-based and immediate notification payment method.                                                                        | Choose any redirect-based payment method, fill out the required details, and confirm the payment. Then click **Fail test payment** on the redirect page. |
| Pay by Bank       | Your customer successfully pays with a redirect-based and [delayed notification](https://docs.stripe.com/payments/payment-methods.md#payment-notification) payment method.                      | Choose the payment method, fill out the required details, and confirm the payment. Then click **Complete test payment** on the redirect page.            |
| Pay by Bank       | Your customer fails to authenticate on the redirect page for a redirect-based and delayed notification payment method.                                                                          | Choose the payment method, fill out the required details, and confirm the payment. Then click **Fail test payment** on the redirect page.                |
| BLIK              | BLIK payments fail in a variety of ways—immediate failures (for example, the code is expired or invalid), delayed errors (the bank declines) or timeouts (the customer didn’t respond in time). | Use email patterns to [simulate the different failures.](https://docs.stripe.com/payments/blik/accept-a-payment.md#simulate-failures)                    |

#### Bank debits

| Payment method    | Scenario                                                                                          | How to test                                                                                                                                                                                       |
| ----------------- | ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SEPA Direct Debit | Your customer successfully pays with SEPA Direct Debit.                                           | Fill out the form using the account number `AT321904300235473204`. The confirmed PaymentIntent initially transitions to processing, then transitions to the succeeded status three minutes later. |
| SEPA Direct Debit | Your customer’s payment intent status transitions from `processing` to `requires_payment_method`. | Fill out the form using the account number `AT861904300235473202`.                                                                                                                                |

See [Testing](https://docs.stripe.com/testing.md) for additional information to test your integration.

## Optional: Enable Google Pay

### Set up your integration

To use Google Pay, first enable the Google Pay API by adding the following to the `<application>` tag of your **AndroidManifest.xml**:

```xml
<application>
  ...
  <meta-data
    android:name="com.google.android.gms.wallet.api.enabled"
    android:value="true" />
</application>
```

For more details, see Google Pay’s [Set up Google Pay API](https://developers.google.com/pay/api/android/guides/setup) for Android.

### Add Google Pay

To add Google Pay to your integration, pass a [PaymentSheet.GooglePayConfiguration](https://stripe.dev/stripe-android/paymentsheet/com.stripe.android.paymentsheet/-payment-sheet/-google-pay-configuration/index.html) with your Google Pay environment (production or test) and the [country code of your business](https://dashboard.stripe.com/settings/account) when initializing [PaymentSheet.Configuration](https://stripe.dev/stripe-android/paymentsheet/com.stripe.android.paymentsheet/-payment-sheet/-configuration/index.html).

#### Kotlin

```kotlin
val googlePayConfiguration = PaymentSheet.GooglePayConfiguration(
  environment = PaymentSheet.GooglePayConfiguration.Environment.Test,
  countryCode = "US",
  currencyCode = "USD" // Required for Setup Intents, optional for Payment Intents
)
val configuration = PaymentSheet.Configuration.Builder(merchantDisplayName = "My merchant name")
  .googlePay(googlePayConfiguration)
  .build()
```

### Test Google Pay

Google allows you to make test payments through their [Test card suite](https://developers.google.com/pay/api/android/guides/resources/test-card-suite). The test suite supports using Stripe [test cards](https://docs.stripe.com/testing.md).

You must test Google Pay using a physical Android device instead of a simulated device, in a country where Google Pay is supported. Log in to a Google account on your test device with a real card saved to Google Wallet.

## Optional: Customize the sheet

All customization is configured using the [PaymentSheet.Configuration](https://stripe.dev/stripe-android/paymentsheet/com.stripe.android.paymentsheet/-payment-sheet/-configuration/index.html) object.

### Appearance

Customize colors, fonts, and more to match the look and feel of your app by using the [appearance API](https://docs.stripe.com/elements/appearance-api/mobile.md?platform=android).

### Payment method layout

Configure the layout of payment methods in the sheet using [paymentMethodLayout](https://stripe.dev/stripe-android/paymentsheet/com.stripe.android.paymentsheet/-payment-sheet/-configuration/-builder/index.html#2123253356%2FFunctions%2F2002900378). You can display them horizontally, vertically, or let Stripe optimize the layout automatically.
![](https://b.stripecdn.com/docs-statics-srv/assets/android-mpe-payment-method-layouts.3bcfe828ceaad1a94e0572a22d91733f.png)

#### Kotlin

```kotlin
PaymentSheet.Configuration.Builder("Example, Inc.")
  .paymentMethodLayout(PaymentSheet.PaymentMethodLayout.Automatic)
  .build()
```

### Collect users addresses

Collect local and international shipping or billing addresses from your customers using the [Address Element](https://docs.stripe.com/elements/address-element.md?platform=android).

### Business display name

Specify a customer-facing business name by setting [merchantDisplayName](https://stripe.dev/stripe-android/paymentsheet/com.stripe.android.paymentsheet/-payment-sheet/-configuration/index.html#-191101533%2FProperties%2F2002900378). By default, this is your app’s name.

#### Kotlin

```kotlin
PaymentSheet.Configuration.Builder(
  merchantDisplayName = "My app, Inc."
).build()
```

### Dark mode

By default, `PaymentSheet` automatically adapts to the user’s system-wide appearance settings (light and dark mode). You can change this by setting light or dark mode on your app:

#### Kotlin

```kotlin
// force dark
AppCompatDelegate.setDefaultNightMode(AppCompatDelegate.MODE_NIGHT_YES)
// force light
AppCompatDelegate.setDefaultNightMode(AppCompatDelegate.MODE_NIGHT_NO)
```

### Default billing details

To set default values for billing details collected in the payment sheet, configure the `defaultBillingDetails` property. The `PaymentSheet` pre-populates its fields with the values that you provide.

#### Kotlin

```kotlin
val address = PaymentSheet.Address(country = "US")
val billingDetails = PaymentSheet.BillingDetails(
  address = address,
  email = "foo@bar.com"
)
val configuration = PaymentSheet.Configuration.Builder(merchantDisplayName = "Merchant, Inc.")
  .defaultBillingDetails(billingDetails)
  .build()
```

### Configure collection of billing details

Use `BillingDetailsCollectionConfiguration` to specify how you want to collect billing details in the PaymentSheet.

You can collect your customer’s name, email, phone number, and address.

If you want to attach default billing details to the PaymentMethod object even when those fields aren’t collected in the UI, set `billingDetailsCollectionConfiguration.attachDefaultsToPaymentMethod` to `true`.

#### Kotlin

```kotlin
val billingDetails = PaymentSheet.BillingDetails(
  email = "foo@bar.com"
)
val billingDetailsCollectionConfiguration = BillingDetailsCollectionConfiguration(
  attachDefaultsToPaymentMethod = true,
  name = BillingDetailsCollectionConfiguration.CollectionMode.Always,
  email = BillingDetailsCollectionConfiguration.CollectionMode.Never,
  address = BillingDetailsCollectionConfiguration.AddressCollectionMode.Full,
)
val configuration = PaymentSheet.Configuration.Builder(merchantDisplayName = "Merchant, Inc.")
  .defaultBillingDetails(billingDetails)
  .billingDetailsCollectionConfiguration(billingDetailsCollectionConfiguration)
  .build()
```

> Consult with your legal counsel regarding laws that apply to collecting information. Only collect phone numbers if you need them for the transaction.

## Optional: Complete payment in your UI

You can present Payment Sheet to only collect payment method details and complete the payment back in your app’s UI. This is useful if you have a custom buy button or require additional steps after payment details are collected.
![](https://b.stripecdn.com/docs-statics-srv/assets/android-multi-step.84d8a0a44b1baa596bda491322b6d9fd.png)

> A sample integration is [available on our GitHub](https://github.com/stripe/stripe-android/blob/master/paymentsheet-example/src/main/java/com/stripe/android/paymentsheet/example/samples/ui/paymentsheet/custom_flow/CustomFlowActivity.kt).

1. First, initialize [PaymentSheet.FlowController](https://stripe.dev/stripe-android/paymentsheet/com.stripe.android.paymentsheet/-payment-sheet/-flow-controller/index.html) instead of `PaymentSheet` using one of the [Builder](https://stripe.dev/stripe-android/paymentsheet/com.stripe.android.paymentsheet/-payment-sheet/-flow-controller/-builder/index.html) methods.

#### Android (Kotlin)

```kotlin
class CheckoutActivity : AppCompatActivity() {
  private lateinit var flowController: PaymentSheet.FlowController

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)

    val flowController = PaymentSheet.FlowController.Builder(
      resultCallback = ::onPaymentSheetResult,
      paymentOptionResultCallback = ::onPaymentOption,
    ).build(this)
  }
}
```

1. Next, call `configureWithPaymentIntent` with the Stripe object keys fetched from your backend and update your UI in the callback using [getPaymentOption()](https://stripe.dev/stripe-android/paymentsheet/com.stripe.android.paymentsheet/-payment-sheet/-flow-controller/index.html#-2091462043%2FFunctions%2F2002900378). This contains an image and label representing the customer’s currently selected payment method.

#### Android (Kotlin)

```kotlin
flowController.configureWithPaymentIntent(
  paymentIntentClientSecret = paymentIntentClientSecret,
  configuration = PaymentSheet.Configuration.Builder("Example, Inc.")
    .customer(PaymentSheet.CustomerConfiguration(
      id = customerId,
      ephemeralKeySecret = ephemeralKeySecret
    ))
    .build()
) { isReady, error ->
  if (isReady) {
    // Update your UI using `flowController.getPaymentOption()`
  } else {
    // handle FlowController configuration failure
  }
}
```

1. Next, call [presentPaymentOptions](https://stripe.dev/stripe-android/paymentsheet/com.stripe.android.paymentsheet/-payment-sheet/-flow-controller/index.html#449924733%2FFunctions%2F2002900378) to collect payment details. When the customer finishes, the sheet is dismissed and calls the [paymentOptionCallback](https://stripe.dev/stripe-android/paymentsheet/com.stripe.android.paymentsheet/-payment-option-callback/index.html) passed earlier in `create`. Implement this method to update your UI with the returned `paymentOption`.

#### Android (Kotlin)

```kotlin
// ...
  flowController.presentPaymentOptions()
// ...
  private fun onPaymentOption(paymentOptionResult: PaymentOptionResult) {
    val paymentOption = paymentOptionResult.paymentOption
    if (paymentOption != null) {
      paymentMethodButton.text = paymentOption.label
      paymentMethodButton.setCompoundDrawablesRelativeWithIntrinsicBounds(
        paymentOption.drawableResourceId,
        0,
        0,
        0
      )
    } else {
      paymentMethodButton.text = "Select"
      paymentMethodButton.setCompoundDrawablesRelativeWithIntrinsicBounds(
        null,
        null,
        null,
        null
      )
    }
  }
```

1. Finally, call [confirm](https://stripe.dev/stripe-android/paymentsheet/com.stripe.android.paymentsheet/-payment-sheet/-flow-controller/index.html#-479056656%2FFunctions%2F2002900378) to complete the payment. When the customer finishes, the sheet is dismissed and calls the [paymentResultCallback](https://stripe.dev/stripe-android/paymentsheet/com.stripe.android.paymentsheet/-payment-sheet-result-callback/index.html#237248767%2FFunctions%2F2002900378) passed earlier in `create`.

#### Android (Kotlin)

```kotlin
  // ...
    flowController.confirmPayment()
  // ...

  private fun onPaymentSheetResult(
    paymentSheetResult: PaymentSheetResult
  ) {
    when (paymentSheetResult) {
      is PaymentSheetResult.Canceled -> {
        // Payment canceled
      }
      is PaymentSheetResult.Failed -> {
        // Payment Failed. See logcat for details or inspect paymentSheetResult.error
      }
      is PaymentSheetResult.Completed -> {
        // Payment Complete
      }
    }
  }
```

Setting `allowsDelayedPaymentMethods` to true allows [delayed notification](https://docs.stripe.com/payments/payment-methods.md#payment-notification) payment methods like US bank accounts. For these payment methods, the final payment status isn’t known when the `PaymentSheet` completes, and instead succeeds or fails later. If you support these types of payment methods, inform the customer their order is confirmed and only fulfill their order (for example, ship their product) when the payment is successful.

## Optional: Enable additional payment methods

Navigate to [Manage payment methods for your connected accounts](https://dashboard.stripe.com/settings/payment_methods/connected_accounts) in the Dashboard to configure which payment methods your connected accounts accept. Changes to default settings apply to all new and existing connected accounts.

Consult the following resources for payment method information:

- [A guide to payment methods](https://stripe.com/payments/payment-methods-guide#choosing-the-right-payment-methods-for-your-business) to help you choose the correct payment methods for your platform.
- [Account capabilities](https://docs.stripe.com/connect/account-capabilities.md) to make sure your chosen payment methods work for your connected accounts.
- [Payment method and product support](https://docs.stripe.com/payments/payment-methods/payment-method-support.md#product-support) tables to make sure your chosen payment methods work for your Stripe products and payments flows.

For each payment method, you can select one of the following dropdown options:

|  |
|  |
| **On by default**  | Your connected accounts accept this payment method during checkout. Some payment methods can only be off or blocked. This is because your connected accounts with *access to the Stripe Dashboard* (Platforms can provide connected accounts with access to the full Stripe Dashboard or the Express Dashboard. Otherwise, platforms build an interface for connected accounts using embedded components or the Stripe API) must activate them in their settings page. |
| **Off by default** | Your connected accounts don’t accept this payment method during checkout. If you allow your connected accounts with *access to the Stripe Dashboard* (Platforms can provide connected accounts with access to the full Stripe Dashboard or the Express Dashboard. Otherwise, platforms build an interface for connected accounts using embedded components or the Stripe API) to manage their own payment methods, they have the ability to turn it on.                |
| **Blocked**        | Your connected accounts don’t accept this payment method during checkout. If you allow your connected accounts with *access to the Stripe Dashboard* (Platforms can provide connected accounts with access to the full Stripe Dashboard or the Express Dashboard. Otherwise, platforms build an interface for connected accounts using embedded components or the Stripe API) to manage their own payment methods, they don’t have the option to turn it on.           |
![Dropdown options for payment methods, each showing an available option (blocked, on by default, off by default)](https://b.stripecdn.com/docs-statics-srv/assets/dropdowns.ef651d721d5939d81521dd34dde4577f.png)

Payment method options

If you make a change to a payment method, you must click **Review changes** in the bottom bar of your screen and **Save and apply** to update your connected accounts.
![Dialog that shows after clicking Save button with a list of what the user changed](https://b.stripecdn.com/docs-statics-srv/assets/dialog.a56ea7716f60db9778706790320d13be.png)

Save dialog

### Allow connected accounts to manage payment methods

Stripe recommends allowing your connected accounts to customize their own payment methods. This option allows each connected account with *access to the Stripe Dashboard* (Platforms can provide connected accounts with access to the full Stripe Dashboard or the Express Dashboard. Otherwise, platforms build an interface for connected accounts using embedded components or the Stripe API) to view and update their [Payment methods](https://dashboard.stripe.com/settings/payment_methods) page. Only owners of the connected accounts can customize their payment methods. The Stripe Dashboard displays the set of payment method defaults you applied to all new and existing connected accounts. Your connected accounts can override these defaults, excluding payment methods you have blocked.

Check the **Account customization** checkbox to enable this option. You must click **Review changes** in the bottom bar of your screen and then select **Save and apply** to update this setting.
![Screenshot of the checkbox to select when allowing connected owners to customize payment methods](https://b.stripecdn.com/docs-statics-srv/assets/checkbox.275bd35d2a025272f03af029a144e577.png)

Account customization checkbox

### Payment method capabilities

To allow your connected accounts to accept additional payment methods, their `Accounts` must have active payment method capabilities.

If you selected the “On by default” option for a payment method in [Manage payment methods for your connected accounts](https://dashboard.stripe.com/settings/payment_methods/connected_accounts), Stripe automatically requests the necessary capability for new and existing connected accounts if they meet the verification requirements. If the connected account doesn’t meet the requirements or if you want to have direct control, you can manually request the capability in the Dashboard or with the API.

Most payment methods have the same verification requirements as the `card_payments` capability, with some restrictions and exceptions. The [payment method capabilities table](https://docs.stripe.com/connect/account-capabilities.md#payment-methods) lists the payment methods that require additional verification.

#### Dashboard

[Find a connected account](https://docs.stripe.com/connect/dashboard/managing-individual-accounts.md#finding-accounts) in the Dashboard to edit its capabilities and view outstanding verification requirements.

#### Accounts v2 API

For an existing connected account, you can retrieve the `Account` and inspect their [merchant capabilities](https://docs.stripe.com/api/v2/core/accounts/retrieve.md#v2_retrieve_accounts-response-configuration-merchant-capabilities) to determine whether you need to request additional capabilities.

```curl
curl -G https://api.stripe.com/v2/core/accounts/{{CONNECTEDACCOUNT_ID}} \
  -H "Authorization: Bearer <<YOUR_SECRET_KEY>>" \
  -H "Stripe-Version: 2025-11-17.preview" \
  -d "include[0]=configuration.merchant"
```

Request additional capabilities by [updating](https://docs.stripe.com/api/v2/core/accounts/update.md#v2_update_accounts-configuration-merchant-capabilities) each connected account’s capabilities.

```curl
curl -X POST https://api.stripe.com/v2/accounts/{{CONNECTEDACCOUNT_ID}} \
  -H "Authorization: Bearer <<YOUR_SECRET_KEY>>" \
  -H "Stripe-Version: 2025-11-17.preview" \
  --json '{
    "configuration": {
        "merchant": {
            "capabilities": {
                "ach_debit_payments": {
                    "requested": true
                }
            }
        }
    },
    "include": [
        "configuration.merchant",
        "requirements"
    ]
  }'
```

Requested capabilities might be delayed before becoming active. If the capability has any activation requirements, the response includes them in the `requirements` arrays.

#### Accounts v1 API

For an existing connected account, you can [list](https://docs.stripe.com/api/capabilities/list.md) their existing capabilities to determine whether you need to request additional capabilities.

```curl
curl https://api.stripe.com/v1/accounts/{{CONNECTEDACCOUNT_ID}}/capabilities \
  -u "<<YOUR_SECRET_KEY>>:"
```

Request additional capabilities by [updating](https://docs.stripe.com/api/capabilities/update.md) each connected account’s capabilities.

```curl
curl https://api.stripe.com/v1/accounts/{{CONNECTEDACCOUNT_ID}}/capabilities/us_bank_account_ach_payments \
  -u "<<YOUR_SECRET_KEY>>:" \
  -d requested=true
```

There can be a delay before the requested capability becomes active. If the capability has any activation requirements, the response includes them in the `requirements` arrays.

## Specify the settlement merchant 

The settlement merchant is dependent on the [capabilities](https://docs.stripe.com/connect/account-capabilities.md) set on an account and how a charge is created. The settlement merchant determines whose information is used to make the charge. This includes the statement descriptor (either the platform’s or the connected account’s) that’s displayed on the customer’s credit card or bank statement for that charge.

Specifying the settlement merchant allows you to be more explicit about who to create charges for. For example, some platforms prefer to be the settlement merchant because the end customer interacts directly with their platform (such as on-demand platforms). However, some platforms have connected accounts that interact directly with end customers instead (such as a storefront on an e-commerce platform). In these scenarios, it might make more sense for the connected account to be the settlement merchant.

You can set the `on_behalf_of` parameter to the ID of a connected account to make that account the settlement merchant for the payment. When using `on_behalf_of`:

- Charges *settle* (When funds are available in your Stripe balance) in the connected account’s country and *settlement currency* (The settlement currency is the currency your bank account uses).
- The fee structure for the connected account’s country is used.
- The connected account’s statement descriptor is displayed on the customer’s credit card statement.
- If the connected account is in a different country than the platform, the connected account’s address and phone number are displayed on the customer’s credit card statement.
- The number of days that a [pending balance](https://docs.stripe.com/connect/account-balances.md) is held before being paid out depends on the [delay_days](https://docs.stripe.com/api/accounts/create.md#create_account-settings-payouts-schedule-delay_days) setting on the connected account.

> #### Accounts v2 API
> 
> You can’t use the Accounts v2 API to manage payout settings. Use the Accounts v1 API.

If `on_behalf_of` is omitted, the platform is the business of record for the payment.

> The `on_behalf_of` parameter is supported only for connected accounts with a payments capability such as [card_payments](https://docs.stripe.com/connect/account-capabilities.md#card-payments). Accounts under the [recipient service agreement](https://docs.stripe.com/connect/service-agreement-types.md#recipient) can’t request `card_payments` or other payments capabilities.

```curl
curl https://api.stripe.com/v1/payment_intents \
  -u "<<YOUR_SECRET_KEY>>:" \
  -d amount=10000 \
  -d currency=eur \
  -d "automatic_payment_methods[enabled]=true" \
  -d "on_behalf_of={{CONNECTEDACCOUNT_ID}}" \
  -d transfer_group=ORDER100
```
![](https://b.stripecdn.com/docs-statics-srv/assets/ios-overview.9e0d68d009dc005f73a6f5df69e00458.png)

This integration combines all of the steps required to pay, including collecting payment details and confirming the payment, into a single sheet that displays on top of your app.

## Set up Stripe [Server-side] [Client-side]

### Server-side 

This integration requires endpoints on your server that talk to the Stripe API. Use the official libraries for access to the Stripe API from your server:

#### Ruby

```bash
# Available as a gem
sudo gem install stripe
```

```ruby
# If you use bundler, you can add this line to your Gemfile
gem 'stripe'
```

### Client-side 

The [React Native SDK](https://github.com/stripe/stripe-react-native) is open source and fully documented. Internally, it uses the [native iOS](https://github.com/stripe/stripe-ios) and [Android](https://github.com/stripe/stripe-android) SDKs. To install Stripe’s React Native SDK, run one of the following commands in your project’s directory (depending on which package manager you use):

#### yarn

```bash
yarn add @stripe/stripe-react-native
```

#### npm

```bash
npm install @stripe/stripe-react-native
```

Next, install some other necessary dependencies:

- For iOS, go to the **ios** directory and run `pod install` to ensure that you also install the required native dependencies.
- For Android, there are no more dependencies to install.

> We recommend following the [official TypeScript guide](https://reactnative.dev/docs/typescript#adding-typescript-to-an-existing-project) to add TypeScript support.

### Stripe initialization

To initialize Stripe in your React Native app, either wrap your payment screen with the `StripeProvider` component, or use the `initStripe` initialization method. Only the API [publishable key](https://docs.stripe.com/keys.md#obtain-api-keys) in `publishableKey` is required. The following example shows how to initialize Stripe using the `StripeProvider` component.

```jsx
import { useState, useEffect } from 'react';
import { StripeProvider } from '@stripe/stripe-react-native';

function App() {
  const [publishableKey, setPublishableKey] = useState('');

  const fetchPublishableKey = async () => {
    const key = await fetchKey(); // fetch key from your server here
    setPublishableKey(key);
  };

  useEffect(() => {
    fetchPublishableKey();
  }, []);

  return (
    <StripeProvider
      publishableKey={publishableKey}
      merchantIdentifier="merchant.identifier" // required for Apple Pay
      urlScheme="your-url-scheme" // required for 3D Secure and bank redirects
    >
      {/* Your app code here */}
    </StripeProvider>
  );
}
```

> Use your API [test keys](https://docs.stripe.com/keys.md#obtain-api-keys) while you test and develop, and your [live mode](https://docs.stripe.com/keys.md#test-live-modes) keys when you publish your app.

## Add an endpoint [Server-side]

This integration uses three Stripe API objects:

1. A [PaymentIntent](https://docs.stripe.com/api/payment_intents.md). Stripe uses this to represent your intent to collect a payment from a customer, tracking your charge attempts and payment state changes throughout the process.
1. A *Customer* (Customer objects represent customers of your business. They let you reuse payment methods and give you the ability to track multiple payments)(optional). To set up a payment method for future payments, it must be attached to a Customer. Create a Customer object when your customer creates an account with your business. If your customer is making a payment as a guest, you can create a Customer object before payment and associate it with your own internal representation of the customer’s account later.
1. A Customer Ephemeral Key (optional). Information on the Customer object is sensitive, and can’t be retrieved directly from an app. An Ephemeral Key grants the SDK temporary access to the Customer.

If you want to save cards and allow returning customers to reuse saved cards, you need the Customer and Customer Ephemeral Key objects for your integration. Otherwise, you can omit these objects.

For security reasons, your app can’t create these objects. Instead, add an endpoint on your server that:

1. Retrieves the Customer, or creates a new one.
1. Creates an Ephemeral Key for the Customer.
1. Creates a PaymentIntent with the [amount](https://docs.stripe.com/api/payment_intents/create.md#create_payment_intent-amount), [currency](https://docs.stripe.com/api/payment_intents/create.md#create_payment_intent-currency), [customer](https://docs.stripe.com/api/payment_intents/create.md#create_payment_intent-customer), and a [transfer group](https://docs.stripe.com/api/payment_intents/create.md#create_payment_intent-transfer_group) to associate with the transfer of funds later.
1. Returns the Payment Intent’s *client secret* (The client secret is a unique key returned from Stripe as part of a PaymentIntent. This key lets the client access important fields from the PaymentIntent (status, amount, currency) while hiding sensitive ones (metadata, customer)), the Ephemeral Key’s `secret`, the [Customer ID](https://docs.stripe.com/api/customers/object.md#customer_object-id), and your [publishable key](https://dashboard.stripe.com/apikeys) to your app.

> #### Accounts v2 API
> 
> Instead of passing a `Customer` ID in the `customer` parameter, you can pass the ID of an `Account` that has the `customer` configuration in the [customer_account](https://docs.stripe.com/api/payment_intents/create.md?api-version=preview#create_payment_intent-customer_account) parameter. In that case, the `Account` ID returns in the [customer_account](https://docs.stripe.com/api/payment_intents/object.md?api-version=preview#payment_intent_object-customer_account) property.

The payment methods shown to customers during the checkout process are also included on the PaymentIntent. You can let Stripe pull payment methods from your [Dashboard settings](https://dashboard.stripe.com/settings/payment_methods) or you can list them manually.

Unless your integration requires a code-based option for offering payment methods, don’t list payment methods manually. Stripe evaluates the currency, payment method restrictions, and other parameters to determine the list of supported payment methods. Stripe prioritizes payment methods that help increase conversion and are most relevant to the currency and the customer’s location. We hide lower priority payment methods in an overflow menu.

#### Manage payment methods from the Dashboard

You can fork and deploy an implementation of this endpoint on [CodeSandbox](https://codesandbox.io/p/devbox/suspicious-lalande-l325w6) for testing.

#### curl

```bash
# Create a Customer (use an existing Customer ID if this is a returning customer)
curl https://api.stripe.com/v1/customers \
  -u <<YOUR_SECRET_KEY>>: \
  -X "POST"

# Create an Ephemeral Key for the Customer
curl https://api.stripe.com/v1/ephemeral_keys \
  -u <<YOUR_SECRET_KEY>>: \
  -H "Stripe-Version: 2025-07-30.basil" \
  -X "POST" \
  -d "customer"="{{CUSTOMER_ID}}" \

# Create a PaymentIntent
curl https://api.stripe.com/v1/payment_intents \
  -u <<YOUR_SECRET_KEY>>: \
  -X "POST" \
  -d "customer"="{{CUSTOMER_ID}}" \
  -d "amount"=10000 \
  -d "currency"="usd" \
  # In the latest version of the API, specifying the `automatic_payment_methods` parameter
  # is optional because Stripe enables its functionality by default.
  -d "automatic_payment_methods[enabled]"=true \
  -d transfer_group="ORDER100" \
```

#### Listing payment methods manually

You can fork and deploy an implementation of this endpoint on [CodeSandbox](https://codesandbox.io/p/devbox/suspicious-lalande-l325w6) for testing.

#### curl

```bash
# Create a Customer (use an existing Customer ID if this is a returning customer)
curl https://api.stripe.com/v1/customers \
  -u <<YOUR_SECRET_KEY>>: \
  -X "POST"

# Create an Ephemeral Key for the Customer
curl https://api.stripe.com/v1/ephemeral_keys \
  -u <<YOUR_SECRET_KEY>>: \
  -H "Stripe-Version: 2025-07-30.basil" \
  -X "POST" \
  -d "customer"="{{CUSTOMER_ID}}" \

# Create a PaymentIntent
curl https://api.stripe.com/v1/payment_intents \
  -u <<YOUR_SECRET_KEY>>: \
  -X "POST" \
  -d "customer"="{{CUSTOMER_ID}}" \
  -d "amount"=10000 \
  -d "currency"="eur" \
  -d "payment_method_types[]"="bancontact" \
  -d "payment_method_types[]"="card" \
  -d "payment_method_types[]"="ideal" \
  -d "payment_method_types[]"="klarna" \
  -d "payment_method_types[]"="sepa_debit" \
  -d transfer_group="ORDER100" \
```

Each payment method needs to support the currency passed in the PaymentIntent and your business needs to be based in one of the countries each payment method supports. See the [Payment method integration options](https://docs.stripe.com/payments/payment-methods/integration-options.md) page for more details about what’s supported.

## Integrate the payment sheet [Client-side]

Before displaying the mobile Payment Element, your checkout page should:

- Show the products being purchased and the total amount
- Collect any required shipping information
- Include a checkout button to present Stripe’s UI

In the checkout of your app, make a network request to the backend endpoint you created in the previous step and call `initPaymentSheet` from the `useStripe` hook.

```javascript

export default function CheckoutScreen() {
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const [loading, setLoading] = useState(false);

  const fetchPaymentSheetParams = async () => {
    const response = await fetch(`${API_URL}/payment-sheet`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    const { paymentIntent, ephemeralKey, customer } = await response.json();

    return {
      paymentIntent,
      ephemeralKey,
      customer,
    };
  };

  const initializePaymentSheet = async () => {
    const {
      paymentIntent,
      ephemeralKey,
      customer,
    } = await fetchPaymentSheetParams();

    const { error } = await initPaymentSheet({
      merchantDisplayName: "Example, Inc.",
      customerId: customer,
      customerEphemeralKeySecret: ephemeralKey,
      paymentIntentClientSecret: paymentIntent,
      // Set `allowsDelayedPaymentMethods` to true if your business can handle payment
      //methods that complete payment after a delay, like SEPA Debit and Sofort.
      allowsDelayedPaymentMethods: true,
      defaultBillingDetails: {
        name: 'Jane Doe',
      }
    });
    if (!error) {
      setLoading(true);
    }
  };

  const openPaymentSheet = async () => {
    // see below
  };

  useEffect(() => {
    initializePaymentSheet();
  }, []);

  return (
    <Screen>
      <Button
        variant="primary"
        disabled={!loading}
        title="Checkout"
        onPress={openPaymentSheet}
      />
    </Screen>
  );
}
```

When your customer taps the **Checkout** button, call `presentPaymentSheet()` to open the sheet. After the customer completes the payment, the sheet is dismissed and the promise resolves with an optional `StripeError<PaymentSheetError>`.

```javascript
export default function CheckoutScreen() {
  // continued from above

  const openPaymentSheet = async () => {
    const { error } = await presentPaymentSheet();

    if (error) {
      Alert.alert(`Error code: ${error.code}`, error.message);
    } else {
      Alert.alert('Success', 'Your order is confirmed!');
    }
  };

  return (
    <Screen>
      <Button
        variant="primary"
        disabled={!loading}
        title="Checkout"
        onPress={openPaymentSheet}
      />
    </Screen>
  );
}
```

If there is no error, inform the user they’re done (for example, by displaying an order confirmation screen).

Setting `allowsDelayedPaymentMethods` to true allows [delayed notification](https://docs.stripe.com/payments/payment-methods.md#payment-notification) payment methods like US bank accounts. For these payment methods, the final payment status isn’t known when the `PaymentSheet` completes, and instead succeeds or fails later. If you support these types of payment methods, inform the customer their order is confirmed and only fulfill their order (for example, ship their product) when the payment is successful.

## Set up a return URL (iOS only) [Client-side]

The customer might navigate away from your app to authenticate (for example, in Safari or their banking app). To allow them to automatically return to your app after authenticating, [configure a custom URL scheme](https://developer.apple.com/documentation/xcode/defining-a-custom-url-scheme-for-your-app) and set up your app delegate to forward the URL to the SDK. Stripe doesn’t support [universal links](https://developer.apple.com/documentation/xcode/allowing-apps-and-websites-to-link-to-your-content).

#### SceneDelegate

#### Swift

```swift
// This method handles opening custom URL schemes (for example, "your-app://stripe-redirect")
func scene(_ scene: UIScene, openURLContexts URLContexts: Set<UIOpenURLContext>) {
    guard let url = URLContexts.first?.url else {
        return
    }
    let stripeHandled = StripeAPI.handleURLCallback(with: url)
    if (!stripeHandled) {
        // This was not a Stripe url – handle the URL normally as you would
    }
}

```

#### AppDelegate

#### Swift

```swift
// This method handles opening custom URL schemes (for example, "your-app://stripe-redirect")
func application(_ app: UIApplication, open url: URL, options: [UIApplication.OpenURLOptionsKey: Any] = [:]) -> Bool {
    let stripeHandled = StripeAPI.handleURLCallback(with: url)
    if (stripeHandled) {
        return true
    } else {
        // This was not a Stripe url – handle the URL normally as you would
    }
    return false
}
```

#### SwiftUI

#### Swift

```swift

@main
struct MyApp: App {
  var body: some Scene {
    WindowGroup {
      Text("Hello, world!").onOpenURL { incomingURL in
          let stripeHandled = StripeAPI.handleURLCallback(with: incomingURL)
          if (!stripeHandled) {
            // This was not a Stripe url – handle the URL normally as you would
          }
        }
    }
  }
}
```

Additionally, set the [returnURL](https://stripe.dev/stripe-ios/stripe-paymentsheet/Classes/PaymentSheet/Configuration.html#/s:6Stripe12PaymentSheetC13ConfigurationV9returnURLSSSgvp) on your [PaymentSheet.Configuration](https://stripe.dev/stripe-ios/stripe-paymentsheet/Classes/PaymentSheet/Configuration.html) object to the URL for your app.

```swift
var configuration = PaymentSheet.Configuration()
configuration.returnURL = "your-app://stripe-redirect"
```

## Handle post-payment events

Stripe sends a [payment_intent.succeeded](https://docs.stripe.com/api/events/types.md#event_types-payment_intent.succeeded) event when the payment completes. Use the [Dashboard webhook tool](https://dashboard.stripe.com/webhooks) or follow the [webhook guide](https://docs.stripe.com/webhooks/quickstart.md) to receive these events and run actions, such as sending an order confirmation email to your customer, logging the sale in a database, or starting a shipping workflow.

Listen for these events rather than waiting on a callback from the client. On the client, the customer could close the browser window or quit the app before the callback executes, and malicious clients could manipulate the response. Setting up your integration to listen for asynchronous events is what enables you to accept [different types of payment methods](https://stripe.com/payments/payment-methods-guide) with a single integration.

In addition to handling the `payment_intent.succeeded` event, we recommend handling these other events when collecting payments with the Payment Element:

| Event                                                                                                                           | Description                                                                                                                                                                                                                                                                         | Action                                                                                                                                                                                           |
| ------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| [payment_intent.succeeded](https://docs.stripe.com/api/events/types.md?lang=php#event_types-payment_intent.succeeded)           | Sent when a customer successfully completes a payment.                                                                                                                                                                                                                              | Send the customer an order confirmation and *fulfill* (Fulfillment is the process of providing the goods or services purchased by a customer, typically after payment is collected) their order. |
| [payment_intent.processing](https://docs.stripe.com/api/events/types.md?lang=php#event_types-payment_intent.processing)         | Sent when a customer successfully initiates a payment, but the payment has yet to complete. This event is most commonly sent when the customer initiates a bank debit. It’s followed by either a `payment_intent.succeeded` or `payment_intent.payment_failed` event in the future. | Send the customer an order confirmation that indicates their payment is pending. For digital goods, you might want to fulfill the order before waiting for payment to complete.                  |
| [payment_intent.payment_failed](https://docs.stripe.com/api/events/types.md?lang=php#event_types-payment_intent.payment_failed) | Sent when a customer attempts a payment, but the payment fails.                                                                                                                                                                                                                     | If a payment transitions from `processing` to `payment_failed`, offer the customer another attempt to pay.                                                                                       |

## Create a Transfer [Server-side]

On your server, send funds from your account to a connected account by creating a [Transfer](https://docs.stripe.com/api/transfers/create.md) and specifying the `transfer_group` used.

```curl
curl https://api.stripe.com/v1/transfers \
  -u "<<YOUR_SECRET_KEY>>:" \
  -d amount=7000 \
  -d currency=usd \
  -d "destination={{CONNECTEDACCOUNT_ID}}" \
  -d transfer_group=ORDER100
```

Transfer and charge amounts don’t have to match. You can split a single charge between multiple transfers or include multiple charges in a single transfer. The following example creates an additional transfer associated with the same `transfer_group`.

```curl
curl https://api.stripe.com/v1/transfers \
  -u "<<YOUR_SECRET_KEY>>:" \
  -d amount=2000 \
  -d currency=usd \
  -d destination={{OTHER_CONNECTED_ACCOUNT_ID}} \
  -d transfer_group=ORDER100
```

### Transfer options

You can assign any value to the `transfer_group` string, but it must represent a single business action. You can also make a transfer with neither an associated charge nor a `transfer_group`—for example, when you must pay a provider but there’s no associated customer payment.

> The `transfer_group` only identifies associated objects. It doesn’t affect any standard functionality. To prevent a transfer from executing before the funds from the associated charge are available, use the transfer’s `source_transaction` attribute.

By default, a transfer request fails when the amount exceeds the platform’s [available account balance](https://docs.stripe.com/connect/account-balances.md). Stripe doesn’t automatically retry failed transfer requests.

You can avoid failed transfer requests for transfers that are associated with charges. When you specify the associated charge [as the transfer’s source_transaction](https://docs.stripe.com/connect/separate-charges-and-transfers.md#transfer-availability), the transfer request automatically succeeds. However, we don’t execute the transfer until the funds from that charge are available in the platform account.

> If you use separate charges and transfers, take that into account when planning your *payout* (A payout is the transfer of funds to an external account, usually a bank account, in the form of a deposit) schedule. Automatic payouts can interfere with transfers that don’t have a defined `source_transaction`.

### Asynchronous payment methods

If you’re using *asynchronous payment methods* (Asynchronous payment methods can take up to several days to confirm whether the payment has been successful. During this time, the payment can't be guaranteed) (such as ACH Debit or SEPA Debit), wait for a [charge.succeeded](https://docs.stripe.com/api/events/types.md#event_types-charge.succeeded) event before creating a transfer. Unlike destination charges, Stripe doesn’t automatically reverse a transfer if the associated async payment fails. If you create a transfer and the payment subsequently fails, your platform’s balance is debited for the transfer amount. You must then manually [reverse the transfer](https://docs.stripe.com/connect/separate-charges-and-transfers.md#reverse-transfers) to recover the funds.

## Test the integration

#### Cards

| Card number         | Scenario                                                                                                                                                                                                                                                                                      | How to test                                                                                           |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| 4242424242424242    | The card payment succeeds and doesn’t require authentication.                                                                                                                                                                                                                                 | Fill out the credit card form using the credit card number with any expiration, CVC, and postal code. |
| 4000002500003155    | The card payment requires *authentication* (Strong Customer Authentication (SCA) is a regulatory requirement in effect as of September 14, 2019, that impacts many European online payments. It requires customers to use two-factor authentication like 3D Secure to verify their purchase). | Fill out the credit card form using the credit card number with any expiration, CVC, and postal code. |
| 4000000000009995    | The card is declined with a decline code like `insufficient_funds`.                                                                                                                                                                                                                           | Fill out the credit card form using the credit card number with any expiration, CVC, and postal code. |
| 6205500000000000004 | The UnionPay card has a variable length of 13-19 digits.                                                                                                                                                                                                                                      | Fill out the credit card form using the credit card number with any expiration, CVC, and postal code. |

#### Bank redirects

| Payment method    | Scenario                                                                                                                                                                                        | How to test                                                                                                                                              |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Bancontact, iDEAL | Your customer fails to authenticate on the redirect page for a redirect-based and immediate notification payment method.                                                                        | Choose any redirect-based payment method, fill out the required details, and confirm the payment. Then click **Fail test payment** on the redirect page. |
| Pay by Bank       | Your customer successfully pays with a redirect-based and [delayed notification](https://docs.stripe.com/payments/payment-methods.md#payment-notification) payment method.                      | Choose the payment method, fill out the required details, and confirm the payment. Then click **Complete test payment** on the redirect page.            |
| Pay by Bank       | Your customer fails to authenticate on the redirect page for a redirect-based and delayed notification payment method.                                                                          | Choose the payment method, fill out the required details, and confirm the payment. Then click **Fail test payment** on the redirect page.                |
| BLIK              | BLIK payments fail in a variety of ways—immediate failures (for example, the code is expired or invalid), delayed errors (the bank declines) or timeouts (the customer didn’t respond in time). | Use email patterns to [simulate the different failures.](https://docs.stripe.com/payments/blik/accept-a-payment.md#simulate-failures)                    |

#### Bank debits

| Payment method    | Scenario                                                                                          | How to test                                                                                                                                                                                       |
| ----------------- | ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SEPA Direct Debit | Your customer successfully pays with SEPA Direct Debit.                                           | Fill out the form using the account number `AT321904300235473204`. The confirmed PaymentIntent initially transitions to processing, then transitions to the succeeded status three minutes later. |
| SEPA Direct Debit | Your customer’s payment intent status transitions from `processing` to `requires_payment_method`. | Fill out the form using the account number `AT861904300235473202`.                                                                                                                                |

See [Testing](https://docs.stripe.com/testing.md) for additional information to test your integration.

## Enable card scanning [Client-side]

> Enabling card scanning is required for Apple’s iOS app review process. Card scanning is not required for Android’s app review process, but we recommend enabling it.

### iOS

To enable card scanning support for iOS, set the `NSCameraUsageDescription` (**Privacy - Camera Usage Description**) in the `Info.plist` of your application, and provide a reason for accessing the camera (for example, “To scan cards”).

### (Optional) Android

To enable card scanning support, [request production access](https://developers.google.com/pay/api/android/guides/test-and-deploy/request-prod-access) to the Google Pay API from the [Google Pay and Wallet Console](https://pay.google.com/business/console?utm_source=devsite&utm_medium=devsite&utm_campaign=devsite).

- If you’ve enabled Google Pay, the card scanning feature is automatically available in our UI on eligible devices. To learn more about eligible devices, see the [Google Pay API constraints](https://developers.google.com/pay/payment-card-recognition/debit-credit-card-recognition)
- **Important:** The card scanning feature only appears in builds signed with the same signing key registered in the [Google Pay & Wallet Console](https://pay.google.com/business/console). Test or debug builds using different signing keys (for example, builds distributed through Firebase App Tester) won’t show the **Scan card** option. To test card scanning in pre-release builds, you must either:
  - Sign your test builds with your production signing key
  - Add your test signing key fingerprint to the Google Pay and Wallet Console

## Optional: Enable Apple Pay

### Register for an Apple Merchant ID

Obtain an Apple Merchant ID by [registering for a new identifier](https://developer.apple.com/account/resources/identifiers/add/merchant) on the Apple Developer website.

Fill out the form with a description and identifier. Your description is for your own records and you can modify it in the future. Stripe recommends using the name of your app as the identifier (for example, `merchant.com.{{YOUR_APP_NAME}}`).

### Create a new Apple Pay certificate

Create a certificate for your app to encrypt payment data.

Go to the [iOS Certificate Settings](https://dashboard.stripe.com/settings/ios_certificates) in the Dashboard, click **Add new application**, and follow the guide.

Download a Certificate Signing Request (CSR) file to get a secure certificate from Apple that allows you to use Apple Pay.

One CSR file must be used to issue exactly one certificate. If you switch your Apple Merchant ID, you must go to the [iOS Certificate Settings](https://dashboard.stripe.com/settings/ios_certificates) in the Dashboard to obtain a new CSR and certificate.

### Integrate with Xcode

Add the Apple Pay capability to your app. In Xcode, open your project settings, click the **Signing & Capabilities** tab, and add the **Apple Pay** capability. You might be prompted to log in to your developer account at this point. Select the merchant ID you created earlier, and your app is ready to accept Apple Pay.
![](https://b.stripecdn.com/docs-statics-srv/assets/xcode.a701d4c1922d19985e9c614a6f105bf1.png)

Enable the Apple Pay capability in Xcode

### Add Apple Pay

#### One-time payment

Pass your merchant ID when you create `StripeProvider`:

```javascript
import { StripeProvider } from '@stripe/stripe-react-native';

function App() {
  return (
    <StripeProvider
      publishableKey="<<YOUR_PUBLISHABLE_KEY>>"
      merchantIdentifier="MERCHANT_ID"
    >
      {/* Your app code here */}
    </StripeProvider>
  );
}
```

When you call `initPaymentSheet`, pass in your [ApplePayParams](https://stripe.dev/stripe-react-native/api-reference/modules/PaymentSheet.html#ApplePayParams):

```javascript
await initPaymentSheet({
  // ...
  applePay: {
    merchantCountryCode: 'US',
  },
});
```

#### Recurring payments

When you call `initPaymentSheet`, pass in an [ApplePayParams](https://stripe.dev/stripe-react-native/api-reference/modules/PaymentSheet.html#ApplePayParams) with `merchantCountryCode` set to the country code of your business.

In accordance with [Apple’s guidelines](https://developer.apple.com/design/human-interface-guidelines/apple-pay#Supporting-subscriptions) for recurring payments, you must also set a `cardItems` that includes a [RecurringCartSummaryItem](https://stripe.dev/stripe-react-native/api-reference/modules/ApplePay.html#RecurringCartSummaryItem) with the amount you intend to charge (for example, “59.95 USD a month”).

You can also adopt [merchant tokens](https://developer.apple.com/apple-pay/merchant-tokens/) by setting the `request` with its `type` set to `PaymentRequestType.Recurring`

To learn more about how to use recurring payments with Apple Pay, see [Apple’s PassKit documentation](https://developer.apple.com/documentation/passkit/pkpaymentrequest).

#### iOS (React Native)

```javascript
const initializePaymentSheet = async () => {
  const recurringSummaryItem = {
    label: 'My Subscription',
    amount: '59.99',
    paymentType: 'Recurring',
    intervalCount: 1,
    intervalUnit: 'month',
    // Payment starts today
    startDate: new Date().getTime() / 1000,

    // Payment ends in one year
    endDate: new Date().getTime() / 1000 + 60 * 60 * 24 * 365,
  };

  const {error} = await initPaymentSheet({
    // ...
    applePay: {
      merchantCountryCode: 'US',
      cartItems: [recurringSummaryItem],
      request: {
        type: PaymentRequestType.Recurring,
        description: 'Recurring',
        managementUrl: 'https://my-backend.example.com/customer-portal',
        billing: recurringSummaryItem,
        billingAgreement:
          "You'll be billed $59.99 every month for the next 12 months. To cancel at any time, go to Account and click 'Cancel Membership.'",
      },
    },
  });
};
```

### Order tracking

To add [order tracking](https://developer.apple.com/design/human-interface-guidelines/technologies/wallet/designing-order-tracking) information in iOS 16 or later, configure a `setOrderTracking` callback function. Stripe calls your implementation after the payment is complete, but before iOS dismisses the Apple Pay sheet.

In your implementation of `setOrderTracking` callback function, fetch the order details from your server for the completed order, and pass the details to the provided `completion` function.

To learn more about order tracking, see [Apple’s Wallet Orders documentation](https://developer.apple.com/documentation/walletorders).

#### iOS (React Native)

```javascript
await initPaymentSheet({
  // ...
  applePay: {
    // ...
    setOrderTracking: async complete => {
      const apiEndpoint =
        Platform.OS === 'ios'
          ? 'http://localhost:4242'
          : 'http://10.0.2.2:4567';
      const response = await fetch(
        `${apiEndpoint}/retrieve-order?orderId=${orderId}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );
      if (response.status === 200) {
        const orderDetails = await response.json();
        // orderDetails should include orderIdentifier, orderTypeIdentifier,
        // authenticationToken and webServiceUrl
        complete(orderDetails);
      }
    },
  },
});
```

## Optional: Enable Google Pay

### Set up your integration

To use Google Pay, first enable the Google Pay API by adding the following to the `<application>` tag of your **AndroidManifest.xml**:

```xml
<application>
  ...
  <meta-data
    android:name="com.google.android.gms.wallet.api.enabled"
    android:value="true" />
</application>
```

For more details, see Google Pay’s [Set up Google Pay API](https://developers.google.com/pay/api/android/guides/setup) for Android.

### Add Google Pay

When you initialize `PaymentSheet`, set `merchantCountryCode` to the country code of your business and set `googlePay` to true.

You can also use the test environment by passing the `testEnv` parameter. You can only test Google Pay on a physical Android device. Follow the [React Native docs](https://reactnative.dev/docs/running-on-device) to test your application on a physical device.

```javascript
const { error, paymentOption } = await initPaymentSheet({
  // ...
  googlePay: {
    merchantCountryCode: 'US',
    testEnv: true, // use test environment
  },
});
```

## Optional: Customize the sheet

All customization is configured using `initPaymentSheet`.

### Appearance

Customize colors, fonts, and so on to match the look and feel of your app by using the [appearance API](https://docs.stripe.com/elements/appearance-api/mobile.md?platform=react-native).

### Merchant display name

Specify a customer-facing business name by setting `merchantDisplayName`. By default, this is your app’s name.

```javascript
await initPaymentSheet({
  // ...
  merchantDisplayName: 'Example Inc.',
});
```

### Dark mode

By default, `PaymentSheet` automatically adapts to the user’s system-wide appearance settings (light and dark mode). You can change this by setting the `style` property to `alwaysLight` or `alwaysDark` mode on iOS.

```javascript
await initPaymentSheet({
  // ...
  style: 'alwaysDark',
});
```

On Android, set light or dark mode on your app:

```
// force dark
AppCompatDelegate.setDefaultNightMode(AppCompatDelegate.MODE_NIGHT_YES)
// force light
AppCompatDelegate.setDefaultNightMode(AppCompatDelegate.MODE_NIGHT_NO)
```

### Default billing details

To set default values for billing details collected in the PaymentSheet, configure the `defaultBillingDetails` property. The `PaymentSheet` pre-populates its fields with the values that you provide.

```javascript
await initPaymentSheet({
  // ...
  defaultBillingDetails: {
      email: 'foo@bar.com',
      address: {
        country: 'US',
      },
  },
});
```

### Collect billing details

Use `billingDetailsCollectionConfiguration` to specify how you want to collect billing details in the PaymentSheet.

You can collect your customer’s name, email, phone number, and address.

If you don’t intend to collect the values that the payment method requires, you must do the following:

1. Attach the values that aren’t collected by `PaymentSheet` to the `defaultBillingDetails` property.
1. Set `billingDetailsCollectionConfiguration.attachDefaultsToPaymentMethod` to `true`.

```javascript
await initPaymentSheet({
  // ...
  defaultBillingDetails: {
    email: 'foo@bar.com',
  },
  billingDetailsCollectionConfiguration: {
    name: PaymentSheet.CollectionMode.ALWAYS,
    email: PaymentSheet.CollectionMode.NEVER,
    address: PaymentSheet.AddressCollectionMode.FULL,
    attachDefaultsToPaymentMethod: true
  },
});
```

> Consult with your legal counsel regarding laws that apply to collecting information. Only collect phone numbers if you need them for the transaction.

## Optional: Complete payment in your UI

You can present Payment Sheet to only collect payment method details and then later call a `confirm` method to complete payment in your app’s UI. This is useful if you have a custom buy button or require additional steps after payment details are collected.
![](https://b.stripecdn.com/docs-statics-srv/assets/react-native-multi-step.84d8a0a44b1baa596bda491322b6d9fd.png)

> A sample integration is [available on our GitHub](https://github.com/stripe/stripe-react-native/blob/master/example/src/screens/PaymentsUICustomScreen.tsx).

1. First, call `initPaymentSheet` and pass `customFlow: true`. `initPaymentSheet` resolves with an initial payment option containing an image and label representing the customer’s payment method. Update your UI with these details.

```javascript
const {
  initPaymentSheet,
  presentPaymentSheet,
  confirmPaymentSheetPayment,
} = useStripe()

const { error, paymentOption } = await initPaymentSheet({
  customerId: customer,
  customerEphemeralKeySecret: ephemeralKey,
  paymentIntentClientSecret: paymentIntent,
  customFlow: true,
  merchantDisplayName: 'Example Inc.',
});
// Update your UI with paymentOption
```

1. Use `presentPaymentSheet` to collect payment details. When the customer finishes, the sheet dismisses itself and resolves the promise. Update your UI with the selected payment method details.

```javascript
const { error, paymentOption } = await presentPaymentSheet();
```

1. Use `confirmPaymentSheetPayment` to confirm the payment. This resolves with the result of the payment.

```javascript
const { error } = await confirmPaymentSheetPayment();

if (error) {
  Alert.alert(`Error code: ${error.code}`, error.message);
} else {
  Alert.alert(
    'Success',
    'Your order is confirmed!'
  );
}
```

Setting `allowsDelayedPaymentMethods` to true allows [delayed notification](https://docs.stripe.com/payments/payment-methods.md#payment-notification) payment methods like US bank accounts. For these payment methods, the final payment status isn’t known when the `PaymentSheet` completes, and instead succeeds or fails later. If you support these types of payment methods, inform the customer their order is confirmed and only fulfill their order (for example, ship their product) when the payment is successful.

## Optional: Enable additional payment methods

Navigate to [Manage payment methods for your connected accounts](https://dashboard.stripe.com/settings/payment_methods/connected_accounts) in the Dashboard to configure which payment methods your connected accounts accept. Changes to default settings apply to all new and existing connected accounts.

Consult the following resources for payment method information:

- [A guide to payment methods](https://stripe.com/payments/payment-methods-guide#choosing-the-right-payment-methods-for-your-business) to help you choose the correct payment methods for your platform.
- [Account capabilities](https://docs.stripe.com/connect/account-capabilities.md) to make sure your chosen payment methods work for your connected accounts.
- [Payment method and product support](https://docs.stripe.com/payments/payment-methods/payment-method-support.md#product-support) tables to make sure your chosen payment methods work for your Stripe products and payments flows.

For each payment method, you can select one of the following dropdown options:

|  |
|  |
| **On by default**  | Your connected accounts accept this payment method during checkout. Some payment methods can only be off or blocked. This is because your connected accounts with *access to the Stripe Dashboard* (Platforms can provide connected accounts with access to the full Stripe Dashboard or the Express Dashboard. Otherwise, platforms build an interface for connected accounts using embedded components or the Stripe API) must activate them in their settings page. |
| **Off by default** | Your connected accounts don’t accept this payment method during checkout. If you allow your connected accounts with *access to the Stripe Dashboard* (Platforms can provide connected accounts with access to the full Stripe Dashboard or the Express Dashboard. Otherwise, platforms build an interface for connected accounts using embedded components or the Stripe API) to manage their own payment methods, they have the ability to turn it on.                |
| **Blocked**        | Your connected accounts don’t accept this payment method during checkout. If you allow your connected accounts with *access to the Stripe Dashboard* (Platforms can provide connected accounts with access to the full Stripe Dashboard or the Express Dashboard. Otherwise, platforms build an interface for connected accounts using embedded components or the Stripe API) to manage their own payment methods, they don’t have the option to turn it on.           |
![Dropdown options for payment methods, each showing an available option (blocked, on by default, off by default)](https://b.stripecdn.com/docs-statics-srv/assets/dropdowns.ef651d721d5939d81521dd34dde4577f.png)

Payment method options

If you make a change to a payment method, you must click **Review changes** in the bottom bar of your screen and **Save and apply** to update your connected accounts.
![Dialog that shows after clicking Save button with a list of what the user changed](https://b.stripecdn.com/docs-statics-srv/assets/dialog.a56ea7716f60db9778706790320d13be.png)

Save dialog

### Allow connected accounts to manage payment methods

Stripe recommends allowing your connected accounts to customize their own payment methods. This option allows each connected account with *access to the Stripe Dashboard* (Platforms can provide connected accounts with access to the full Stripe Dashboard or the Express Dashboard. Otherwise, platforms build an interface for connected accounts using embedded components or the Stripe API) to view and update their [Payment methods](https://dashboard.stripe.com/settings/payment_methods) page. Only owners of the connected accounts can customize their payment methods. The Stripe Dashboard displays the set of payment method defaults you applied to all new and existing connected accounts. Your connected accounts can override these defaults, excluding payment methods you have blocked.

Check the **Account customization** checkbox to enable this option. You must click **Review changes** in the bottom bar of your screen and then select **Save and apply** to update this setting.
![Screenshot of the checkbox to select when allowing connected owners to customize payment methods](https://b.stripecdn.com/docs-statics-srv/assets/checkbox.275bd35d2a025272f03af029a144e577.png)

Account customization checkbox

### Payment method capabilities

To allow your connected accounts to accept additional payment methods, their `Accounts` must have active payment method capabilities.

If you selected the “On by default” option for a payment method in [Manage payment methods for your connected accounts](https://dashboard.stripe.com/settings/payment_methods/connected_accounts), Stripe automatically requests the necessary capability for new and existing connected accounts if they meet the verification requirements. If the connected account doesn’t meet the requirements or if you want to have direct control, you can manually request the capability in the Dashboard or with the API.

Most payment methods have the same verification requirements as the `card_payments` capability, with some restrictions and exceptions. The [payment method capabilities table](https://docs.stripe.com/connect/account-capabilities.md#payment-methods) lists the payment methods that require additional verification.

#### Dashboard

[Find a connected account](https://docs.stripe.com/connect/dashboard/managing-individual-accounts.md#finding-accounts) in the Dashboard to edit its capabilities and view outstanding verification requirements.

#### Accounts v2 API

For an existing connected account, you can retrieve the `Account` and inspect their [merchant capabilities](https://docs.stripe.com/api/v2/core/accounts/retrieve.md#v2_retrieve_accounts-response-configuration-merchant-capabilities) to determine whether you need to request additional capabilities.

```curl
curl -G https://api.stripe.com/v2/core/accounts/{{CONNECTEDACCOUNT_ID}} \
  -H "Authorization: Bearer <<YOUR_SECRET_KEY>>" \
  -H "Stripe-Version: 2025-11-17.preview" \
  -d "include[0]=configuration.merchant"
```

Request additional capabilities by [updating](https://docs.stripe.com/api/v2/core/accounts/update.md#v2_update_accounts-configuration-merchant-capabilities) each connected account’s capabilities.

```curl
curl -X POST https://api.stripe.com/v2/accounts/{{CONNECTEDACCOUNT_ID}} \
  -H "Authorization: Bearer <<YOUR_SECRET_KEY>>" \
  -H "Stripe-Version: 2025-11-17.preview" \
  --json '{
    "configuration": {
        "merchant": {
            "capabilities": {
                "ach_debit_payments": {
                    "requested": true
                }
            }
        }
    },
    "include": [
        "configuration.merchant",
        "requirements"
    ]
  }'
```

Requested capabilities might be delayed before becoming active. If the capability has any activation requirements, the response includes them in the `requirements` arrays.

#### Accounts v1 API

For an existing connected account, you can [list](https://docs.stripe.com/api/capabilities/list.md) their existing capabilities to determine whether you need to request additional capabilities.

```curl
curl https://api.stripe.com/v1/accounts/{{CONNECTEDACCOUNT_ID}}/capabilities \
  -u "<<YOUR_SECRET_KEY>>:"
```

Request additional capabilities by [updating](https://docs.stripe.com/api/capabilities/update.md) each connected account’s capabilities.

```curl
curl https://api.stripe.com/v1/accounts/{{CONNECTEDACCOUNT_ID}}/capabilities/us_bank_account_ach_payments \
  -u "<<YOUR_SECRET_KEY>>:" \
  -d requested=true
```

There can be a delay before the requested capability becomes active. If the capability has any activation requirements, the response includes them in the `requirements` arrays.

## Specify the settlement merchant 

The settlement merchant is dependent on the [capabilities](https://docs.stripe.com/connect/account-capabilities.md) set on an account and how a charge is created. The settlement merchant determines whose information is used to make the charge. This includes the statement descriptor (either the platform’s or the connected account’s) that’s displayed on the customer’s credit card or bank statement for that charge.

Specifying the settlement merchant allows you to be more explicit about who to create charges for. For example, some platforms prefer to be the settlement merchant because the end customer interacts directly with their platform (such as on-demand platforms). However, some platforms have connected accounts that interact directly with end customers instead (such as a storefront on an e-commerce platform). In these scenarios, it might make more sense for the connected account to be the settlement merchant.

You can set the `on_behalf_of` parameter to the ID of a connected account to make that account the settlement merchant for the payment. When using `on_behalf_of`:

- Charges *settle* (When funds are available in your Stripe balance) in the connected account’s country and *settlement currency* (The settlement currency is the currency your bank account uses).
- The fee structure for the connected account’s country is used.
- The connected account’s statement descriptor is displayed on the customer’s credit card statement.
- If the connected account is in a different country than the platform, the connected account’s address and phone number are displayed on the customer’s credit card statement.
- The number of days that a [pending balance](https://docs.stripe.com/connect/account-balances.md) is held before being paid out depends on the [delay_days](https://docs.stripe.com/api/accounts/create.md#create_account-settings-payouts-schedule-delay_days) setting on the connected account.

> #### Accounts v2 API
> 
> You can’t use the Accounts v2 API to manage payout settings. Use the Accounts v1 API.

If `on_behalf_of` is omitted, the platform is the business of record for the payment.

> The `on_behalf_of` parameter is supported only for connected accounts with a payments capability such as [card_payments](https://docs.stripe.com/connect/account-capabilities.md#card-payments). Accounts under the [recipient service agreement](https://docs.stripe.com/connect/service-agreement-types.md#recipient) can’t request `card_payments` or other payments capabilities.

```curl
curl https://api.stripe.com/v1/payment_intents \
  -u "<<YOUR_SECRET_KEY>>:" \
  -d amount=10000 \
  -d currency=eur \
  -d "automatic_payment_methods[enabled]=true" \
  -d "on_behalf_of={{CONNECTEDACCOUNT_ID}}" \
  -d transfer_group=ORDER100
```

## Collect fees 

When using separate charges and transfers, the platform can collect fees on a charge by reducing the amount it transfers to the destination accounts. For example, consider a restaurant delivery service transaction that involves payments to the restaurant and to the driver:

1. The customer pays a 100 USD charge.
1. Stripe collects a 3.20 USD fee and adds the remaining 96.80 USD to the platform account’s pending balance.
1. The platform transfers 70 USD to the restaurant’s connected account and 20 USD to the driver’s connected account.
1. A platform fee of 6.80 USD remains in the platform account.

> #### Application fees with funds segregation
> 
> Funds segregation is a private preview feature that allows you to debit application fees directly from allocated funds during transfer, providing clean accounting separation. Contact your Stripe account manager to request access.
![How a charge is divided into fees for the platform account and transfers for the connected accounts](https://b.stripecdn.com/docs-statics-srv/assets/charges_transfers.c54b814c7e6f88993bf259c8a53f03e8.png)

To learn about processing payments in multiple currencies with Connect, see [working with multiple currencies](https://docs.stripe.com/connect/currencies.md).

## Transfer availability

The default behavior is to transfer funds from the platform account’s available balance. Attempting a transfer that exceeds the available balance fails with an error. To avoid this problem, when creating a transfer, tie it to an existing [charge](https://docs.stripe.com/api/charges.md) by specifying the charge ID as the `source_transaction` parameter. With a `source_transaction`, the transfer request returns success regardless of your available balance if the related charge hasn’t settled yet. However, the funds don’t become available in the destination account until the funds from the associated charge are available to transfer from the platform account.

> #### Transfers with funds segregation
> 
> The private preview funds segregation feature requires the `source_transaction` parameter for transfers from allocated funds so they’re linked to their original payment.

> If a transfer fails due to insufficient funds in your platform balance, adding funds doesn’t automatically retry the failed action. After adding funds, you must repeat any failed transfers or payouts.

If the source charge has a `transfer_group` value, Stripe assigns the same value to the transfer’s `transfer_group`. If it doesn’t, then Stripe generates a string in the format `group_` plus the associated PaymentIntent ID, for example: `group_pi_2NHDDD589O8KAxCG0179Du2s`. It assigns that string as the `transfer_group` for both the charge and the transfer.

> You must specify the `source_transaction` when you create a transfer. You can’t update that attribute later.

```curl
curl https://api.stripe.com/v1/transfers \
  -u "<<YOUR_SECRET_KEY>>:" \
  -d amount=7000 \
  -d currency=usd \
  -d "source_transaction={{CHARGE_ID}}" \
  -d "destination={{CONNECTEDACCOUNT_ID}}"
```

You can get the charge ID from the *PaymentIntent* (API object that represents your intent to collect payment from a customer, tracking charge attempts and payment state changes throughout the process):

- Get the PaymentIntent’s [latest_charge attribute](https://docs.stripe.com/api/payment_intents/object.md#payment_intent_object-latest_charge). This attribute is the ID of the most recent charge associated with the PaymentIntent.
- [Request a list of charges](https://docs.stripe.com/api/charges/list.md), specifying the `payment_intent` in the request. This method returns full data for all charges associated with the PaymentIntent.

When using this parameter:

- The amount of the transfer must not exceed the amount of the source charge
- You can create multiple transfers with the same `source_transaction`, as long as the sum of the transfers doesn’t exceed the source charge
- The transfer takes on the pending status of the associated charge: if the funds from the charge become available in N days, the payment that the destination Stripe account receives from the transfer also becomes available in N days
- Stripe automatically creates a `transfer_group` for you
- The currency of the balance transaction associated with the charge must match the currency of the transfer

*Asynchronous payment methods* (Asynchronous payment methods can take up to several days to confirm whether the payment has been successful. During this time, the payment can't be guaranteed), like *ACH* (Automated Clearing House (ACH) is a US financial network used for electronic payments and money transfers that doesn’t rely on paper checks, credit card networks, wire transfers, or cash), can fail after a subsequent transfer request is made. For these payments, avoid using `source_transaction`. Instead, wait until a [charge.succeeded](https://docs.stripe.com/api/events/types.md#event_types-charge.succeeded) event is triggered before transferring the funds. If you have to use `source_transaction` with these payments, you must implement functionality to manage payment failures.

When a payment used as a `source_transaction` fails, funds from your platform’s account balance are transferred to the connected account to cover the payment. To recover these funds, [reverse](https://docs.stripe.com/connect/separate-charges-and-transfers.md#reverse-transfers) the transfer associated with the failed `source_transaction`.

## Issue refunds 

You can refund charges created on your platform using its *secret key* (Stripe APIs use your secret API key to authenticate requests from your server; you can use this key to make any API call on behalf of your account, such as creating a charge or performing a refund). However, refunding a charge has no impact on any associated transfers. It’s up to your platform to reconcile any amount owed back to it by reducing subsequent transfer amounts or by [reversing transfers](https://docs.stripe.com/connect/separate-charges-and-transfers.md#reversing-transfers).

> #### Refunds with funds segregation
> 
> The private preview funds segregation feature uses allocated funds for refunds before debiting your platform’s payments balance, providing clean accounting separation.

```curl
curl https://api.stripe.com/v1/refunds \
  -u "<<YOUR_SECRET_KEY>>:" \
  -d "charge={{CHARGE_ID}}"
```

## Reverse transfers 

Connect supports the ability to [reverse transfers](https://docs.stripe.com/api.md#create_transfer_reversal) made to connected accounts, either entirely or partially (by setting an `amount` value). Use transfer reversals only for refunds or disputes related to the charge, or to correct errors in the transfer.

```curl
curl https://api.stripe.com/v1/transfers/{{TRANSFER_ID}}/reversals \
  -u "<<YOUR_SECRET_KEY>>:" \
  -d amount=7000
```

Transfer reversals add the specified (or entire) amount back to the platform’s available balance, reducing the connected account’s available balance accordingly. It’s only possible to reverse a transfer if the connected account’s available balance is greater than the reversal amount or has [connected reserves](https://docs.stripe.com/connect/account-balances.md#understanding-connected-reserve-balances) enabled.

If the transfer reversal requires a currency conversion, and the reversal amount would result in a zero balance after the conversion, it returns an error.

Disabling refunds for a connected account won’t block the ability to process transfer reversals.

## See also

- [Working with multiple currencies](https://docs.stripe.com/connect/currencies.md)
- [Statement descriptors with Connect](https://docs.stripe.com/connect/statement-descriptors.md)
- [Understanding Connect account balances](https://docs.stripe.com/connect/account-balances.md)
- [Disputes on Connect platforms](https://docs.stripe.com/connect/disputes.md)