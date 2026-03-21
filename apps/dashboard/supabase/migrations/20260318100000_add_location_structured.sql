-- Add structured location columns for city, region, country
ALTER TABLE experiences ADD COLUMN IF NOT EXISTS location_city text;
ALTER TABLE experiences ADD COLUMN IF NOT EXISTS location_region text;
ALTER TABLE experiences ADD COLUMN IF NOT EXISTS location_country text;

-- Backfill: all current experiences are in the Lake Maggiore area
UPDATE experiences
SET location_city = 'Stresa',
    location_region = 'Piedmont',
    location_country = 'Italy'
WHERE location_city IS NULL;
