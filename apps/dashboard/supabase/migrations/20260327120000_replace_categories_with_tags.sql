-- Remap old category slugs to new experience tag slugs.
-- No schema change — tags text[] already exists.
-- Best-effort mapping; experiences may need manual re-tagging afterward.

UPDATE experiences
SET tags = array_replace(tags, 'food', 'food_wine')
WHERE 'food' = ANY(tags);

UPDATE experiences
SET tags = array_replace(tags, 'culture', 'history')
WHERE 'culture' = ANY(tags);

UPDATE experiences
SET tags = array_replace(tags, 'nature', 'adventure_outdoors')
WHERE 'nature' = ANY(tags);

UPDATE experiences
SET tags = array_replace(tags, 'adventure', 'adventure_outdoors')
WHERE 'adventure' = ANY(tags);

UPDATE experiences
SET tags = array_replace(tags, 'wellness', 'classic')
WHERE 'wellness' = ANY(tags);

UPDATE experiences
SET tags = array_replace(tags, 'nightlife', 'local_life')
WHERE 'nightlife' = ANY(tags);

-- Remove any accidental duplicates created by remapping
-- (e.g. an experience that had both 'nature' and 'adventure' now has 'adventure_outdoors' twice)
UPDATE experiences
SET tags = (
  SELECT ARRAY(SELECT DISTINCT unnest(tags) ORDER BY 1)
)
WHERE array_length(tags, 1) > 0;

COMMENT ON COLUMN experiences.tags IS
  'Curated editorial tags. Valid values: signature_picks, unusual, classic, family, adventure_outdoors, local_life, history, food_wine';
