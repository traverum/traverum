-- Move Lago Maggiore Bay properties under partner "Aurum - Casabella"
-- Run once. Adjust partner name patterns below if your DB uses different spelling.

DO $$
DECLARE
  source_partner_id uuid;  -- Lago Maggiore Bay
  target_partner_id uuid;  -- Aurum - Casabella
  config_count int;
  res_count int;
  dist_count int;
BEGIN
  -- Resolve partner IDs by name (case-insensitive, trim)
  SELECT id INTO target_partner_id
  FROM public.partners
  WHERE TRIM(name) ILIKE '%Aurum%Casabella%' OR TRIM(name) ILIKE '%Aurum - Casabella%'
  LIMIT 1;

  SELECT id INTO source_partner_id
  FROM public.partners
  WHERE TRIM(name) ILIKE '%Lago Maggiore Bay%'
  LIMIT 1;

  -- Skip on fresh DB (e.g. preview branch) where these partners do not exist
  IF target_partner_id IS NULL OR source_partner_id IS NULL THEN
    RAISE NOTICE 'Move Lago Maggiore Bay: one or both partners not found; skipping (ok on fresh DB).';
    RETURN;
  END IF;

  IF source_partner_id = target_partner_id THEN
    RAISE NOTICE 'Source and target partner are the same. No update needed.';
    RETURN;
  END IF;

  -- Count what we will update
  SELECT COUNT(*) INTO config_count FROM public.hotel_configs WHERE partner_id = source_partner_id;
  SELECT COUNT(*) INTO res_count FROM public.reservations WHERE hotel_id = source_partner_id;
  SELECT COUNT(*) INTO dist_count FROM public.distributions WHERE hotel_id = source_partner_id;

  -- Move hotel_configs (properties) to the new partner
  UPDATE public.hotel_configs
  SET partner_id = target_partner_id
  WHERE partner_id = source_partner_id;

  -- Point reservations and distributions to the new partner (for payouts/reporting)
  UPDATE public.reservations
  SET hotel_id = target_partner_id
  WHERE hotel_id = source_partner_id;

  UPDATE public.distributions
  SET hotel_id = target_partner_id
  WHERE hotel_id = source_partner_id;

  RAISE NOTICE 'Moved % hotel_config(s), % reservation(s), % distribution(s) from Lago Maggiore Bay to Aurum - Casabella.',
    config_count, res_count, dist_count;
END $$;
