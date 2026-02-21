# RLS Multi-Organization Verification

## Overview
This document verifies that Row Level Security (RLS) policies correctly support one user managing multiple organizations, experiences, and hotels.

## Key Architecture

### Core Tables
- **`users`**: One row per authenticated user (auth_id → Supabase auth)
- **`user_partners`**: Junction table linking users to organizations (many-to-many)
- **`partners`**: Organizations (companies) - can be suppliers, hotels, or both
- **`hotel_configs`**: Hotel properties (multiple per partner)
- **`experiences`**: Experiences created by suppliers
- **`distributions`**: Links experiences to hotel properties
- **`reservations`**: Bookings (linked to both hotel_id and hotel_config_id)

### Helper Function
**`get_user_partner_ids()`**: Returns all `partner_id`s for the current authenticated user via `user_partners` junction table.

```sql
SELECT up.partner_id
FROM user_partners up
JOIN users u ON up.user_id = u.id
WHERE u.auth_id = auth.uid();
```

## RLS Policy Pattern

All multi-org policies follow this pattern:
```sql
USING (partner_id IN (SELECT public.get_user_partner_ids()))
```

This allows users to access data from **all organizations they belong to**, not just one.

## Verified Policies

### ✅ user_partners
- **SELECT**: Users can view their own memberships
- **INSERT**: Users can create memberships for themselves
- **UPDATE**: Users can update their own memberships (e.g., change is_default)
- **DELETE**: Users can delete their own memberships (leave org)

### ✅ partners
- **SELECT**: Partners in `get_user_partner_ids()`
- **UPDATE**: Partners in `get_user_partner_ids()`
- **INSERT**: Any authenticated user (needed during org creation, before user_partners exists)

### ✅ experiences
- **SELECT (own)**: `partner_id IN (get_user_partner_ids())`
- **SELECT (public)**: `experience_status = 'active'` (hotels need to browse catalog)
- **INSERT/UPDATE/DELETE**: `partner_id IN (get_user_partner_ids())`

### ✅ hotel_configs
- **SELECT/INSERT/UPDATE**: `partner_id IN (get_user_partner_ids())`

### ✅ distributions
- **Hotels (ALL)**: `hotel_id IN (get_user_partner_ids())` - full CRUD
- **Suppliers (SELECT)**: `experience_id IN (experiences WHERE partner_id IN (get_user_partner_ids()))`

### ✅ reservations
- **Suppliers (SELECT)**: `experience_id IN (experiences WHERE partner_id IN (get_user_partner_ids()))`
- **Hotels (SELECT)**: `hotel_id IN (get_user_partner_ids())` - sees all reservations for all properties of their orgs

### ✅ experience_sessions
- **SELECT/INSERT/UPDATE/DELETE**: `experience_id IN (experiences WHERE partner_id IN (get_user_partner_ids()))`

### ✅ media
- **SELECT/INSERT/UPDATE/DELETE**: `partner_id IN (get_user_partner_ids())`

### ✅ storage.objects
- **INSERT/UPDATE/DELETE**: Folder path contains `partner_id IN (get_user_partner_ids())`
- **SELECT**: Public read (no RLS check)

## Multi-Organization Scenarios

### Scenario 1: User with 2 separate organizations
- User creates Org A (supplier) → `user_partners` row created
- User creates Org B (hotel) → `user_partners` row created
- `get_user_partner_ids()` returns both `partner_id`s
- User can switch between orgs in UI → RLS grants access to both

### Scenario 2: Hybrid organization
- User creates org with hotel capability
- User adds first experience → org becomes hybrid
- `get_user_partner_ids()` returns the org's `partner_id`
- User can access both hotel configs AND experiences for that org

### Scenario 3: Multiple hotel properties
- User creates hotel org → `hotel_configs` row created
- User adds second property → second `hotel_configs` row created
- Both share same `partner_id`
- RLS grants access to both via `hotel_configs.partner_id IN (get_user_partner_ids())`

## Migration Applied

**`20260210000000_verify_rls_multi_org.sql`** ensures:
1. `user_partners` table exists with correct structure
2. All RLS policies are correctly configured
3. Missing policies (UPDATE/DELETE on user_partners) are added
4. Indexes for performance

## Testing Checklist

- [ ] User can create multiple organizations
- [ ] User can switch between organizations in dropdown
- [ ] User can access experiences from all their supplier orgs
- [ ] User can access hotel configs from all their hotel orgs
- [ ] User can create experiences in any of their supplier orgs
- [ ] User can create hotel properties in any of their hotel orgs
- [ ] User can view bookings/reservations for all their orgs
- [ ] User cannot access data from orgs they don't belong to
- [ ] Hybrid orgs can see their own experiences in hotel selection
- [ ] Multiple properties per org work independently
