# Widget Theming — Hotel Onboarding Checklist

## 1. Create / verify `hotel_configs` row
- Ensure the hotel has a row with a unique `slug` and linked `partner_id`

## 2. Set branding fields
- **`accent_color`** — Brand hex for buttons/interactive elements (e.g. `#2563eb`)
- **`text_color`** — Main text color (e.g. `#1a1a1a`)
- **`background_color`** — Main background (e.g. `#ffffff`)
- **`card_radius`** — Card border radius (e.g. `0.75rem`)
- **`heading_font_family`** — CSS font stack for headings (default: Poppins)
- **`body_font_family`** — CSS font stack for body text (default: Inter)

## 3. Configure widget copy
- **`widget_title_enabled`** — `true` to show header, `false` to hide
- **`widget_title`** — Main heading (default: "Local Experiences")
- **`widget_subtitle`** — Supporting text, supports `{{hotel_name}}` placeholder

## 3a. Match hotel website spacing
Inspect the hotel's site where the widget will be placed, then set:
- **`widget_text_align`** — `left` / `center` / `right`
- **`widget_section_padding`** — CSS padding (e.g. `3rem 0`)
- **`widget_title_margin`** — Space below title (e.g. `2rem`)
- **`widget_grid_gap`** — Gap between cards (e.g. `1.5rem`)
- **`widget_cta_margin`** — Space above CTA button (e.g. `2rem`)
- **`widget_grid_min_width`** — Min card width / column control (e.g. `280px`)
- All configurable via **Dashboard > Widget Style** or CSS overrides

## 4. Test embeds
- **Full-page:** Visit `/{hotelSlug}?embed=full` — check colors, fonts, title
- **Section embed:** Use snippet from `/dashboard/embed` on a test page — check cards, clicks, theme
- **API:** Check `GET /api/embed/{hotelSlug}` returns correct JSON

## 5. Share with hotel
- Point hotel to **Dashboard > Embed Setup** for their snippet
- WordPress: **Custom HTML** block. Other CMS: any HTML embed block.
- Share full-page URL (`/{hotelSlug}`) for QR codes and emails
- Confirm visuals with hotel before going live
