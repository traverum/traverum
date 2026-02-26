-- Allow deleting a session when all associated bookings are cancelled.
-- Only block delete when there is at least one confirmed booking (guests not yet refunded).

CREATE OR REPLACE FUNCTION prevent_session_delete_with_reservations()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.reservations r
    INNER JOIN public.bookings b ON b.reservation_id = r.id
    WHERE r.session_id = OLD.id
      AND b.booking_status = 'confirmed'
    LIMIT 1
  ) THEN
    RAISE EXCEPTION 'Cannot delete session: it has reservations. Refund guests and remove all bookings first.';
  END IF;
  RETURN OLD;
END;
$$;
