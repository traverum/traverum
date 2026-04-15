# Privacy Policy

**Traverum Oy** (operating as **Veyond**)
**Last updated: [DATE]**
**Effective date: [DATE]**

---

## 1. Who We Are

This Privacy Policy explains how **Traverum Oy** ("Traverum", "we", "us", or "our"), a company incorporated under the laws of Finland, collects, uses, stores, and shares your personal data when you use our platform.

Traverum operates the **Veyond** brand and the booking platform at **book.veyond.eu**. Traverum acts as a booking intermediary connecting customers with third-party experience providers. Traverum does not provide, operate, or deliver experiences.

**Data controller:**
Traverum Oy
Email: privacy@traverum.com
Website: https://traverum.com

For the purposes of the General Data Protection Regulation (EU) 2016/679 ("GDPR"), Traverum Oy is the data controller for the personal data processed through the Platform as described in this policy.

---

## 2. Scope of This Policy

This policy applies to all personal data processed when you:

- browse experiences on book.veyond.eu or through a booking widget embedded on a hotel or accommodation partner's website ("Distribution Partner");
- create a booking request or reservation;
- complete a booking and payment;
- receive transactional emails related to a booking;
- use the supplier dashboard at dashboard.traverum.com; or
- otherwise interact with the Platform.

Where you access the Platform through a booking widget embedded on a Distribution Partner's website, the Distribution Partner's own privacy policy governs the data processing on their website. This policy applies only to the data processed within the Traverum/Veyond booking flow.

---

## 3. What Data We Collect

### 3.1. Guests (customers booking experiences)

When you browse, request, or book an experience, we collect:

| Data | When collected | Purpose |
|------|---------------|---------|
| First name and last name | At checkout | To create your reservation and identify you to the Experience Provider |
| Email address | At checkout | To send booking confirmations, status updates, payment links, and refund notifications |
| Phone number | At checkout | To allow the Experience Provider to contact you regarding logistics for your booking |
| Preferred language | At checkout (optional) | To match you with experiences in your preferred language where available |
| Booking details | At checkout | Experience selected, date, time, number of participants, total price — necessary to process and fulfil the booking |
| IP address | Automatically when submitting a booking request | For rate limiting and abuse prevention only; not stored permanently |
| Payment information | On the Stripe-hosted payment page | Processed entirely by Stripe; Traverum does not receive, store, or have access to your full payment card details (see Section 5.3) |

**We do not collect:** Passport or identity document data, date of birth, social media profiles, location data from your device, or any special categories of personal data (health, biometric, political opinions, etc.).

### 3.2. Experience Providers (suppliers using the dashboard)

When you register as an Experience Provider on the Platform, we collect:

| Data | Purpose |
|------|---------|
| Business name | Displayed to customers on the Platform |
| Contact email address | Account administration, booking notifications, payout notifications |
| Phone number (optional) | Account administration |
| City and country | Location matching with Distribution Partners |
| Stripe Connect account information | Payment processing and payout disbursement |
| Authentication credentials (email and password) | Account access via Supabase Auth |

### 3.3. Distribution Partners (hotels)

When a hotel or accommodation provider registers as a Distribution Partner, we collect:

| Data | Purpose |
|------|---------|
| Business name and display name | Branding the booking widget |
| Business address | Location-based experience matching |
| Contact email and phone | Account administration, booking notifications |
| Logo and branding preferences | Widget customisation |

### 3.4. Data we do not collect

- We do not use cookies for advertising, retargeting, or behavioural profiling.
- We do not build customer profiles for marketing purposes.
- We do not sell personal data to third parties.
- We do not engage in automated decision-making or profiling that produces legal effects.

---

## 4. Why We Process Your Data and Our Legal Basis

Under the GDPR, we must have a lawful basis for each processing activity. The table below sets out our purposes and the corresponding legal basis.

### 4.1. Guests

| Purpose | Legal basis (GDPR Article 6) |
|---------|------------------------------|
| Creating and processing your reservation or booking | **Contract performance** (Art. 6(1)(b)) — necessary to fulfil the booking you have requested |
| Sending you booking confirmations, status updates, payment links, and refund notifications | **Contract performance** (Art. 6(1)(b)) — transactional communications essential to the service |
| Sharing your name, email, and phone number with the Experience Provider after payment is confirmed | **Contract performance** (Art. 6(1)(b)) — the Provider needs this data to deliver the experience you booked |
| Processing your payment via Stripe | **Contract performance** (Art. 6(1)(b)) — payment is integral to the booking |
| Rate limiting and abuse prevention (using your IP address) | **Legitimate interest** (Art. 6(1)(f)) — protecting the Platform from abuse; balanced against the minimal privacy impact (IP data is hashed, temporary, and not linked to your identity) |
| Retaining booking records for accounting and tax compliance | **Legal obligation** (Art. 6(1)(c)) — Finnish accounting law (kirjanpitolaki) requires retention of financial records |
| Resolving disputes or responding to complaints | **Legitimate interest** (Art. 6(1)(f)) — necessary for the administration of claims |

### 4.2. Experience Providers and Distribution Partners

| Purpose | Legal basis |
|---------|------------|
| Account creation and management | **Contract performance** (Art. 6(1)(b)) |
| Processing bookings and sending notifications | **Contract performance** (Art. 6(1)(b)) |
| Payout disbursement via Stripe Connect | **Contract performance** (Art. 6(1)(b)) |
| Retaining transaction records for accounting | **Legal obligation** (Art. 6(1)(c)) |

---

## 5. Who We Share Your Data With

We share personal data only when necessary for the purposes described in this policy. We do not sell personal data.

### 5.1. Experience Providers

When you complete a booking and payment is confirmed, we share your name, email address, and phone number with the Experience Provider who will deliver your experience. This is necessary for the Provider to contact you with logistics, meeting point details, and safety information.

**Important:** Your contact details are **not shared** with the Experience Provider until payment has been confirmed. Before payment, the Provider can see that a booking request has been received but cannot see your personal contact information.

Once the Experience Provider receives your data, they become an **independent data controller** for that data. The Provider processes your data under their own privacy policy for the purpose of delivering the experience. Traverum is not responsible for the Experience Provider's data handling practices after the data has been shared.

### 5.2. Distribution Partners (hotels)

When you book through a hotel's embedded widget, the Distribution Partner receives a booking notification containing the experience name, date, and booking value for commission tracking purposes. **Your personal contact details (name, email, phone) are not shared with the Distribution Partner.**

### 5.3. Payment processor — Stripe

We use **Stripe, Inc.** to process payments. When you make a payment, your payment card details are entered directly on a Stripe-hosted page. Traverum does not receive, access, or store your full payment card details at any point.

Stripe processes your payment data as an independent data controller under its own privacy policy: [https://stripe.com/privacy](https://stripe.com/privacy).

Stripe is certified under the PCI Data Security Standard (PCI DSS) at Level 1, the highest level of certification.

### 5.4. Email service — Resend

We use **Resend** to send transactional emails (booking confirmations, status updates, payment links, refund notifications). Resend processes your email address and the content of the email as a data processor on our behalf under a data processing agreement.

Emails are sent from: **Veyond <bookings@veyond.eu>**

### 5.5. Database hosting — Supabase

Our database is hosted on **Supabase** (Supabase, Inc.), which stores booking records, user accounts, and experience data. Supabase acts as a data processor on our behalf under a data processing agreement. Data is stored in the European Union.

### 5.6. Application hosting — Vercel

The Platform is hosted on **Vercel, Inc.** Vercel processes server logs (including IP addresses) as part of hosting the application. Vercel acts as a data processor under its data processing addendum.

### 5.7. Rate limiting — Vercel KV (Upstash)

We use Vercel KV (powered by Upstash) for temporary rate limiting of booking requests. IP addresses are hashed and stored temporarily (seconds to minutes) to prevent abuse. This data expires automatically and is not linked to any user identity.

### 5.8. Summary of recipients

| Recipient | Role | Data shared | Capacity |
|-----------|------|-------------|----------|
| Experience Provider | Delivers the experience | Guest name, email, phone (post-payment only) | Independent data controller |
| Stripe | Payment processing | Payment card data, email (for receipts) | Independent data controller |
| Resend | Email delivery | Email address, email content | Data processor |
| Supabase | Database hosting | All platform data | Data processor |
| Vercel | Application hosting | Server logs, IP addresses | Data processor |
| Upstash (via Vercel KV) | Rate limiting | Hashed IP addresses (temporary) | Data processor |

We do not share personal data with any other third parties, including advertising networks, data brokers, or social media platforms.

---

## 6. International Data Transfers

Supabase hosts our database in the **European Union**. However, some of our sub-processors are based in the United States:

| Sub-processor | Location | Transfer mechanism |
|---------------|----------|-------------------|
| **Stripe** | United States | EU-US Data Privacy Framework (adequacy decision) |
| **Resend** | United States | Standard Contractual Clauses (SCCs) |
| **Vercel** | United States (with EU edge network) | EU-US Data Privacy Framework / SCCs |
| **Upstash** | Configurable (EU region available) | SCCs where applicable |

Where personal data is transferred outside the European Economic Area (EEA), we ensure that appropriate safeguards are in place in accordance with GDPR Chapter V, including adequacy decisions, Standard Contractual Clauses approved by the European Commission, or other lawful transfer mechanisms.

---

## 7. How Long We Keep Your Data

We retain personal data only for as long as necessary to fulfil the purposes for which it was collected, or as required by law.

| Data | Retention period | Rationale |
|------|-----------------|-----------|
| Booking and reservation records (including guest name, email, phone) | **3 years** after the experience date | Dispute resolution, customer support, and legitimate business records |
| Financial and payment records (booking amounts, commission splits, payout records) | **7 years** after the transaction | Finnish accounting law (kirjanpitolaki, Chapter 2, Section 10) requires retention of accounting records for at least 6 years after the end of the financial year |
| Expired or declined reservation requests | **6 months** after expiry/decline | No longer needed for service delivery |
| Rate limiting data (hashed IP addresses) | **Seconds to minutes** (automatic expiry) | Ephemeral; automatically purged by the rate limiting system |
| Supplier and hotel partner accounts | Duration of the business relationship + **3 years** | Contract administration and post-termination obligations |
| Supabase Auth session data | Managed by Supabase per its retention policy | Session tokens expire automatically |

After the applicable retention period expires, personal data is deleted or anonymised. Financial records required by law may be retained in anonymised or aggregated form beyond these periods where necessary.

---

## 8. Cookies and Similar Technologies

### 8.1. Cookies we use

The Platform uses only **strictly necessary cookies** — no analytics, advertising, or tracking cookies are used.

| Cookie | Purpose | Type | Duration |
|--------|---------|------|----------|
| `sb-*` (Supabase Auth) | Authentication session for dashboard users (suppliers and hotels). Not set for guest users browsing or booking experiences. | Strictly necessary | Session / as configured by Supabase |

### 8.2. No tracking technologies

We do not use:
- Analytics cookies (Google Analytics, Mixpanel, PostHog, Hotjar, or similar)
- Advertising or retargeting cookies
- Social media tracking pixels
- Fingerprinting or cross-site tracking technologies
- Local storage or session storage for tracking purposes

Because we use only strictly necessary cookies, no cookie consent banner is required under the ePrivacy Directive (2002/58/EC, as amended). If we introduce non-essential cookies in the future, we will update this policy and implement a consent mechanism before doing so.

### 8.3. Distribution Partner websites

When you access the Platform through a booking widget embedded on a Distribution Partner's website, the hotel's website may use its own cookies and tracking technologies. These are governed by the Distribution Partner's own cookie policy, not this one. The Traverum booking widget operates within a Shadow DOM and does not set any cookies on the hotel's website.

---

## 9. Your Rights Under GDPR

If you are located in the European Economic Area (EEA), you have the following rights regarding your personal data:

### 9.1. Right of access (Article 15)

You have the right to request a copy of the personal data we hold about you, along with information about how it is processed. We will respond within one month of receiving your request.

### 9.2. Right to rectification (Article 16)

You have the right to request correction of inaccurate personal data. If your name, email, or phone number was entered incorrectly during booking, contact us and we will update the records.

### 9.3. Right to erasure (Article 17)

You have the right to request deletion of your personal data, subject to the following limitations:
- We may retain data where we have a legal obligation to do so (e.g., financial records required by Finnish accounting law).
- We may retain data necessary for the establishment, exercise, or defence of legal claims.
- Data already shared with an Experience Provider must be requested for deletion from the Provider directly, as they are an independent data controller.

### 9.4. Right to restriction of processing (Article 18)

You have the right to request that we restrict the processing of your personal data in certain circumstances, for example while we verify the accuracy of your data following a rectification request.

### 9.5. Right to data portability (Article 20)

You have the right to receive the personal data you provided to us in a structured, commonly used, and machine-readable format (such as JSON or CSV), and to request that we transmit that data to another controller where technically feasible.

### 9.6. Right to object (Article 21)

You have the right to object to processing based on legitimate interest (Article 6(1)(f)). If you object, we will stop processing your data for that purpose unless we can demonstrate compelling legitimate grounds that override your interests.

### 9.7. Right to withdraw consent

Where processing is based on your consent, you have the right to withdraw consent at any time. Note: our current processing activities are based on contract performance, legal obligation, and legitimate interest — not consent. If we introduce consent-based processing in the future, we will provide a clear mechanism to withdraw.

### 9.8. How to exercise your rights

To exercise any of these rights, contact us at:

**Email:** privacy@traverum.com

We will verify your identity before processing your request. We will respond within **one month** of receiving your request, as required by GDPR Article 12(3). In complex cases, this period may be extended by two additional months, and we will inform you of any such extension within the first month.

There is no fee for exercising your rights, unless requests are manifestly unfounded or excessive.

### 9.9. Right to lodge a complaint

If you believe we have not handled your data in accordance with this policy or the GDPR, you have the right to lodge a complaint with a supervisory authority. The relevant authority for Traverum is:

**Office of the Data Protection Ombudsman** (Tietosuojavaltuutetun toimisto)
Lintulahdenkuja 4, 00530 Helsinki, Finland
Website: https://tietosuoja.fi/en
Email: tietosuoja@om.fi

You may also lodge a complaint with the supervisory authority of your country of habitual residence or place of work.

---

## 10. Children's Data

The Platform is not intended for use by individuals under the age of **18**. We do not knowingly collect personal data from children under 18. Our Terms and Conditions require that users be at least 18 years of age to make a booking.

If we become aware that we have collected personal data from a child under 18, we will take steps to delete that data promptly. If you believe a child has provided us with personal data, please contact us at privacy@traverum.com.

---

## 11. Security

We implement appropriate technical and organisational measures to protect your personal data against unauthorised access, alteration, disclosure, or destruction. These measures include:

- **Encryption in transit:** All data transmitted between your browser and the Platform is encrypted using TLS (HTTPS).
- **Encryption at rest:** Database data is encrypted at rest by our hosting provider (Supabase).
- **Payment security:** Payment card data is processed exclusively by Stripe on PCI DSS Level 1 certified infrastructure. Traverum never receives or stores payment card details.
- **Access controls:** Database access is restricted by row-level security (RLS) policies. Dashboard access requires authentication.
- **Input validation:** Guest-submitted data is sanitised to prevent injection attacks.
- **Rate limiting:** Public-facing APIs are rate-limited to prevent abuse.
- **Minimal data collection:** We collect only the data necessary for the booking process.

No method of transmission over the internet or electronic storage is 100% secure. While we strive to protect your personal data, we cannot guarantee its absolute security.

---

## 12. Automated Decision-Making

We do not use automated decision-making or profiling that produces legal effects or similarly significantly affects you, as defined in GDPR Article 22.

Rate limiting (which may block requests from an IP address that exceeds the request threshold) is an automated security measure. It does not use personal data beyond the IP address, operates on a short time window, and does not constitute profiling or produce legal effects.

---

## 13. Changes to This Policy

We may update this Privacy Policy from time to time to reflect changes in our practices, technology, legal requirements, or other factors.

When we make material changes, we will:
- Update the "Last updated" date at the top of this policy.
- Where practicable, notify affected users via email or a prominent notice on the Platform.

We encourage you to review this policy periodically. Your continued use of the Platform after changes are posted constitutes acceptance of the updated policy.

---

## 14. Contact Us

For any questions, concerns, or requests regarding this Privacy Policy or our data processing practices:

**Traverum Oy**
Email: privacy@traverum.com
Website: https://traverum.com

For questions about how an Experience Provider handles your data after a booking, please contact the Experience Provider directly using the contact details provided in your booking confirmation.

---

*End of document.*
