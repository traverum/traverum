-- Phase 1: Fix Signup Trigger
-- Replace handle_new_supplier() with handle_new_user()
-- New users get only a users row with partner_id = NULL.
-- No phantom partner org is created.
-- The user will create their first organization via the onboarding UI.

-- Drop the old trigger first
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Replace the function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- Create user record only (no partner, no org)
  INSERT INTO public.users (auth_id, email, partner_id)
  VALUES (new.id, new.email, NULL);

  RETURN new;
END;
$$;

-- Create new trigger with updated function
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Drop the old function (no longer needed)
DROP FUNCTION IF EXISTS public.handle_new_supplier();
