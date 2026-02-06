-- Migrate old experience tags to new category system
-- This migration maps old tag values to new category IDs

-- Create function to map old tags to new categories
CREATE OR REPLACE FUNCTION map_tag_to_category(tag_text text)
RETURNS text AS $$
BEGIN
  RETURN CASE
    -- Direct matches
    WHEN LOWER(tag_text) = 'food' THEN 'food'
    
    -- Wine & Food experiences
    WHEN tag_text = 'Wine Tasting' THEN 'food'
    WHEN tag_text = 'Cooking Class' THEN 'food'
    WHEN tag_text = 'Food Tour' THEN 'food'
    WHEN tag_text = 'Olive Oil Tasting' THEN 'food'
    
    -- Culture & History
    WHEN tag_text = 'Historical Tour' THEN 'culture'
    WHEN tag_text = 'Art & Museum' THEN 'culture'
    
    -- Nature & Outdoors
    WHEN tag_text = 'Hiking' THEN 'nature'
    WHEN tag_text = 'Cycling' THEN 'nature'
    WHEN tag_text = 'Truffle Hunting' THEN 'nature'
    
    -- Adventure & Sports
    WHEN tag_text = 'Boat Tour' THEN 'adventure'
    WHEN tag_text = 'Water Sports' THEN 'adventure'
    WHEN tag_text = 'Skiing' THEN 'adventure'
    WHEN tag_text = 'Vespa Tour' THEN 'adventure'
    WHEN tag_text = 'Photography' THEN 'adventure'
    
    -- Wellness
    WHEN tag_text = 'Wellness & Spa' THEN 'wellness'
    
    -- Nightlife
    WHEN tag_text = 'Night Tour' THEN 'nightlife'
    
    -- Default fallback
    ELSE 'culture'
  END;
END;
$$ LANGUAGE plpgsql;

-- Migrate tags to categories
-- Takes the first tag if multiple exist, maps it to new category
UPDATE experiences
SET tags = ARRAY[map_tag_to_category(tags[1])]
WHERE tags IS NOT NULL 
  AND array_length(tags, 1) > 0
  AND tags[1] NOT IN ('food', 'culture', 'nature', 'adventure', 'wellness', 'nightlife');

-- Ensure all experiences have at least one category
UPDATE experiences
SET tags = ARRAY['culture']
WHERE tags IS NULL OR array_length(tags, 1) IS NULL OR array_length(tags, 1) = 0;

-- Drop the temporary function
DROP FUNCTION map_tag_to_category(text);

-- Add comment to document the migration
COMMENT ON COLUMN experiences.tags IS 'Array containing a single category ID from: food, culture, nature, adventure, wellness, nightlife';
