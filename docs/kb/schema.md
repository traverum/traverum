---
last_updated: 2026-04-13
compiled_from: 51 migration files + generated types
---

# Database Schema Reference

## Overview

PostgreSQL on Supabase. 19 application tables + PostGIS system tables. Extensions: PostGIS (spatial queries). Multi-tenant via `user_partners` junction table. RLS enabled on all application tables.

### Key patterns

- **Multi-tenancy:** `get_user_partner_ids()` function returns all partner IDs the current user has access to. Superadmins get access to all partners.
- **Money:** All amounts stored as integer cents (`_cents` suffix). Commission splits stored per booking.
- **Auth:** Supabase Auth `user.id` is NOT `users.id`. Resolve via `users.auth_id = auth.uid()`.
- **Spatial:** Partner and experience locations stored as `geography(POINT, 4326)` for PostGIS queries.
- **Status transitions:** One-way only. Never transition bookings or reservations backwards.

---

## Core Tables

### partners

Suppliers and hotels. Both are "partners" with different `partner_type`.

| Column | Type | Notes |
|---|---|---|
| id | uuid | PK, auto-generated |
| name | text | NOT NULL. Legal/business name |
| email | text | NOT NULL. Contact email |
| partner_type | text | NOT NULL. `'supplier'` or `'hotel'` |
| phone | text | Nullable |
| city | text | Nullable. Display city |
| country | text | Nullable. Display country |
| website_url | text | Nullable |
| payment_mode | text | `'stripe'` or `'pay_on_site'`. Default: `'pay_on_site'` |
| stripe_account_id | text | Nullable. Stripe Connect Express account ID |
| stripe_onboarding_complete | boolean | Nullable. Set by webhook |
| display_name | text | Nullable. Guest-facing name (host profile) |
| bio | text | Nullable. Host profile bio |
| avatar_url | text | Nullable. Host profile avatar |
| profile_visible | boolean | Default false. Opt-in host profile |
| partner_slug | text | Nullable. URL slug for host page |
| created_at | timestamptz | Auto |
| updated_at | timestamptz | Auto |

RLS: View/update own partners (via `get_user_partner_ids()`). Anyone can create (signup).

### users

Application users (dashboard/admin login). Linked to Supabase Auth.

| Column | Type | Notes |
|---|---|---|
| id | uuid | PK. NOT the auth user ID |
| auth_id | uuid | NOT NULL, unique. FK to `auth.users(id)` ON DELETE CASCADE |
| email | text | NOT NULL |
| partner_id | uuid | Nullable. Legacy FK to partners. Use `user_partners` instead |
| is_superadmin | boolean | Default false. Grants access to all partners |
| created_at | timestamptz | Auto |
| updated_at | timestamptz | Auto |

RLS: Users can view/update own record (identity-based, not org-based).

### user_partners

Junction table: users to partners. Enables multi-org access.

| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| user_id | uuid | NOT NULL. FK to users ON DELETE CASCADE |
| partner_id | uuid | NOT NULL. FK to partners ON DELETE CASCADE |
| role | text | `'owner'`, `'admin'`, `'member'`, or `'receptionist'`. Default: `'owner'` |
| is_default | boolean | Default false. Used for deterministic partner resolution |
| hotel_config_id | uuid | Nullable. FK to hotel_configs. Links receptionist to specific property |
| created_at | timestamptz | Auto |
| updated_at | timestamptz | Auto |

Unique constraint on (user_id, partner_id). Indexed on both FKs.

---

## Experience & Availability

### experiences

The core content: tours, activities, rentals offered by suppliers.

| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| partner_id | uuid | NOT NULL. FK to partners (the supplier) |
| title | text | NOT NULL |
| slug | text | NOT NULL. URL-safe identifier |
| description | text | NOT NULL |
| experience_status | text | `'active'`, `'draft'`, `'archived'`. Default: `'active'` |
| pricing_type | text | `'per_person'`, `'per_group'`, `'per_day'`. Default: `'per_person'` |
| price_cents | integer | NOT NULL. Base price per unit |
| base_price_cents | integer | For tiered pricing (included_participants) |
| extra_person_cents | integer | Cost per additional person beyond included |
| included_participants | integer | Number of participants in base price |
| price_per_day_cents | integer | For per-day (rental) pricing |
| min_days | integer | Nullable. Min rental duration |
| max_days | integer | Nullable. Max rental duration |
| min_participants | integer | UI minimum (not pricing floor) |
| max_participants | integer | Hard cap on group size |
| duration_minutes | integer | Experience duration |
| allows_requests | boolean | Default true. Whether guests can send requests |
| calendar_source | text | `'manual'` or `'divinea'`. Default: `'manual'` |
| cancellation_policy | text | Nullable. Free-text policy |
| force_majeure_refund | boolean | Nullable |
| tags | text[] | Array of tag slugs. 7 canonical: `unusual`, `classic`, `family`, `adventure_outdoors`, `local_life`, `history`, `food_wine` |
| available_languages | text[] | ISO codes |
| meeting_point | text | Nullable |
| hotel_notes | text | Nullable. Hotel-only operational notes (not visible to guests) |
| location | geography(POINT, 4326) | PostGIS point |
| location_address | text | Nullable |
| location_city | text | Nullable |
| location_country | text | Nullable |
| location_region | text | Nullable |
| image_url | text | Nullable. Legacy; use media table |
| divinea_product_id | text | Nullable. DiVinea integration |
| divinea_option_id | text | Nullable. DiVinea integration |
| currency | text | Default: `'EUR'` |
| created_at | timestamptz | Auto |
| updated_at | timestamptz | Auto-updated via trigger (`updated_at_trigger`) |

RLS: View own experiences + view active public experiences. Insert/update/delete own.

### experience_sessions

Time slots for session-based experiences.

| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| experience_id | uuid | NOT NULL. FK to experiences ON DELETE CASCADE |
| session_date | date | NOT NULL |
| start_time | time | NOT NULL |
| spots_total | integer | NOT NULL |
| spots_available | integer | NOT NULL. Decremented on booking |
| session_status | text | `'available'`, `'booked'`, `'cancelled'`. Default: `'scheduled'` |
| price_override_cents | integer | Nullable. Per-unit override for this session |
| price_note | text | Nullable. Explanation for price override |
| session_language | text | Nullable. ISO code |
| divinea_slot_id | text | Nullable. DiVinea integration |
| created_at | timestamptz | Auto |
| updated_at | timestamptz | Auto |

RLS: Via parent experience's partner_id. Cannot delete sessions with non-cancelled bookings (trigger).

### experience_availability

Weekly availability windows for request-based experiences.

| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| experience_id | uuid | NOT NULL. FK to experiences ON DELETE CASCADE. One-to-one. |
| weekdays | integer[] | Array of day numbers (0=Sun, 6=Sat) |
| start_time | time | Default: `'09:00'` |
| end_time | time | Default: `'18:00'` |
| valid_from | date | Nullable |
| valid_until | date | Nullable |
| created_at | timestamptz | Auto |
| updated_at | timestamptz | Auto |

### content_translations

AI-generated translations of experience content.

| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| experience_id | uuid | NOT NULL. FK to experiences ON DELETE CASCADE |
| language | text | NOT NULL. ISO code |
| title | text | NOT NULL |
| description | text | NOT NULL |
| meeting_point | text | Nullable |
| source_updated_at | timestamptz | NOT NULL. Tracks when source content was last translated |
| created_at | timestamptz | Auto |

---

## Booking & Payment

### reservations

Guest booking requests. The entry point for all bookings.

| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| experience_id | uuid | NOT NULL. FK to experiences |
| hotel_id | uuid | Nullable. FK to partners (hotel). NULL = Veyond direct booking |
| hotel_config_id | uuid | Nullable. FK to hotel_configs |
| session_id | uuid | Nullable. FK to experience_sessions. NULL = request-based |
| guest_name | text | NOT NULL |
| guest_email | text | NOT NULL |
| guest_phone | text | Nullable |
| participants | integer | NOT NULL |
| total_cents | integer | NOT NULL |
| reservation_status | text | `'pending'`, `'approved'`, `'declined'`, `'expired'`. Default: `'pending'` |
| response_deadline | timestamptz | NOT NULL. When supplier must respond |
| payment_deadline | timestamptz | Nullable. When guest must pay |
| is_request | boolean | Nullable. True = request-based flow |
| requested_date | date | Nullable. For request-based bookings |
| requested_time | time | Nullable |
| time_preference | text | Nullable |
| proposed_times | jsonb | Nullable. Supplier counter-proposals |
| rental_start_date | date | Nullable. For per-day rentals |
| rental_end_date | date | Nullable. End date inclusive |
| preferred_language | text | Nullable |
| source | text | Nullable. `'widget'`, `'veyond'`, `'receptionist'` |
| booked_by_user_id | uuid | Nullable. FK to users. Set when receptionist creates booking |
| invoice_requested | boolean | Nullable |
| guest_company_name | text | Nullable. Invoice fields |
| guest_vat | text | Nullable |
| guest_billing_address | text | Nullable |
| stripe_payment_link_id | text | Nullable. For Stripe payment mode |
| stripe_payment_link_url | text | Nullable |
| stripe_setup_intent_id | text | Nullable. For pay-on-site card guarantee |
| stripe_customer_id | text | Nullable. Stripe customer for off-session charges |
| divinea_reservation_id | text | Nullable. DiVinea integration |
| created_at | timestamptz | Auto |
| updated_at | timestamptz | Auto |

RLS: Hotels see own reservations, suppliers see reservations for their experiences.

### bookings

Confirmed, paid bookings. Created after payment succeeds (or card guarantee for pay-on-site).

| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| reservation_id | uuid | NOT NULL. FK to reservations ON DELETE CASCADE. One-to-one. |
| session_id | uuid | Nullable. FK to experience_sessions ON DELETE SET NULL |
| booking_status | text | `'confirmed'`, `'completed'`, `'cancelled'`. Default: `'confirmed'` |
| payment_mode | text | `'stripe'` or `'pay_on_site'`. Denormalized from partner |
| amount_cents | integer | NOT NULL. Total booking amount |
| supplier_amount_cents | integer | NOT NULL. Commission split |
| hotel_amount_cents | integer | NOT NULL. Commission split |
| platform_amount_cents | integer | NOT NULL. Commission split |
| paid_at | timestamptz | Nullable. NULL for pay-on-site bookings |
| completed_at | timestamptz | Nullable |
| cancelled_at | timestamptz | Nullable |
| completion_check_sent_at | timestamptz | Nullable. When completion check email was sent |
| stripe_payment_intent_id | text | Nullable |
| stripe_charge_id | text | Nullable |
| stripe_transfer_id | text | Nullable. Transfer to supplier |
| stripe_refund_id | text | Nullable |
| hotel_payout_id | uuid | Nullable. FK to hotel_payouts |
| created_at | timestamptz | Auto |
| updated_at | timestamptz | Auto |

RLS: Suppliers see bookings for their experiences (via reservation path).

### commission_invoices

Monthly commission invoices for pay-on-site suppliers.

| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| partner_id | uuid | NOT NULL. FK to partners |
| period_start | date | NOT NULL |
| period_end | date | NOT NULL |
| commission_amount_cents | integer | NOT NULL. Sum of platform commissions |
| cancellation_credit_cents | integer | Default 0. Credits from cancellation charges |
| net_amount_cents | integer | NOT NULL. commission - credits |
| status | text | `'draft'`, `'sent'`, `'paid'`. Default: `'draft'` |
| sent_at | timestamptz | Nullable |
| paid_at | timestamptz | Nullable |
| pdf_url | text | Nullable. Future: generated PDF |
| created_at | timestamptz | Auto |

RLS: Partners view own invoices.

### attendance_verifications

Guest verification for no-show claims (pay-on-site only).

| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| booking_id | uuid | NOT NULL. FK to bookings |
| verification_token | uuid | NOT NULL. Used in guest email link |
| supplier_claim | text | NOT NULL. `'no_show'` or `'attended'` |
| guest_response | text | Nullable. Guest's response |
| outcome | text | `'pending'`, `'confirmed'`, `'disputed'`, `'auto_resolved'`. Default: `'pending'` |
| deadline | timestamptz | NOT NULL. 3-day window |
| reminder_sent | boolean | Default false. Day-2 reminder |
| responded_at | timestamptz | Nullable |
| created_at | timestamptz | Auto |

RLS: Suppliers view for own experience bookings.

### cancellation_charges

Off-session charges for late cancellations or no-shows (pay-on-site).

| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| booking_id | uuid | NOT NULL. FK to bookings |
| amount_cents | integer | NOT NULL |
| status | text | `'pending'`, `'charged'`, `'failed'`. Default: `'pending'` |
| stripe_payment_intent_id | text | Nullable |
| stripe_customer_id | text | Nullable |
| commission_split_cents | jsonb | Nullable. Split breakdown |
| created_at | timestamptz | Auto |

RLS: Suppliers view for own experience bookings.

### hotel_payouts

Manual payout records for hotel commission payments.

| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| partner_id | uuid | NOT NULL. FK to partners (hotel) |
| amount_cents | integer | NOT NULL |
| currency | text | Default: `'eur'` |
| period_start | date | NOT NULL |
| period_end | date | NOT NULL |
| status | text | `'pending'`, `'paid'`. Default: `'pending'` |
| payment_method | text | Nullable |
| payment_ref | text | Nullable |
| notes | text | Nullable |
| paid_at | timestamptz | Nullable |
| created_by | uuid | Nullable. FK to users (admin) |
| created_at | timestamptz | Auto |

---

## Distribution & Configuration

### hotel_configs

Hotel-specific configuration for the embedded widget.

| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| partner_id | uuid | NOT NULL, unique. FK to partners ON DELETE CASCADE |
| display_name | text | NOT NULL. Hotel display name |
| slug | text | NOT NULL. URL slug for widget (`/{slug}`) |
| is_active | boolean | Default true |
| logo_url | text | Nullable |
| address | text | Nullable |
| website_url | text | Nullable |
| location | geography(POINT, 4326) | Hotel location for radius search |
| location_radius_km | numeric | Nullable. Search radius for nearby experiences |
| widget_max_experiences | integer | Default 50 |
| widget_title | text | Nullable |
| widget_subtitle | text | Nullable |
| widget_title_enabled | boolean | Nullable |
| accent_color, background_color, text_color, heading_color | text | Nullable. Widget theme CSS variables |
| heading_font_family, body_font_family | text | Nullable. Widget fonts |
| heading_font_weight, font_weight, font_size_base, title_font_size | text | Nullable. Widget typography |
| card_radius | text | Nullable |
| widget_grid_gap, widget_grid_min_width, widget_section_padding, widget_cta_margin, widget_title_margin, widget_text_align | text | Nullable. Widget layout |
| created_at | timestamptz | Auto |
| updated_at | timestamptz | Auto |

RLS: View/update own hotel configs.

### distributions

Which experiences are available through which hotels, with commission splits.

| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| experience_id | uuid | NOT NULL. FK to experiences ON DELETE CASCADE |
| hotel_id | uuid | NOT NULL. FK to partners (hotel) |
| hotel_config_id | uuid | Nullable. FK to hotel_configs |
| commission_supplier | integer | Default 80. Percentage |
| commission_platform | integer | Default 8. Percentage |
| commission_hotel | integer | Default 12. Percentage |
| is_active | boolean | Default true |
| selected_for_widget | boolean | Default true. Hotel toggle |
| sort_order | integer | Default 0 |
| created_at | timestamptz | Auto |

RLS: View/update own distributions.

### media

Images and files for experiences.

| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| partner_id | uuid | NOT NULL. FK to partners ON DELETE CASCADE |
| experience_id | uuid | Nullable. FK to experiences |
| storage_path | text | NOT NULL. Path in `traverum-assets` bucket |
| url | text | NOT NULL. Public URL |
| media_type | text | Nullable |
| sort_order | integer | Nullable |
| created_at | timestamptz | Auto |

Storage: Single bucket `traverum-assets`. Path: `partners/{partner_id}/experiences/{experience_id}/{uuid}`. Client-side WebP compression (0.90/0.85 quality).

### partner_invitations

Invitation links to join a partner organization.

| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| partner_id | uuid | NOT NULL. FK to partners |
| token | text | NOT NULL. Unique invite token |
| role | text | Default: `'member'` |
| hotel_config_id | uuid | Nullable. For receptionist invitations |
| created_by | uuid | Nullable. FK to users |
| used_by | uuid | Nullable. FK to users |
| used_at | timestamptz | Nullable |
| expires_at | timestamptz | NOT NULL. Default: 7 days |
| created_at | timestamptz | Auto |

---

## Analytics & Admin

### admin_audit_log

Superadmin action log.

| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| user_id | uuid | Nullable. FK to users |
| action | text | NOT NULL. What was done |
| target_type | text | Nullable. Entity type affected |
| target_id | text | Nullable. Entity ID affected |
| details | jsonb | Nullable. Additional context |
| created_at | timestamptz | Auto |

RLS: Superadmins only.

### analytics_events

Widget interaction tracking.

| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| event_type | text | NOT NULL. e.g. `'view'`, `'click'`, `'book'` |
| source | text | Nullable. e.g. `'widget'`, `'veyond'` |
| embed_mode | text | Nullable. `'inline'`, `'popup'` |
| experience_id | uuid | Nullable. FK to experiences |
| hotel_config_id | uuid | Nullable. FK to hotel_configs |
| session_id | text | Nullable. Client session identifier |
| created_at | timestamptz | Auto |

### support_feedback

In-app support messages from users.

| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| user_id | uuid | Nullable. FK to users |
| partner_id | uuid | Nullable. FK to partners |
| sender_email | text | NOT NULL |
| message | text | NOT NULL |
| status | text | Default: `'new'` |
| attachment_paths | jsonb | Default: `'[]'` |
| created_at | timestamptz | Auto |

---

## Database Functions

### get_user_partner_ids()

Returns all partner IDs the current user has access to. SECURITY DEFINER.

- If `users.is_superadmin = true`: returns ALL partner IDs
- Otherwise: returns partner IDs from `user_partners` where `user_id` matches current auth user

Used in nearly every RLS policy.

### get_experiences_within_radius(hotel_location_wkt, radius_meters, exclude_partner_id?)

PostGIS spatial query. Returns experiences within a radius of a hotel location.

Returns: `id, title, slug, description, price_cents, pricing_type, tags, image_url, location_address, distance_meters, partner_id, supplier_name, allows_requests, duration_minutes, min_participants, max_participants, hotel_notes, included_participants, extra_person_cents, base_price_cents, experience_status`

Used by hotel widget to find nearby supplier experiences.

---

## Extensions

- **PostGIS** — Spatial queries, geography columns, `ST_DWithin`, `ST_Distance`

## Storage

- **Bucket:** `traverum-assets` (single bucket, 50MB file limit)
- **RLS:** Upload/update/delete restricted to `partners/{partner_id}/` path
- **Public read:** All objects publicly readable

## Triggers

- `experiences.updated_at` — Auto-updated on any row change
- `prevent_session_delete_with_reservations` — Blocks deletion of sessions with non-cancelled bookings
- `handle_new_user` — Creates `users` row on Supabase Auth signup
