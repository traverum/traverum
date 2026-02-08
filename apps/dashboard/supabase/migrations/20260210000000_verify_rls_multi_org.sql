-- RLS Verification and Fixes for Multi-Organization Support
-- This migration ensures the user_partners table exists and all RLS policies
-- correctly allow one user to manage multiple organizations.

-- ============================================================
-- Step 1: Ensure user_partners table exists
-- ============================================================
CREATE TABLE IF NOT EXISTS public.user_partners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  partner_id uuid NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'owner' CHECK (role IN ('owner', 'admin', 'member')),
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, partner_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_partners_user_id ON public.user_partners(user_id);
CREATE INDEX IF NOT EXISTS idx_user_partners_partner_id ON public.user_partners(partner_id);

-- ============================================================
-- Step 2: Verify get_user_partner_ids() function exists
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
-- Step 3: Ensure RLS is enabled on all critical tables
-- ============================================================
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.experiences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hotel_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.distributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.experience_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- Step 4: Verify and fix user_partners policies
-- ============================================================
-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view own memberships" ON public.user_partners;
DROP POLICY IF EXISTS "Users can create own memberships" ON public.user_partners;
DROP POLICY IF EXISTS "Users can update own memberships" ON public.user_partners;
DROP POLICY IF EXISTS "Users can delete own memberships" ON public.user_partners;

-- Recreate policies
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

-- Allow users to update their own memberships (e.g., change is_default)
CREATE POLICY "Users can update own memberships" ON public.user_partners
  FOR UPDATE TO authenticated
  USING (
    user_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid())
  )
  WITH CHECK (
    user_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid())
  );

-- Allow users to delete their own memberships (leave org)
CREATE POLICY "Users can delete own memberships" ON public.user_partners
  FOR DELETE TO authenticated
  USING (
    user_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid())
  );

-- ============================================================
-- Step 5: Verify partners policies allow multi-org access
-- ============================================================
-- Ensure partners INSERT policy allows creation (needed before user_partners exists)
DROP POLICY IF EXISTS "Authenticated users can create partners" ON public.partners;
CREATE POLICY "Authenticated users can create partners" ON public.partners
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- ============================================================
-- Step 6: Verify hotel_configs policies
-- ============================================================
-- Ensure hotel_configs policies exist and use get_user_partner_ids()
DROP POLICY IF EXISTS "Partners can view own hotel configs" ON public.hotel_configs;
DROP POLICY IF EXISTS "Partners can insert own hotel configs" ON public.hotel_configs;
DROP POLICY IF EXISTS "Partners can update own hotel configs" ON public.hotel_configs;

CREATE POLICY "Partners can view own hotel configs" ON public.hotel_configs
  FOR SELECT TO authenticated
  USING (partner_id IN (SELECT public.get_user_partner_ids()));

CREATE POLICY "Partners can insert own hotel configs" ON public.hotel_configs
  FOR INSERT TO authenticated
  WITH CHECK (partner_id IN (SELECT public.get_user_partner_ids()));

CREATE POLICY "Partners can update own hotel configs" ON public.hotel_configs
  FOR UPDATE TO authenticated
  USING (partner_id IN (SELECT public.get_user_partner_ids()))
  WITH CHECK (partner_id IN (SELECT public.get_user_partner_ids()));

-- ============================================================
-- Step 7: Verify distributions policies
-- ============================================================
-- Ensure distributions policies exist
DROP POLICY IF EXISTS "Hotels can manage their distributions" ON public.distributions;
DROP POLICY IF EXISTS "Suppliers can view distributions of their experiences" ON public.distributions;

CREATE POLICY "Hotels can manage their distributions" ON public.distributions
  FOR ALL TO authenticated
  USING (hotel_id IN (SELECT public.get_user_partner_ids()))
  WITH CHECK (hotel_id IN (SELECT public.get_user_partner_ids()));

CREATE POLICY "Suppliers can view distributions of their experiences" ON public.distributions
  FOR SELECT TO authenticated
  USING (
    experience_id IN (
      SELECT id FROM public.experiences WHERE partner_id IN (SELECT public.get_user_partner_ids())
    )
  );

-- ============================================================
-- Step 8: Verify reservations policies (hotel-side)
-- ============================================================
-- Note: hotel_id = partner_id (the organization)
-- hotel_config_id is for per-property scoping but RLS uses hotel_id
-- to grant access to all reservations for all properties of user's orgs
DROP POLICY IF EXISTS "Hotels can view reservations from their hotel" ON public.reservations;
CREATE POLICY "Hotels can view reservations from their hotel" ON public.reservations
  FOR SELECT TO authenticated
  USING (
    hotel_id IN (SELECT public.get_user_partner_ids())
  );

-- ============================================================
-- Step 9: Add trigger to update updated_at on user_partners
-- ============================================================
CREATE OR REPLACE FUNCTION update_user_partners_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_user_partners_updated_at ON public.user_partners;
CREATE TRIGGER update_user_partners_updated_at
  BEFORE UPDATE ON public.user_partners
  FOR EACH ROW
  EXECUTE FUNCTION update_user_partners_updated_at();
