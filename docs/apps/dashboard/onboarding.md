Updated by Elias on 07-02-2026

# Onboarding Flow

## Signup

- Email + password only
- No business questions
- Verify email → lands on dashboard

## First Business Setup

**What user sees:**
- Greeting ("Good morning")
- "What would you like to manage?"
- Two cards: **Experiences** / **Hotel**
- Note: "You can always add more later"

**What happens:**
- Click card → dialog opens
- Enter name (one field)
- Supplier: creates business
- Hotel: creates business + auto-generates booking URL
- Redirects to appropriate dashboard

**Time to value:** ~10 seconds

## After Setup

**Supplier:**
- Dashboard shows: "Create your first experience" + button
- Stripe connection shown separately (non-blocking)

**Hotel:**
- Dashboard shows: "Select experiences to showcase" + button

## Key Principles

- **One click, one field** — minimal friction
- **No assumptions** — user chooses their path
- **Progressive** — add capabilities later, not upfront
- **Contextual** — empty states guide next steps
