-- Property details: website URL (dashboard StayDashboard debounced save).
-- Applied to staging via Supabase MCP; idempotent for other envs.
ALTER TABLE public.hotel_configs
  ADD COLUMN IF NOT EXISTS website_url text;
