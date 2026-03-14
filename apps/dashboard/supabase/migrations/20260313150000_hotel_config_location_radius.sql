-- Add location and radius to hotel_configs for receptionist "experiences within radius" and widget.
ALTER TABLE public.hotel_configs
  ADD COLUMN IF NOT EXISTS address text,
  ADD COLUMN IF NOT EXISTS location geography(POINT, 4326),
  ADD COLUMN IF NOT EXISTS location_radius_km integer DEFAULT 25,
  ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;

CREATE INDEX IF NOT EXISTS hotel_configs_location_idx ON public.hotel_configs USING GIST (location)
  WHERE location IS NOT NULL;
