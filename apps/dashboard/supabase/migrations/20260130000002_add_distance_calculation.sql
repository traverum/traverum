-- Create function to calculate distance between two geography points
-- Returns distance in meters

CREATE OR REPLACE FUNCTION calculate_distance(
  point1 geography,
  point2 geography
)
RETURNS double precision AS $$
BEGIN
  IF point1 IS NULL OR point2 IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- ST_Distance returns distance in meters for geography type
  RETURN ST_Distance(point1, point2);
END;
$$ LANGUAGE plpgsql IMMUTABLE;
