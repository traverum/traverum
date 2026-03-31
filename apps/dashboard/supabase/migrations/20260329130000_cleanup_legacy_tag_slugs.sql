-- Remap any remaining legacy slugs to their new equivalents
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

-- Deduplicate (e.g. wellness->classic when classic already existed)
UPDATE experiences
SET tags = (
  SELECT ARRAY(SELECT DISTINCT unnest(tags) ORDER BY 1)
)
WHERE array_length(tags, 1) > 0;
