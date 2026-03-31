ALTER TABLE bookings ADD COLUMN IF NOT EXISTS completion_check_sent_at timestamptz;
