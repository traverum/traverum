-- Run this once in Supabase Dashboard > SQL Editor
-- Adds superadmin support and sets elias.salmi@traverum.com and alessio.garzonio@traverum.com as superadmins

-- Step 1: Add is_superadmin column to users
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS is_superadmin boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_users_is_superadmin
  ON public.users (is_superadmin) WHERE is_superadmin = true;

-- Step 2: Update get_user_partner_ids() for superadmin bypass
CREATE OR REPLACE FUNCTION public.get_user_partner_ids()
RETURNS SETOF uuid
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM users
    WHERE auth_id = auth.uid() AND is_superadmin = true
  ) THEN
    RETURN QUERY SELECT id FROM partners;
  ELSE
    RETURN QUERY
      SELECT up.partner_id
      FROM user_partners up
      JOIN users u ON up.user_id = u.id
      WHERE u.auth_id = auth.uid();
  END IF;
END;
$$;

-- Step 3: Create admin audit log table
CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id),
  action text NOT NULL,
  target_type text,
  target_id uuid,
  details jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_audit_log_user
  ON public.admin_audit_log (user_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_created
  ON public.admin_audit_log (created_at DESC);

ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Superadmins can view audit log"
  ON public.admin_audit_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE auth_id = auth.uid() AND is_superadmin = true
    )
  );

CREATE POLICY "Superadmins can insert audit log"
  ON public.admin_audit_log FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE auth_id = auth.uid() AND is_superadmin = true
    )
  );

-- Step 4: Set initial superadmins
UPDATE public.users
SET is_superadmin = true
WHERE email IN (
  'elias.salmi@traverum.com',
  'alessio.garzonio@traverum.com'
);
