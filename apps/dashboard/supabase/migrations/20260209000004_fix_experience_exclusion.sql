-- Phase 5A: Fix Experience Exclusion for Hybrid Orgs
-- Make exclude_partner_id optional (default NULL) so hybrid orgs
-- can see and select their own experiences in the hotel selection UI.

-- Drop and recreate the function with the new default parameter
DROP FUNCTION IF EXISTS get_experiences_within_radius(geography, double precision, uuid);

CREATE OR REPLACE FUNCTION get_experiences_within_radius(
  hotel_location geography,
  radius_meters double precision,
  exclude_partner_id uuid DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  title varchar,
  slug varchar,
  description text,
  image_url varchar,
  price_cents integer,
  duration_minutes integer,
  max_participants integer,
  meeting_point varchar,
  tags text[],
  experience_status varchar,
  location geography,
  distance_meters double precision,
  supplier_id uuid,
  supplier_name varchar,
  supplier_city varchar
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    e.id,
    e.title,
    e.slug,
    e.description,
    e.image_url,
    e.price_cents,
    e.duration_minutes,
    e.max_participants,
    e.meeting_point,
    e.tags,
    e.experience_status,
    e.location,
    ST_Distance(hotel_location, e.location) as distance_meters,
    p.id as supplier_id,
    p.name as supplier_name,
    p.city as supplier_city
  FROM experiences e
  JOIN partners p ON e.partner_id = p.id
  WHERE e.experience_status = 'active'
    AND (exclude_partner_id IS NULL OR e.partner_id != exclude_partner_id)
    AND e.location IS NOT NULL
    AND ST_DWithin(hotel_location, e.location, radius_meters)
  ORDER BY ST_Distance(hotel_location, e.location);
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;
