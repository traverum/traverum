# Email Notifications

## Purpose

Emails are the primary communication channel between Traverum and its users. For suppliers, email is more important than the dashboard — they should be able to accept bookings, confirm experiences, and understand their business without ever logging in.

**For the guest:** Clear status updates at every step. "Your request was received." "Your booking is approved — pay here." "Payment confirmed — here are your details." Never left wondering what's happening.

**For the supplier:** Actionable emails with one-click buttons. Accept or decline a request directly from email. Confirm an experience happened. No dashboard login required for core operations.

**Tone:** Warm, direct, no corporate jargon, no emojis. Like a helpful concierge, not a corporate system.

**What should never happen:**
- A supplier misses a booking because the email wasn't clear
- A guest doesn't know what to do next
- An email looks broken in any major email client
- User-provided content (names, messages) renders unstyled or causes XSS

## Key decisions

### Brand in every email

All emails follow the Traverum brand: warm ivory background, olive buttons, DM Sans typography. The design is "effortlessly warm, quietly precise" — matching the product vision.

### Inline CSS only

Email clients strip `<style>` blocks inconsistently. All styling is inline. Button text always has `style="color: white;"` because Gmail/Outlook override `<a>` colors to blue.

### Stacked info layout

Labels stack above values (not side-by-side). Previous flexbox layout broke in most email clients. The stacked approach works everywhere and handles long values (experience titles, addresses).

### Action links are signed

All email action links use HMAC tokens with expiry. One-click, idempotent. Clicking "Accept" twice shows "Already accepted" instead of erroring.

### Email formatting is separate from UI formatting

`formatEmailDate()` uses long format ("Monday, 20 January 2025"). `formatEmailPrice()` includes decimals ("45,00 €"). These are different from the UI format helpers.

## Reference

- Email design spec: `docs/design/email-design.md`
- Brand identity: `docs/design/brand-essence.md`
- Cursor rule: `.cursor/rules/email-templates.mdc`
- Code: `apps/widget/src/lib/email/templates.ts`, `apps/widget/src/lib/email/index.ts`
