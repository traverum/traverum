-- Set all experiences to have Lake Maggiore, Italy as their location
-- Lake Maggiore coordinates: approximately 45.95°N, 8.65°E

UPDATE experiences
SET 
  location_address = 'Lake Maggiore, Italy',
  location = ST_SetSRID(ST_MakePoint(8.65, 45.95), 4326)::geography
WHERE location IS NULL OR location_address IS NULL;

-- Also update experiences that already have a location to Lake Maggiore
-- (This ensures all experiences have the same location for consistency)
UPDATE experiences
SET 
  location_address = 'Lake Maggiore, Italy',
  location = ST_SetSRID(ST_MakePoint(8.65, 45.95), 4326)::geography;
