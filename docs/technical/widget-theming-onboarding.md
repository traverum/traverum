# Widget Theming — Hotel Onboarding Checklist

> **Unit convention — always use `px`**
>
> All size/spacing values in `hotel_configs` use **pixels** (`px`), never `rem`.
> Theme values flow through a DB → API → JavaScript → CSS pipeline where JS
> code parses numbers programmatically (e.g. to compute responsive `clamp()`
> sizes or derive hover shades). Using `rem` caused silent bugs: `parseInt('2.5rem')`
> returns `2`, not `40`, which produced a 2-pixel title.  Pixels are unambiguous
> at every layer.  The browser still renders them identically — `12px` and
> `0.75rem` produce the same result — but `px` is safe to parse in JS.

## 1. Create / verify `hotel_configs` row
- Ensure the hotel has a row with a unique `slug` and linked `partner_id`

## 2. Set branding fields
- **`accent_color`** — Brand hex for buttons/interactive elements (e.g. `#2563eb`)
- **`heading_color`** — Color for h1/h2/h3 headings (e.g. `#cba366`). Falls back to `text_color` if not set. Use this when the hotel uses a brand color for headings that differs from body text.
- **`text_color`** — Body text color, should be dark/readable (e.g. `#1a1a1a`, `#333333`)
- **`background_color`** — Main background (e.g. `#ffffff`)
- **`card_radius`** — Card border radius (e.g. `12px`)
- **`heading_font_family`** — CSS font stack for headings (default: Poppins)
- **`body_font_family`** — CSS font stack for body text (default: Inter)

## 3. Configure widget copy
- **`widget_title_enabled`** — `true` to show header, `false` to hide
- **`widget_title`** — Main heading (default: "Local Experiences")
- **`widget_subtitle`** — Supporting text, supports `{{hotel_name}}` placeholder

## 3a. Match hotel website spacing
Inspect the hotel's site where the widget will be placed, then set:
- **`widget_text_align`** — `left` / `center` / `right`
- **`widget_section_padding`** — CSS padding (e.g. `48px 0`)
- **`widget_title_margin`** — Space below title (e.g. `32px`)
- **`widget_grid_gap`** — Gap between cards (e.g. `24px`)
- **`widget_cta_margin`** — Space above CTA button (e.g. `32px`)
- **`widget_grid_min_width`** — Min card width / column control (e.g. `280px`)
- All configurable via **Dashboard > Widget Style** or CSS overrides

### Default values (px)

| Field | Default |
|---|---|
| `card_radius` | `12px` |
| `title_font_size` | `40px` |
| `widget_section_padding` | `0` |
| `widget_title_margin` | `24px` |
| `widget_grid_gap` | `20px` |
| `widget_cta_margin` | `28px` |
| `widget_grid_min_width` | `280px` |

## 4. Test embeds
- **Full-page:** Visit `/{hotelSlug}` — check colors, fonts, title
- **Section embed:** Use snippet from `/dashboard/embed` on a test page — check cards, clicks, theme
- **API:** Check `GET /api/embed/{hotelSlug}` returns correct JSON

## 5. Share with hotel
- Point hotel to **Dashboard > Embed Setup** for their snippet
- WordPress: **Custom HTML** block. Other CMS: any HTML embed block.
- Share full-page URL (`/{hotelSlug}`) for QR codes and emails
- Confirm visuals with hotel before going live
