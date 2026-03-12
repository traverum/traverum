-- Analytics events table for tracking widget views, experience views, and traffic sources
CREATE TABLE analytics_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  hotel_config_id uuid REFERENCES hotel_configs(id) ON DELETE SET NULL,
  experience_id uuid REFERENCES experiences(id) ON DELETE SET NULL,
  source text,
  embed_mode text,
  session_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_analytics_events_hotel_created
  ON analytics_events (hotel_config_id, created_at);
CREATE INDEX idx_analytics_events_type_hotel
  ON analytics_events (event_type, hotel_config_id, created_at);
CREATE INDEX idx_analytics_events_experience
  ON analytics_events (experience_id, created_at);

-- Add traffic source column to reservations
ALTER TABLE reservations ADD COLUMN source text;
