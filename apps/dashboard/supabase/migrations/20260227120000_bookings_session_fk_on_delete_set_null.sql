-- Allow deleting a session when bookings still reference it (e.g. cancelled bookings).
-- session_id on bookings becomes null when the session is deleted, so the supplier can
-- remove leftover sessions from the calendar.

ALTER TABLE public.bookings
  DROP CONSTRAINT IF EXISTS bookings_session_fk;

ALTER TABLE public.bookings
  ADD CONSTRAINT bookings_session_fk
  FOREIGN KEY (session_id)
  REFERENCES public.experience_sessions(id)
  ON DELETE SET NULL;
