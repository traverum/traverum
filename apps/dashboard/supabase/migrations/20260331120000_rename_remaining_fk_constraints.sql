-- Rename FK constraints that the sync migration (20260321) missed.
-- PostgREST uses these constraint names as join hints; mismatches cause 400 errors.

DO $$
BEGIN
  -- distributions.hotel_id → partners
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'distributions_hotel_id_fkey'
      AND table_name = 'distributions'
  ) THEN
    ALTER TABLE distributions RENAME CONSTRAINT distributions_hotel_id_fkey TO distributions_hotel_fk;
  END IF;

  -- bookings.reservation_id → reservations
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'bookings_reservation_id_fkey'
      AND table_name = 'bookings'
  ) THEN
    ALTER TABLE bookings RENAME CONSTRAINT bookings_reservation_id_fkey TO bookings_reservation_fk;
  END IF;

  -- bookings.session_id → experience_sessions
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'bookings_session_id_fkey'
      AND table_name = 'bookings'
  ) THEN
    ALTER TABLE bookings RENAME CONSTRAINT bookings_session_id_fkey TO bookings_session_fk;
  END IF;
END $$;
