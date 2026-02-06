## Traverum Widget Theming – Hotel Onboarding Checklist

- **1. Create / verify `hotel_configs` row**
  - Ensure the hotel has a row in `hotel_configs` with a unique `slug` and linked `partner_id`.

- **2. Set branding fields**
  - **`accent_color`**: Brand hex color for buttons and interactive elements (e.g. `#2563eb`).
  - **`text_color`**: Main text color (e.g. `#1a1a1a`).
  - **`background_color`**: Main background color (e.g. `#ffffff`).
  - **`card_radius`**: Card border radius token (e.g. `0.75rem`, `1rem`).
  - **`heading_font_family`**: CSS font stack for major headings (e.g. `"Poppins, system-ui, sans-serif"` or `"Playfair Display, serif"`). Defaults to Poppins.
  - **`body_font_family`**: CSS font stack for body text and buttons (e.g. `"Inter, system-ui, sans-serif"`). Defaults to Inter.

- **3. Configure widget copy**
  - **`widget_title_enabled`**: `true` to show the widget header on full-page embeds, `false` to hide.
  - **`widget_title`**: Main heading text (default: `"Local Experiences"`).
  - **`widget_subtitle`**: Supporting text. You can use `{{hotel_name}}` which will be replaced with `display_name`
    - Example: `"Curated by the concierge team at {{hotel_name}}"`.

- **4. Test embeds**
  - **Full-page**: Visit `/{hotelSlug}?embed=full` and verify:
    - Colors, card radius, and fonts match the brand.
    - Header title/subtitle render as configured (or are hidden if disabled).
  - **Section embed (Shadow DOM widget)**: Use the embed snippet from `/dashboard/embed` on a test page and verify:
    - Experience cards render with correct theme.
    - Title/subtitle display as configured.
    - Card clicks open full booking page in a new tab.
  - **API**: Check `GET /api/embed/{hotelSlug}` returns correct theme + experiences JSON.

- **5. Share with hotel**
  - Direct the hotel to their Traverum dashboard → **Embed Setup** page to get their embed snippet.
  - For WordPress: paste into a **Custom HTML** block.
  - For other CMS: paste into any HTML/code embed block.
  - Also share the full-page booking URL (`/{hotelSlug}`) for QR codes and emails.
  - Confirm final visuals with the hotel before going live.
  - See `docs/apps/widget/widget-embed-architecture.md` for full technical details.

