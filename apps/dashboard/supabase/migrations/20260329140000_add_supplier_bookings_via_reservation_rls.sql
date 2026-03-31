-- Suppliers with request-based (sessionless) bookings couldn't see them
-- because the existing policy only matches on session_id, which is NULL
-- for request-based bookings. This adds a second path: reservation → experience → partner.
CREATE POLICY "Suppliers can view bookings via reservation"
  ON public.bookings FOR SELECT
  TO authenticated
  USING (
    reservation_id IN (
      SELECT r.id
      FROM reservations r
      WHERE r.experience_id IN (
        SELECT e.id FROM experiences e
        WHERE e.partner_id IN (SELECT get_user_partner_ids())
      )
    )
  );
