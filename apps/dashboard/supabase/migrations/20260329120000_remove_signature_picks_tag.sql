-- Remove 'signature_picks' tag from all experiences that have it
UPDATE experiences
SET tags = array_remove(tags, 'signature_picks')
WHERE 'signature_picks' = ANY(tags);

-- Update column comment to reflect valid tag values
COMMENT ON COLUMN experiences.tags IS
  'Curated editorial tags. Valid values: unusual, classic, family, adventure_outdoors, local_life, history, food_wine';
