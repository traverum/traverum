# Forbidden Patterns

Things we tried, considered, or that seem tempting but are wrong for this project.
Check this list before proposing alternatives to existing patterns.

---

## Money & pricing

- **Never store money as floats.** Always integer cents with `_cents` suffix (`price_cents`, `total_cents`).
- **Never use `Math.floor()` for commission splits.** Use `Math.round()`. Rounding remainder goes to platform amount.
- **Never format prices American-style.** Symbol after number, comma decimal: `45 €` or `45,00 €` — never `€45` or `$45`. Use `Intl.NumberFormat('fi-FI')`.

## Dates & times

- **Never derive a calendar date with `toISOString().split('T')[0]`.** It returns UTC and shifts the day in non-UTC timezones.
- **Never use `new Date("yyyy-mm-dd")` for calendar dates.** Parsed as UTC midnight — wrong day west of UTC. Use `parseLocalDate()`.
- **Never use American date formats.** No `MM/dd/yyyy`, no `2:30 PM`. European: `dd.MM.yyyy`, 24-hour `HH:MM`.
- **Never start calendar weeks on Sunday.** Always Monday.
- **Never use English day/month names in the UI** (except calendar headers). Use numeric dates like `21.02.2026`.

## UI & design

- **Never use emojis.** Lucide icons only (`lucide-react`).
- **Never use shadows for card distinction.** Use `border border-border` on a unified warm white surface.
- **Never use gradients.**
- **Never use different background colors to separate areas.** Unified surface — borders create distinction.
- **Never add "are you sure?" confirmations for non-destructive actions.**
- **Never use always-visible helper text.** Use hover tooltips or placeholder text instead.
- **Never capitalize words beyond the first word of a sentence.**

## Architecture

- **Dashboard and Admin must never mutate Supabase directly.** They call widget API routes (Next.js) for all mutations. Reads via Supabase client are fine.
- **Never mix Vercel projects.** Three separate projects, one per app. Wrong Root Directory = broken production.
- **Never deploy Admin with `pnpm --filter`.** Use `npx vite build` directly to avoid OOM on Vercel Hobby.
- **Never use actual place names as test data or placeholders.** Use generic ones if absolutely necessary.
- **Never transition booking/reservation statuses backwards.** `pending` → `approved` → `confirmed` → `completed`. One direction only.

## Stripe

- **Never use Stripe Checkout Sessions.** Always Payment Links — they provide stable URLs for email-based payment (request flow needs a link that works hours later).
- **Never skip `source_transaction` on transfers in test mode.** Required for test-mode transfer association.

## Email

- **Never use CSS classes in email templates.** Inline styles only — email clients strip `<style>` blocks.
- **Never use flexbox in email layout.** Stacked layout (label above value). Flexbox breaks in email clients.
- **Never forget `escapeHtml()` for user-provided content in emails.** Guest names, messages — always sanitize via `@/lib/sanitize`.
- **Never forget `style="color: white"` on email button text.** Gmail/Outlook override `<a>` colors to blue.

## Input & security

- **Always sanitize guest input.** Use `sanitizeGuestText()`, `sanitizeGuestEmail()` from `@/lib/sanitize`.
- **Always use `escapeHtml()` when inserting user content into email HTML.**

## Supabase & types

- **Never assume generated types cover all tables.** `users`, `user_partners` may be missing — add explicit type assertions or queries return `never` and break `next build` on Vercel.
- **Never confuse auth UUID with app user ID.** Supabase Auth `user.id` is NOT `users.id`. Always resolve via `auth_id` first, then use `users.id` for `user_partners`.

## State management

- **Never add Zustand, Redux, or other state libraries.** React Context + React Query is sufficient for current scale.
- **Never add dayjs or moment.** date-fns only.
