-- Prevent deleting an experience_session that still has reservations.
-- Sessions may only be deleted after all guests have been refunded and reservations removed.

CREATE OR REPLACE FUNCTION prevent_session_delete_with_reservations()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.reservations WHERE session_id = OLD.id LIMIT 1) THEN
    RAISE EXCEPTION 'Cannot delete session: it has reservations. Refund guests and remove all bookings first.';
  END IF;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS prevent_session_delete_with_reservations_trigger ON public.experience_sessions;
CREATE TRIGGER prevent_session_delete_with_reservations_trigger
  BEFORE DELETE ON public.experience_sessions
  FOR EACH ROW
  EXECUTE FUNCTION prevent_session_delete_with_reservations();
