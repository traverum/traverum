-- Run once in the receptionist-test branch SQL Editor to show experiences in the receptionist tool.
-- Backfill hotel_config_id on distributions so "Selected" tab shows Test Hotel's experiences.

UPDATE public.distributions
SET hotel_config_id = '22222222-2222-2222-2222-222222222201'
WHERE hotel_id = '11111111-1111-1111-1111-111111111101'
  AND hotel_config_id IS NULL;
