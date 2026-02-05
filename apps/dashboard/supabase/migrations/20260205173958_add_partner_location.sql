-- Add location fields to partners table for hotels
ALTER TABLE public.partners
ADD COLUMN address text,
ADD COLUMN location geography(POINT, 4326),
ADD COLUMN location_radius_km integer DEFAULT 25;

-- Add GIST index on location for performance
CREATE INDEX IF NOT EXISTS partners_location_idx ON public.partners USING GIST (location);

-- Add comment to clarify usage
COMMENT ON COLUMN public.partners.address IS 'Full address string for the hotel/partner location';
COMMENT ON COLUMN public.partners.location IS 'PostGIS geography point (lat/lng) for location-based filtering';
COMMENT ON COLUMN public.partners.location_radius_km IS 'Search radius in kilometers (default: 25km)';
