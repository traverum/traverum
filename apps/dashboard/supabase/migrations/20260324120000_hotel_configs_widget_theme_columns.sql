-- Widget customization + branding columns on hotel_configs.
-- Referenced by dashboard WidgetCustomization and embed; types in apps/widget/src/lib/supabase/types.ts.
-- Idempotent: safe on staging/prod if some columns already exist.

ALTER TABLE public.hotel_configs
  ADD COLUMN IF NOT EXISTS accent_color text,
  ADD COLUMN IF NOT EXISTS background_color text,
  ADD COLUMN IF NOT EXISTS body_font_family text,
  ADD COLUMN IF NOT EXISTS card_radius text,
  ADD COLUMN IF NOT EXISTS font_size_base text,
  ADD COLUMN IF NOT EXISTS font_weight text,
  ADD COLUMN IF NOT EXISTS heading_color text,
  ADD COLUMN IF NOT EXISTS heading_font_family text,
  ADD COLUMN IF NOT EXISTS heading_font_weight text,
  ADD COLUMN IF NOT EXISTS logo_url text,
  ADD COLUMN IF NOT EXISTS text_color text,
  ADD COLUMN IF NOT EXISTS title_font_size text,
  ADD COLUMN IF NOT EXISTS widget_cta_margin text,
  ADD COLUMN IF NOT EXISTS widget_grid_gap text,
  ADD COLUMN IF NOT EXISTS widget_grid_min_width text,
  ADD COLUMN IF NOT EXISTS widget_max_experiences integer NOT NULL DEFAULT 3,
  ADD COLUMN IF NOT EXISTS widget_section_padding text,
  ADD COLUMN IF NOT EXISTS widget_subtitle text,
  ADD COLUMN IF NOT EXISTS widget_text_align text,
  ADD COLUMN IF NOT EXISTS widget_title text,
  ADD COLUMN IF NOT EXISTS widget_title_enabled boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS widget_title_margin text;
