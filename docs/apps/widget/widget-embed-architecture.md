# Widget Embed Architecture

## Why Shadow DOM

The section embed uses a **Shadow DOM Web Component** (not an iframe). The full booking flow stays in the **Next.js app**.

- Looks like a **native section** on the hotel page
- **CSS isolation** — hotel styles can't break widget, widget can't break hotel
- Works in **WordPress, Squarespace, Wix**, any CMS
- **Tiny footprint** (~15 KB gzipped, no React in the embed)
- Fully themed to match hotel brand

## How It Works

### 1. Hotel pastes the embed snippet

```html
<traverum-widget hotel="hotel-slug" max="3"></traverum-widget>
<script src="https://book.traverum.com/embed.js" async></script>
```

WordPress: use a **Custom HTML** block.

### 2. embed.js loads

1. Registers `<traverum-widget>` custom element
2. Creates Shadow DOM root (CSS isolation)
3. Shows skeleton loader immediately
4. Fetches data + theme from `/api/embed/{hotelSlug}?max=N`
5. Injects Google Fonts into host `<head>` (fonts need host-level injection for Shadow DOM)
6. Renders themed cards inside Shadow Root

### 3. Guest clicks a card

Opens `book.traverum.com/{hotelSlug}/{experienceSlug}?embed=full` in a **new tab** → full Next.js booking flow.

## API Endpoint

**`GET /api/embed/{hotelSlug}?max=3`**

Returns JSON with `widget` (title config), `theme` (colors, fonts, spacing), and `experiences` (cards data).

- **CORS:** `Access-Control-Allow-Origin: *`
- **Caching:** `s-maxage=60, stale-while-revalidate=300`

## Widget Attributes

| Attribute | Required | Default | Description |
|-----------|----------|---------|-------------|
| `hotel` | Yes | — | Hotel slug (e.g. `hotel-rosa`) |
| `max` | No | `6` | Max experiences to show |
| `button-label` | No | `See all experiences` | CTA button text |
| `hide-title` | No | `false` | Hide the title/subtitle block |

## Theming

CSS custom properties cross the Shadow DOM boundary. The widget uses internal `--_` variables that fall back to API-provided theme values. Hotels can optionally override via CSS:

```css
traverum-widget {
  --trv-accent: #8B4513;
  --trv-font-heading: 'Playfair Display', serif;
  --trv-text-align: center;
  --trv-section-padding: 80px 0;
}
```

See `widget-theming-onboarding.md` for full variable list and onboarding checklist.

## Legacy Support

Old embed pattern still works and auto-converts to the Web Component:

```html
<div id="traverum-widget"></div>
<script src="https://book.traverum.com/embed.js" data-hotel="hotel-slug" data-mode="section"></script>
```

## File Map

| File | Purpose |
|------|---------|
| `public/embed.js` | Shadow DOM widget script (static file) |
| `src/app/api/embed/[hotelSlug]/route.ts` | JSON API for widget data |
| `src/app/[hotelSlug]/...` | Full booking flow (Next.js pages) |
| `src/app/dashboard/(protected)/embed/page.tsx` | Dashboard embed code page |
