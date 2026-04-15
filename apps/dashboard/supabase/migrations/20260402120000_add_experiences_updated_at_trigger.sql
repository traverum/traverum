-- Auto-update updated_at on experiences rows whenever they are modified.
-- Required for translation cache invalidation: /api/translate compares
-- source_updated_at vs updated_at to decide when to re-translate content.

CREATE OR REPLACE FUNCTION public.set_experiences_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_experiences_updated_at ON public.experiences;
CREATE TRIGGER set_experiences_updated_at
  BEFORE UPDATE ON public.experiences
  FOR EACH ROW
  EXECUTE FUNCTION public.set_experiences_updated_at();
