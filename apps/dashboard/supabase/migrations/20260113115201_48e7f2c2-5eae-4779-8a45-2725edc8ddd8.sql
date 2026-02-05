-- RLS policies for reservations table
-- Suppliers can view reservations for their experiences

CREATE POLICY "Suppliers can view reservations for their experiences"
ON public.reservations
FOR SELECT
USING (
  experience_id IN (
    SELECT e.id FROM experiences e
    WHERE e.partner_id IN (
      SELECT u.partner_id FROM users u
      WHERE u.auth_id = auth.uid()
    )
  )
);

-- RLS policies for bookings table
-- Suppliers can view bookings for sessions of their experiences

CREATE POLICY "Suppliers can view bookings for their sessions"
ON public.bookings
FOR SELECT
USING (
  session_id IN (
    SELECT es.id FROM experience_sessions es
    WHERE es.experience_id IN (
      SELECT e.id FROM experiences e
      WHERE e.partner_id IN (
        SELECT u.partner_id FROM users u
        WHERE u.auth_id = auth.uid()
      )
    )
  )
);