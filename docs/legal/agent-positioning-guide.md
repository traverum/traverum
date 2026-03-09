# Traverum — Agent Positioning & Marketplace Structuring Guide

**Purpose:** A comprehensive guide for how Traverum must structure its product, UX, legal wording, and payment flows to be legally positioned as an **agent / intermediary** — not the principal provider of experiences — while protecting the marketplace from disintermediation.

---

## 1. Legal Positioning: Principal vs. Agent

### 1.1. Three models in travel marketplaces

There are three fundamental ways a marketplace can sit between a customer and a service provider. The legal, tax, and liability consequences of each are dramatically different.

#### Principal model

The marketplace **buys** the experience from the supplier (or contracts for it), then **resells** it to the customer under its own name.

- The customer's contract is with the marketplace.
- The marketplace bears full liability for delivery, quality, safety, and refunds.
- The marketplace sets the price to the customer (margin model).
- VAT applies on the full retail price.
- Example: a tour operator that designs and sells its own tours.

**Risk for Traverum:** If a court determines Traverum is a principal, Traverum would be liable for every injury, cancellation, misrepresentation, and delivery failure across all experiences on the platform. This is catastrophic for a small marketplace.

#### Merchant of record model

The marketplace processes the payment **in its own name** (appears on the customer's credit card statement), but doesn't necessarily claim to be the provider. This is a hybrid — common among OTAs.

- Often combined with either the principal or agent model.
- The entity that appears on the card statement may inherit merchant liability (chargebacks, consumer protection claims).
- Tax treatment varies by jurisdiction; can trigger VAT obligations on the full amount.
- Example: Expedia (historically processed payments as merchant of record for hotels).

**Risk for Traverum:** If Traverum's name appears on the customer's bank statement as the "merchant", a court or tax authority could argue Traverum is selling the experience, not merely facilitating it. This undermines the agent defence.

#### Agent / intermediary model (Traverum's target)

The marketplace acts as a **disclosed agent** connecting the customer with the provider. The contract for the service is between the customer and the provider. The marketplace facilitates discovery, booking, and payment collection — but does not provide the service.

- The customer's contract is with the Experience Provider.
- The marketplace's liability is limited to its own platform services (booking accuracy, payment processing).
- The marketplace is not liable for the quality, safety, or delivery of the experience.
- VAT applies only on the marketplace's commission (not the full retail price).
- The provider is the "trader" under EU consumer protection law.
- Example: Airbnb, GetYourGuide, Viator, Booking.com (all position as intermediaries).

**Why this reduces liability:**

| Area | Principal | Agent |
|------|-----------|-------|
| Injury during experience | Marketplace liable | Provider liable |
| Experience doesn't match description | Marketplace liable | Provider liable |
| Provider cancels without notice | Marketplace must make good | Marketplace facilitates refund |
| Tax on full booking value | Yes | No (only on commission) |
| Consumer protection obligations | Full (as seller) | Limited (as intermediary) |
| Chargeback risk | Full | Shared / defensible |

### 1.2. What makes the agent position legally defensible

It is not enough to simply write "we are an intermediary" in the Terms. Courts and regulators look at the **substance** of the arrangement, not just the label. The following factors must all be present:

1. **Disclosed agency:** The customer must know, before committing, that the contract is with the Provider and not the marketplace. The Provider's identity must be visible.

2. **Provider controls the service:** Pricing, availability, cancellation policies, experience content, and delivery are all determined by the Provider. The marketplace does not dictate or override these.

3. **Provider content attribution:** Descriptions, images, and listings are created by the Provider. The marketplace displays them but does not adopt them as its own representations.

4. **Payment on behalf of:** The marketplace collects payment *on behalf of* the Provider, not in its own right. The payment flow documentation must reflect this (see Section 4).

5. **Liability disclaimers are consistent:** The product UX, T&Cs, emails, and customer support all consistently treat the Provider as the responsible party. Inconsistency (e.g., a support email saying "we will fix this" instead of "we will contact the provider") undermines the position.

6. **No co-mingling of roles:** The marketplace does not brand the experience as its own, does not send staff to the experience, does not provide equipment, and does not intervene in the service delivery.

### 1.3. Traverum's current position — assessment

Traverum is **well-structured** for the agent model, with one critical design choice already protecting it: **Stripe Connect**. Because suppliers connect their own Stripe accounts and Traverum uses `source_transaction` transfers, the payment flow inherently separates Traverum from the merchant role. The supplier is the economic recipient; Traverum takes a commission.

**Areas currently strong:**
- Stripe Connect separates payment processing roles
- Suppliers create their own experiences, set prices, manage availability
- Guest contact info is withheld until payment (protects the platform without creating agency risk)
- Cancellation policies are set per-experience by the supplier
- Emails already reference "the provider" generically

**Areas needing improvement:**
- The Provider's legal name does not appear on the experience card, detail page, or checkout page
- The checkout acceptance text says "our terms of service" without linking to actual Terms
- No explicit "operated by [Provider Name]" attribution anywhere in the guest-facing flow
- The confirmation page says "the provider may contact you" but doesn't name them
- No intermediary disclosure on the experience detail page

These gaps are addressed below.

---

## 2. Where the Experience Provider Must Appear in the Product

The core principle: **the customer must always know who is providing the experience**. The Provider's identity is not a legal footnote — it is the mechanism by which the contract is attributed to the correct party. Every major OTA makes the provider/host identity visible.

### Stage-by-stage analysis

#### 2.1. Experience listing / browse page

**Current state:** Experience cards show the title, image, price, location, and category. The Provider name does not appear.

**Requirement:** The Provider name **should** appear on the card. This is not strictly a legal requirement at the browsing stage (no contract is being formed), but it establishes the pattern early, which strengthens the overall positioning. It is also standard practice — GetYourGuide shows "by [Provider]", Viator shows the operator name.

**Recommended wording on the card:**

> _Small text below the experience title:_
> **by {Provider Name}**

**Priority:** Medium. Not legally required at this stage, but strongly recommended for consistency and defensibility.

#### 2.2. Experience detail page

**Current state:** The experience detail page shows descriptions, photos, pricing, cancellation policy, and session selection. The Provider name does not appear.

**Requirement:** The Provider name **must** appear. This is where the customer evaluates the experience and begins forming a decision to book. Under the EU Consumer Rights Directive (Article 6(1)(b)), the identity of the trader must be provided before the consumer is bound. While the binding moment is at checkout/payment, courts look at the entire journey — and not disclosing the Provider on the detail page creates a gap.

**Recommended elements:**

1. A "Provided by" line near the experience title:

> **Experience operated by {Provider Name}**

2. A brief intermediary notice at the bottom of the page (near the cancellation policy section):

> This experience is created and operated by {Provider Name}. Traverum acts as a booking intermediary and is not the provider of this experience.

**Priority:** High. This is the most important missing attribution in the current product.

#### 2.3. Checkout page

**Current state:** The checkout page collects guest details (name, email, phone) and shows a passive acceptance line: "By booking, you agree to our terms of service and privacy policy."

**Requirement:** The Provider name **must** appear, and the acceptance text must explicitly state that the contract is with the Provider. This is the point of no return — the customer is about to commit. The implementation guidance in the T&C document already covers the recommended wording.

**Recommended elements:**

1. Booking summary section should include:

> **Experience:** {Experience Title}
> **Operated by:** {Provider Name}

2. Acceptance text (immediately above the "Book Now" / "Send Request" button):

> By clicking "Book Now", you agree to Traverum's [Terms & Conditions] and [Privacy Policy], and acknowledge that this experience is provided and operated by **{Provider Name}**, not by Traverum.

**Priority:** Critical. This is the legal moment of contract formation.

#### 2.4. Booking confirmation page

**Current state:** Shows "The provider may contact you with more details" but does not name the Provider.

**Requirement:** The Provider name **must** appear. The confirmation page is the customer's receipt and reference document. It reinforces who they contracted with.

**Recommended elements:**

> **Your booking with {Provider Name}**
>
> {Experience Title}
> Date: {date} / Time: {time}
> Participants: {count}
>
> {Provider Name} will contact you with more details about your experience.

**Priority:** High.

#### 2.5. Booking confirmation email

**Current state:** Emails reference the experience title and include supplier contact details (name, email) after payment. The email is sent from `Veyond <bookings@veyond.eu>`.

**Requirement:** The email must clearly state who provides the experience. The current implementation already includes `supplierName` and `supplierEmail` in the guest confirmation email template. This is good.

**Recommended additions:**

- A line near the top of the email:

> Your experience with **{Provider Name}** is confirmed.

- A footer line:

> This booking is facilitated by Traverum. The experience is provided and operated by {Provider Name}.

**Priority:** Medium (partially already implemented).

#### 2.6. Voucher / booking reference

If Traverum ever introduces downloadable vouchers or mobile tickets:

- The Provider name must be the most prominent entity on the voucher.
- Traverum should appear only as "Booked via Traverum" or "Booking facilitated by Traverum".
- The voucher is a contract document — it must name the contracting parties correctly.

**Priority:** Future (not currently implemented).

#### 2.7. Terms and Conditions

**Current state:** The drafted T&C (Section 3) clearly establishes Traverum as an intermediary and identifies the Provider as the contracting party. This is already strong.

**No changes needed.** The T&C is the foundational legal backstop.

#### 2.8. Customer support

**Requirement:** Support responses must be consistent with the agent position. Support agents (or automated responses) must never imply that Traverum is responsible for the experience itself.

**Correct phrasing:**

| Instead of... | Say... |
|---|---|
| "We will fix this issue with your experience" | "We will contact the experience provider on your behalf" |
| "We apologise for the poor quality" | "We're sorry to hear about your experience. We'll relay your feedback to {Provider Name}" |
| "We will reschedule your booking" | "We'll ask {Provider Name} about alternative dates" |
| "Our experience had to be cancelled" | "{Provider Name} has cancelled the experience" |

**Priority:** High (applies to all support interactions).

---

## 3. How to Avoid Disintermediation

Disintermediation is when the customer bypasses the platform to book directly with the provider (or vice versa), depriving Traverum of commission. This is the core business risk of every marketplace.

The challenge: the agent model requires disclosing the Provider's identity, but too much disclosure can make it easy to bypass the platform. Every major OTA has developed techniques to balance these competing demands.

### 3.1. Controlled disclosure of provider contact details

**What the major OTAs do:**

| Platform | Pre-booking | Post-booking |
|----------|------------|--------------|
| **Airbnb** | Host first name + photo. No email, no phone, no social links. Communication via in-app messaging only. | Full host details after booking confirmed. |
| **GetYourGuide** | Activity provider name shown. No direct contact information. "Contact us" goes to GYG support. | Provider contact in booking confirmation email. |
| **Viator** | Operator name shown. No direct contact. All questions routed through Viator. | Operator contact in confirmation email and voucher. |
| **Booking.com** | Property name + address (required for hotels). No personal email/phone pre-booking. | Full contact after booking. |

**Traverum's current approach (already well-designed):**

Traverum already implements this pattern — guest contact info is hidden from the supplier until payment is confirmed. The reverse should also apply:

1. **Before booking:** Show the Provider's *business name* only. No email, phone, website, or social media links.
2. **After payment:** Reveal the Provider's email address in the booking confirmation email (already implemented via `supplierEmail` in the confirmation template).
3. **Never reveal:** The Provider's personal phone number pre-booking. Website URLs that could enable direct rebooking.

**Recommendation — new rule:** Experience listings should never contain direct links to the Provider's own website or booking system. If a Provider includes their website URL in the experience description, it should be stripped or flagged during review. This is standard practice at Viator and GetYourGuide.

### 3.2. Support routing through the platform

All pre-experience communication should flow through the platform.

**Current state:** There is no in-app messaging system. The guest can only contact the Provider post-payment via the email address revealed in the confirmation email.

**Recommendation for now (no messaging system):**

- Pre-booking: All questions should go through Traverum support (support@traverum.com or a contact form). Traverum relays the question to the Provider.
- Post-booking: Provider email is revealed. This is acceptable — payment has been captured, so the disintermediation risk is minimal.

**Future recommendation (when messaging is built):**

- Implement an in-platform messaging system (like Airbnb). All pre-experience communication stays on-platform.
- Log all messages for dispute resolution.
- Provider contact details are revealed only in the booking confirmation, not in messaging.

### 3.3. Voucher and confirmation structure

**Principle:** The booking confirmation / voucher should make it clear that the booking was made through Traverum. If the guest returns to the Provider directly next time, the confirmation serves as a reminder that the platform exists.

**Recommended voucher/confirmation elements:**

1. **Traverum booking reference** (prominent, top of document)
2. **Provider name** (as the experience operator)
3. **Experience details** (date, time, participants, meeting point)
4. **Cancellation link** (routes through Traverum, not direct to Provider)
5. **"Booked via Traverum"** or **"Booked via Veyond"** watermark/footer
6. **No** Provider booking reference or Provider-specific confirmation number that could be used to manage the booking outside Traverum

### 3.4. Communication rules for suppliers

**In the Supplier agreement / onboarding terms (separate from guest T&Cs), include:**

1. **Non-circumvention clause:** The Supplier agrees not to solicit direct bookings from customers who were introduced through the Platform for a period of [12/24] months.
2. **No contact info in listings:** The Supplier must not include direct booking links, phone numbers, email addresses, or social media handles in their experience descriptions.
3. **Booking-only communication:** Post-booking communication with the customer should relate only to the booked experience (logistics, meeting point details, safety briefings). Suppliers must not market their other services or redirect customers to their own booking channels.

These clauses are standard. Airbnb, GetYourGuide, and Viator all enforce similar rules.

### 3.5. Pricing parity (future consideration)

Major OTAs enforce or encourage pricing parity — the price on the platform should be the same as (or better than) the price on the Provider's own website. This removes the economic incentive for customers to book directly.

This is a business decision, not a legal one, but it is the strongest structural protection against disintermediation.

---

## 4. Payment Structure — Legal Description

### 4.1. How payments must be described

The language used to describe payments is critical to the agent positioning. If Traverum describes itself as "charging" or "selling", it creates a principal inference. Every reference to payments must frame Traverum as a facilitator.

**Correct phrasing (use everywhere):**

| Context | Recommended wording |
|---------|-------------------|
| T&Cs | "Traverum facilitates the collection of payment on behalf of the Experience Provider" |
| T&Cs (detailed) | "Traverum acts as the limited payment collection agent of the Experience Provider for the purpose of accepting payment from the Customer" |
| Checkout page | "Your payment will be processed securely on behalf of {Provider Name}" |
| Confirmation email | "Payment received for your booking with {Provider Name}" |
| Refund email | "Your refund has been processed for your booking with {Provider Name}" |
| Support communications | "We've forwarded your payment query to {Provider Name}" |

**Incorrect phrasing (never use):**

| Do NOT say | Why |
|------------|-----|
| "Traverum charges you" | Implies Traverum is the seller |
| "Your payment to Traverum" | Implies Traverum is the recipient |
| "Traverum's fee" (to the customer) | The customer pays the Provider's price; Traverum takes a commission from the Provider |
| "Purchase from Traverum" | Implies a sale by Traverum |
| "Traverum will refund you" | Implies Traverum is the merchant; say "your refund has been processed" |

### 4.2. Stripe Connect and the agent position

Traverum's use of Stripe Connect with destination charges (or `source_transaction` transfers) inherently supports the agent model:

1. The **supplier** has their own connected Stripe account (Express account).
2. Traverum collects the payment via Stripe on behalf of the supplier.
3. After completion, Traverum transfers the supplier's share to their connected account via `createTransfer()`.
4. Traverum retains the platform commission.

This is structurally identical to how Airbnb and GetYourGuide handle payments. The key legal point: Traverum does not "purchase" the experience and "resell" it. Traverum collects the customer's payment and distributes it — exactly what an agent does.

### 4.3. Bank statement descriptor

**Important:** The descriptor that appears on the customer's bank/credit card statement matters. If it says "TRAVERUM" or "VEYOND", the customer (and a court) may assume Traverum is the seller.

**Recommendation:** Configure the Stripe statement descriptor to include the Provider name where possible:

- Ideal: `VEYOND* {PROVIDER_NAME}` (Stripe supports dynamic statement descriptors)
- Acceptable: `VEYOND* BOOKING` (generic but clearly not a product sale)
- Avoid: `TRAVERUM` alone (implies Traverum is the merchant)

This is consistent with how GetYourGuide handles statement descriptors (they show `GYG* [Operator]`).

---

## 5. Liability Shielding — Where Disclaimers Must Appear

Disclaimers are the last line of defence if the structural positioning is challenged. They must appear at every customer touchpoint.

### 5.1. Experience detail page

**Required disclaimer (at the bottom of the listing, near the cancellation policy):**

> This experience is created and operated by {Provider Name}. Traverum is a booking platform and acts as an intermediary between you and the experience provider. Traverum does not operate, supervise, or guarantee any experience.

**Design:** Styled as a subtle informational note (small text, muted colour). It should be visible but not alarming. Consistent with how GetYourGuide shows "Activity operated by [Operator]" on every listing.

### 5.2. Checkout page

**Required disclaimer (above the submit button, as part of the acceptance text):**

> By clicking "Book Now", you agree to Traverum's Terms & Conditions and Privacy Policy, and acknowledge that this experience is provided and operated by **{Provider Name}**, not by Traverum.

This is already specified in the T&C implementation guidance. It serves as the customer's affirmative acknowledgement that they understand who they're contracting with.

### 5.3. Terms and Conditions

**Already covered** in the drafted T&C (Sections 3, 5, 11, 13). Key clauses:

- Section 3.1: "Traverum acts solely as an intermediary and disclosed agent"
- Section 3.3: "The contract for the Experience is formed directly and exclusively between the Customer and the Experience Provider"
- Section 5.1: "All Experience descriptions... are provided by the Experience Provider and are the sole responsibility of the Experience Provider"
- Section 11.2: "The Experience Provider is solely responsible for the safety of participants"
- Section 13.1: "Traverum shall not be liable for... the booking, delivery, non-delivery, quality, safety, or any other aspect of any Experience"

### 5.4. Booking confirmation email

**Required line (in the email body or footer):**

> This experience is provided by {Provider Name}. Traverum facilitates the booking and payment. For questions about the experience itself, contact {Provider Name} at {Provider Email}.

### 5.5. Summary: Disclaimer placement matrix

| Touchpoint | Disclaimer required? | What it must say |
|------------|---------------------|------------------|
| Experience card (browse) | Optional | "by {Provider Name}" |
| Experience detail page | **Yes** | "Experience operated by {Provider Name}. Traverum is a booking intermediary." |
| Checkout page | **Yes** | "This experience is provided by {Provider Name}, not by Traverum." |
| Booking confirmation page | **Yes** | "Your booking with {Provider Name}" |
| Confirmation email | **Yes** | "This experience is provided by {Provider Name}. Traverum facilitates the booking." |
| Refund email | **Yes** | "Your refund for your booking with {Provider Name}" |
| Cancellation page | **Yes** | "Cancellation of your booking with {Provider Name}" |
| Support responses | **Yes** | Consistent agent language (see Section 2.8) |
| T&Cs | **Yes** | Full intermediary disclosure (already drafted) |

---

## 6. Recommended Booking Flow for Traverum

The ideal end-to-end journey, integrating all legal positioning requirements with the existing Traverum product architecture.

---

### Step 1: Experience Browse (Hotel Widget or Veyond Direct)

**Page:** `/{hotelSlug}` or `/experiences`

**What the customer sees:**
- Experience cards: image, title, price, location, category
- Each card includes a small line: **"by {Provider Name}"**
- If accessed via hotel widget: hotel branding (white-label, no Traverum branding)
- If accessed via Veyond: Veyond branding

**Legal notices:** None required at this stage. The Provider attribution on the card is best practice, not a legal obligation.

**Disintermediation controls:** No Provider contact details. No links to Provider websites.

---

### Step 2: Experience Detail

**Page:** `/{hotelSlug}/{experienceSlug}` or `/experiences/{experienceSlug}`

**What the customer sees:**
- Full experience description, photos, inclusions, exclusions
- Meeting point, duration, languages
- Available sessions (date/time picker) or request form
- Price per person / per day
- Cancellation policy

**Legal notices (new — to be added):**

Near the top, below the experience title:

> **Experience operated by {Provider Name}**

At the bottom of the page, near the cancellation policy:

> _This experience is created and operated by {Provider Name}. Traverum acts as a booking intermediary and does not provide or operate this experience. Experience descriptions and images are provided by the operator._

**Disintermediation controls:**
- No Provider email, phone, website, or social links visible
- If the Provider included a website URL in their description text, it is not rendered as a clickable link (or is stripped)

---

### Step 3: Checkout

**Page:** `/{hotelSlug}/checkout` or `/experiences/checkout`

**What the customer sees:**
- Booking summary: experience title, date, time, participants, total price
- **Operated by: {Provider Name}** (in the booking summary)
- Cancellation policy reminder
- Guest details form: first name, last name, email, phone
- "Book Now" or "Send Request" button

**Legal notices (critical — the contractual moment):**

Immediately above the submit button:

> By clicking "Book Now", you agree to Traverum's [Terms & Conditions](/terms) and [Privacy Policy](/privacy), and acknowledge that this experience is provided and operated by **{Provider Name}**, not by Traverum.

For request-based bookings:

> By clicking "Send Request", you agree to Traverum's [Terms & Conditions](/terms) and [Privacy Policy](/privacy), and acknowledge that this experience is provided and operated by **{Provider Name}**, not by Traverum. You won't be charged until the provider accepts and you complete payment.

**Disintermediation controls:**
- No Provider contact details shown
- Payment is processed through Traverum (Stripe)
- No option to "contact provider" pre-booking

---

### Step 4a: Payment (Session-Based / Instant)

**Page:** Stripe-hosted Payment Link page (external)

**What happens:**
- Customer is redirected to the Stripe Payment Link
- Stripe processes the payment
- Webhook `checkout.session.completed` fires
- Booking record created, confirmation emails sent

**Legal notes:**
- Traverum has no control over the Stripe payment page UI
- The statement descriptor on the customer's bank statement should ideally reference the Provider (see Section 4.3)
- The Terms were accepted in Step 3, before the redirect

---

### Step 4b: Request Submitted (Request-Based)

**Page:** `/{hotelSlug}/reservation/{id}` or `/experiences/reservation/{id}`

**What the customer sees:**
- "Your request has been sent to {Provider Name}"
- Status: Pending
- Expected response time: within 48 hours
- What to expect next: "If {Provider Name} accepts, you'll receive a payment link by email"

**Legal notes:**
- No contract is formed yet — the customer has only submitted a request
- The Provider's name is attributed as the party who will decide

---

### Step 5: Confirmation

**Page:** `/{hotelSlug}/confirmation/{id}` or `/experiences/confirmation/{id}`

**What the customer sees:**
- "Your booking with **{Provider Name}** is confirmed"
- Booking reference number
- Experience details: title, date, time, participants, total paid
- Meeting point and logistics
- "{Provider Name} will contact you with more details about your experience"
- Cancellation link: "Need to cancel? Cancel your booking" (links to Traverum-managed cancellation flow)

**Confirmation email:**
- Subject: "Booking confirmed! — {Experience Title}"
- Body includes Provider name, Provider email, experience details
- Footer: "This experience is provided by {Provider Name}. Traverum facilitates the booking and payment."

**Disintermediation controls:**
- Cancellation routes through Traverum (the cancel link goes to `/booking/cancel?id=...&token=...`)
- No direct link to Provider's own booking management

---

### Step 6: Post-Experience

**What happens:**
- 1 day after the experience: Supplier receives "confirm completion" email
- 7 days after: Auto-complete if supplier doesn't respond
- Supplier payout is transferred via Stripe Connect

**Legal notes:**
- Settlement (supplier payout) happens after delivery confirmation — consistent with agent model (the agent holds funds on behalf of the principal until the service is rendered)
- This payout-after-delivery structure is identical to Airbnb's model

---

### Flow diagram (text)

```
BROWSE                 DETAIL                  CHECKOUT                PAYMENT            CONFIRMATION
──────────────────────────────────────────────────────────────────────────────────────────────────────
Experience cards       Full listing            Guest details form      Stripe page        Booking confirmed
"by {Provider}"        "Operated by            "Operated by:           (external)         "Your booking with
                        {Provider}"             {Provider}"                                {Provider}"
                                                                                          
No contact info        No contact info         Terms acceptance        Payment            Provider email
No links               Intermediary            with Provider name      processed          revealed
                        disclaimer              and T&C links                              Cancellation link
                                                                                           (via Traverum)
                                               [Book Now] /
                                               [Send Request]

── Legal attribution increases as the customer moves toward commitment ──────────────────────────────
```

---

## Summary of Product Changes Needed

| Priority | Change | Location | Status |
|----------|--------|----------|--------|
| **Critical** | Add Provider name to acceptance text + link T&Cs | `CheckoutForm.tsx` | Not yet done |
| **Critical** | Create `/terms` and `/privacy` pages | `apps/widget/src/app/` | Not yet done |
| **High** | Add "Experience operated by {Provider Name}" to detail page | `[experienceSlug]/page.tsx` | Not yet done |
| **High** | Add intermediary disclaimer to detail page | `[experienceSlug]/page.tsx` | Not yet done |
| **High** | Name the Provider on confirmation page | `confirmation/[id]/page.tsx` | Partially done |
| **High** | Add intermediary footer line to confirmation emails | Email templates | Not yet done |
| **Medium** | Add "by {Provider Name}" to experience cards | `ExperienceCard.tsx` | Not yet done |
| **Medium** | Configure Stripe statement descriptor to include Provider | `lib/stripe.ts` | Not yet done |
| **Low** | Strip Provider website URLs from experience descriptions | Content moderation | Not yet done |
| **Future** | In-platform messaging system | N/A | Not started |
| **Future** | Downloadable voucher with correct attribution | N/A | Not started |

---

*End of document.*
