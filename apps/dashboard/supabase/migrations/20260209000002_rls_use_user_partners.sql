-- Phase 2: RLS Migration — Use user_partners for Multi-Org
-- Replaces all 21 existing RLS policies that use the scalar users.partner_id
-- with policies that use the user_partners junction table.
-- Also enables RLS on 5 previously unprotected tables.

-- ============================================================
-- Step 1: Helper function to avoid repeating the subquery
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_user_partner_ids()
RETURNS SETOF uuid
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT up.partner_id
  FROM user_partners up
  JOIN users u ON up.user_id = u.id
  WHERE u.auth_id = auth.uid();
$$;

-- ============================================================
-- Step 2: Enable RLS on tables that currently lack it
-- ============================================================
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.experiences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hotel_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.distributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_partners ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- Step 3: Drop ALL existing policies
-- ============================================================

-- storage.objects (3 write policies — keep public read)
DROP POLICY IF EXISTS "Partners can upload to their folder" ON storage.objects;
DROP POLICY IF EXISTS "Partners can update their files" ON storage.objects;
DROP POLICY IF EXISTS "Partners can delete their files" ON storage.objects;
-- Keep "Public read access" as-is (no partner check needed)

-- media (4 policies)
DROP POLICY IF EXISTS "Partners can view their media" ON public.media;
DROP POLICY IF EXISTS "Partners can insert their media" ON public.media;
DROP POLICY IF EXISTS "Partners can update their media" ON public.media;
DROP POLICY IF EXISTS "Partners can delete their media" ON public.media;

-- users (2 policies)
DROP POLICY IF EXISTS "Users can view own record" ON public.users;
DROP POLICY IF EXISTS "Users can update own record" ON public.users;

-- partners (2 policies)
DROP POLICY IF EXISTS "Partners can view own record" ON public.partners;
DROP POLICY IF EXISTS "Partners can update own record" ON public.partners;

-- experiences (4 policies)
DROP POLICY IF EXISTS "Suppliers can view own experiences" ON public.experiences;
DROP POLICY IF EXISTS "Suppliers can insert own experiences" ON public.experiences;
DROP POLICY IF EXISTS "Suppliers can update own experiences" ON public.experiences;
DROP POLICY IF EXISTS "Suppliers can delete own experiences" ON public.experiences;

-- experience_sessions (4 policies)
DROP POLICY IF EXISTS "Suppliers can view own experience sessions" ON public.experience_sessions;
DROP POLICY IF EXISTS "Suppliers can insert own experience sessions" ON public.experience_sessions;
DROP POLICY IF EXISTS "Suppliers can update own experience sessions" ON public.experience_sessions;
DROP POLICY IF EXISTS "Suppliers can delete own experience sessions" ON public.experience_sessions;

-- reservations (1 policy)
DROP POLICY IF EXISTS "Suppliers can view reservations for their experiences" ON public.reservations;

-- bookings (1 policy)
DROP POLICY IF EXISTS "Suppliers can view bookings for their sessions" ON public.bookings;

-- ============================================================
-- Step 4: Recreate all policies using get_user_partner_ids()
-- ============================================================

-- ── users ──────────────────────────────────────────────────
-- Identity-based, not org-based: keep auth_id check
CREATE POLICY "Users can view own record" ON public.users
  FOR SELECT USING (auth_id = auth.uid());

CREATE POLICY "Users can update own record" ON public.users
  FOR UPDATE USING (auth_id = auth.uid());

-- ── partners ───────────────────────────────────────────────
CREATE POLICY "Partners can view own record" ON public.partners
  FOR SELECT TO authenticated
  USING (id IN (SELECT public.get_user_partner_ids()));

CREATE POLICY "Partners can update own record" ON public.partners
  FOR UPDATE TO authenticated
  USING (id IN (SELECT public.get_user_partner_ids()));

-- INSERT: needed during org creation (before user_partners row exists)
CREATE POLICY "Authenticated users can create partners" ON public.partners
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- ── experiences ────────────────────────────────────────────
-- Own org: full CRUD
CREATE POLICY "Partners can view own experiences" ON public.experiences
  FOR SELECT TO authenticated
  USING (partner_id IN (SELECT public.get_user_partner_ids()));

-- Public read for active experiences (hotels need to browse supplier catalog)
CREATE POLICY "Anyone can view active experiences" ON public.experiences
  FOR SELECT
  USING (experience_status = 'active');

CREATE POLICY "Partners can insert own experiences" ON public.experiences
  FOR INSERT TO authenticated
  WITH CHECK (partner_id IN (SELECT public.get_user_partner_ids()));

CREATE POLICY "Partners can update own experiences" ON public.experiences
  FOR UPDATE TO authenticated
  USING (partner_id IN (SELECT public.get_user_partner_ids()));

CREATE POLICY "Partners can delete own experiences" ON public.experiences
  FOR DELETE TO authenticated
  USING (partner_id IN (SELECT public.get_user_partner_ids()));

-- ── experience_sessions ────────────────────────────────────
CREATE POLICY "Partners can view own experience sessions" ON public.experience_sessions
  FOR SELECT TO authenticated
  USING (experience_id IN (
    SELECT id FROM public.experiences WHERE partner_id IN (SELECT public.get_user_partner_ids())
  ));

CREATE POLICY "Partners can insert own experience sessions" ON public.experience_sessions
  FOR INSERT TO authenticated
  WITH CHECK (experience_id IN (
    SELECT id FROM public.experiences WHERE partner_id IN (SELECT public.get_user_partner_ids())
  ));

CREATE POLICY "Partners can update own experience sessions" ON public.experience_sessions
  FOR UPDATE TO authenticated
  USING (experience_id IN (
    SELECT id FROM public.experiences WHERE partner_id IN (SELECT public.get_user_partner_ids())
  ));

CREATE POLICY "Partners can delete own experience sessions" ON public.experience_sessions
  FOR DELETE TO authenticated
  USING (experience_id IN (
    SELECT id FROM public.experiences WHERE partner_id IN (SELECT public.get_user_partner_ids())
  ));

-- ── media ──────────────────────────────────────────────────
CREATE POLICY "Partners can view their media" ON public.media
  FOR SELECT TO authenticated
  USING (partner_id IN (SELECT public.get_user_partner_ids()));

CREATE POLICY "Partners can insert their media" ON public.media
  FOR INSERT TO authenticated
  WITH CHECK (partner_id IN (SELECT public.get_user_partner_ids()));

CREATE POLICY "Partners can update their media" ON public.media
  FOR UPDATE TO authenticated
  USING (partner_id IN (SELECT public.get_user_partner_ids()));

CREATE POLICY "Partners can delete their media" ON public.media
  FOR DELETE TO authenticated
  USING (partner_id IN (SELECT public.get_user_partner_ids()));

-- ── storage.objects ────────────────────────────────────────
CREATE POLICY "Partners can upload to their folder" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'traverum-assets'
    AND (storage.foldername(name))[1] = 'partners'
    AND (storage.foldername(name))[2]::uuid IN (SELECT public.get_user_partner_ids())
  );

CREATE POLICY "Partners can update their files" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'traverum-assets'
    AND (storage.foldername(name))[1] = 'partners'
    AND (storage.foldername(name))[2]::uuid IN (SELECT public.get_user_partner_ids())
  );

CREATE POLICY "Partners can delete their files" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'traverum-assets'
    AND (storage.foldername(name))[1] = 'partners'
    AND (storage.foldername(name))[2]::uuid IN (SELECT public.get_user_partner_ids())
  );

-- ── reservations ───────────────────────────────────────────
-- Supplier-side: view reservations for own experiences
CREATE POLICY "Suppliers can view reservations for their experiences" ON public.reservations
  FOR SELECT TO authenticated
  USING (
    experience_id IN (
      SELECT id FROM public.experiences WHERE partner_id IN (SELECT public.get_user_partner_ids())
    )
  );

-- Hotel-side: view reservations originating from own hotel
CREATE POLICY "Hotels can view reservations from their hotel" ON public.reservations
  FOR SELECT TO authenticated
  USING (
    hotel_id IN (SELECT public.get_user_partner_ids())
  );

-- ── bookings ───────────────────────────────────────────────
CREATE POLICY "Suppliers can view bookings for their sessions" ON public.bookings
  FOR SELECT TO authenticated
  USING (
    session_id IN (
      SELECT es.id FROM public.experience_sessions es
      WHERE es.experience_id IN (
        SELECT e.id FROM public.experiences e
        WHERE e.partner_id IN (SELECT public.get_user_partner_ids())
      )
    )
  );

-- ============================================================
-- Step 5: NEW policies for newly-protected tables
-- ============================================================

-- ── user_partners ──────────────────────────────────────────
CREATE POLICY "Users can view own memberships" ON public.user_partners
  FOR SELECT TO authenticated
  USING (
    user_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid())
  );

CREATE POLICY "Users can create own memberships" ON public.user_partners
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid())
  );

-- ── hotel_configs ──────────────────────────────────────────
CREATE POLICY "Partners can view own hotel configs" ON public.hotel_configs
  FOR SELECT TO authenticated
  USING (partner_id IN (SELECT public.get_user_partner_ids()));

CREATE POLICY "Partners can insert own hotel configs" ON public.hotel_configs
  FOR INSERT TO authenticated
  WITH CHECK (partner_id IN (SELECT public.get_user_partner_ids()));

CREATE POLICY "Partners can update own hotel configs" ON public.hotel_configs
  FOR UPDATE TO authenticated
  USING (partner_id IN (SELECT public.get_user_partner_ids()));

-- ── distributions ──────────────────────────────────────────
-- Hotels: full CRUD on their distributions
CREATE POLICY "Hotels can manage their distributions" ON public.distributions
  FOR ALL TO authenticated
  USING (hotel_id IN (SELECT public.get_user_partner_ids()))
  WITH CHECK (hotel_id IN (SELECT public.get_user_partner_ids()));

-- Suppliers: read-only on distributions that include their experiences
CREATE POLICY "Suppliers can view distributions of their experiences" ON public.distributions
  FOR SELECT TO authenticated
  USING (
    experience_id IN (
      SELECT id FROM public.experiences WHERE partner_id IN (SELECT public.get_user_partner_ids())
    )
  );

-- ============================================================
-- Step 6: Make get_experiences_within_radius SECURITY DEFINER
-- so it can read experiences table despite RLS
-- ============================================================
CREATE OR REPLACE FUNCTION get_experiences_within_radius(
  hotel_location geography,
  radius_meters double precision,
  exclude_partner_id uuid
)
RETURNS TABLE (
  id uuid,
  title varchar,
  slug varchar,
  description text,
  image_url varchar,
  price_cents integer,
  duration_minutes integer,
  max_participants integer,
  meeting_point varchar,
  tags text[],
  experience_status varchar,
  location geography,
  distance_meters double precision,
  supplier_id uuid,
  supplier_name varchar,
  supplier_city varchar
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    e.id,
    e.title,
    e.slug,
    e.description,
    e.image_url,
    e.price_cents,
    e.duration_minutes,
    e.max_participants,
    e.meeting_point,
    e.tags,
    e.experience_status,
    e.location,
    ST_Distance(hotel_location, e.location) as distance_meters,
    p.id as supplier_id,
    p.name as supplier_name,
    p.city as supplier_city
  FROM experiences e
  JOIN partners p ON e.partner_id = p.id
  WHERE e.experience_status = 'active'
    AND e.partner_id != exclude_partner_id
    AND e.location IS NOT NULL
    AND ST_DWithin(hotel_location, e.location, radius_meters)
  ORDER BY ST_Distance(hotel_location, e.location);
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;
