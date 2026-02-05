-- Add location fields to experiences table
ALTER TABLE public.experiences
ADD COLUMN location_address text,
ADD COLUMN location geography(POINT, 4326);

-- Add GIST index on location for performance
CREATE INDEX IF NOT EXISTS experiences_location_idx ON public.experiences USING GIST (location);

-- Add comment to clarify usage
COMMENT ON COLUMN public.experiences.location_address IS 'Address/meeting point description for the experience location';
COMMENT ON COLUMN public.experiences.location IS 'PostGIS geography point (lat/lng) - mandatory for location-based filtering';

-- Note: NOT NULL constraint will be added after data migration
-- ALTER TABLE public.experiences ALTER COLUMN location SET NOT NULL;
