# Traverum Widget — Embed Architecture

## Overview

The Traverum widget uses a **Shadow DOM Web Component** for the section embed (experience cards shown on hotel websites) and the existing **Next.js app** for the full booking flow (experience detail → checkout → payment → confirmation).

This hybrid approach gives hotels a widget that:
- Looks like a **native section** on their page (not an iframe box)
- **Cannot break** the hotel's own site (Shadow DOM CSS isolation)
- Works in **WordPress, Squarespace, Wix**, and any other CMS
- Is **fully themed** to match the hotel's brand
- Has a **tiny footprint** (~15 KB gzipped, no React/Next.js in the embed)

---

## How It Works

### 1. Hotel Embeds the Widget

Hotels paste two lines into any page on their website:

```html
<traverum-widget hotel="hotel-slug" max="3"></traverum-widget>
<script src="https://book.traverum.com/embed.js" async></script>
```

In WordPress: use a **Custom HTML** block and paste the snippet.

### 2. embed.js Loads

The script (`public/embed.js`) does the following:

1. Registers a `<traverum-widget>` **custom element** (Web Component)
2. Creates a **Shadow DOM** root for CSS isolation
3. Shows a **skeleton loader** immediately (no layout shift)
4. Fetches experience data + theme config from the **API endpoint**
5. Injects **Google Fonts** into the host document's `<head>` (fonts require host-level injection for Shadow DOM compatibility)
6. Renders themed HTML cards inside the Shadow Root

### 3. Guest Clicks a Card

Card clicks open `book.traverum.com/{hotelSlug}/{experienceSlug}?embed=full` in a **new tab**. This is the full Next.js booking app with:
- Experience detail page
- Date/session selection
- Stripe checkout
- Booking confirmation

---

## API Endpoint

**`GET /api/embed/{hotelSlug}?max=3`**

Returns JSON with three sections:

```json
{
  "widget": {
    "titleEnabled": true,
    "title": "Local Experiences",
    "subtitle": "Curated by the team at Hotel Rosa",
    "hotelName": "Hotel Rosa",
    "hotelSlug": "hotel-rosa",
    "totalExperiences": 5
  },
  "theme": {
    "accentColor": "#8B4513",
    "textColor": "#1a1a1a",
    "backgroundColor": "#ffffff",
    "cardRadius": "0.75rem",
    "headingFontFamily": "Playfair Display, serif",
    "bodyFontFamily": "Inter, system-ui, sans-serif",
    "headingFontWeight": "400",
    "fontSizeBase": "16"
  },
  "experiences": [
    {
      "id": "uuid",
      "title": "Wine Tasting in the Hills",
      "slug": "wine-tasting",
      "coverImage": "https://...",
      "durationMinutes": 120,
      "priceCents": 4500,
      "priceSuffix": "/ person",
      "currency": "EUR",
      "tags": ["food-wine"]
    }
  ]
}
```

**CORS**: Allows all origins (`Access-Control-Allow-Origin: *`).  
**Caching**: `s-maxage=60, stale-while-revalidate=300` (1 min fresh, 5 min stale).

---

## Shadow DOM — Why and How

### Why Shadow DOM?

| Problem | Shadow DOM Solution |
|---------|-------------------|
| Hotel CSS breaks widget layout | Styles cannot cross the shadow boundary |
| Widget CSS breaks hotel page | Styles are scoped inside the shadow root |
| iframe looks "foreign" / height sync issues | Real DOM elements, natural page flow |
| Large iframe bundle (300KB+ Next.js) | Lightweight vanilla JS (~15KB gzipped) |
| Hotel-specific CSS hacks needed | Theme API handles all variations |

### How Theming Works

CSS custom properties **do cross** the Shadow DOM boundary. The widget uses internal variables that fall back to the API-provided theme:

```css
:host {
  --_accent: var(--trv-accent, #2563eb);
  --_font-heading: var(--trv-font-heading, Poppins, sans-serif);
  /* ... */
}
```

Hotels can optionally override from their own CSS:

```css
traverum-widget {
  --trv-accent: #8B4513;
  --trv-font-heading: 'Playfair Display', serif;
}
```

### Font Loading

`@font-face` rules don't work inside Shadow DOM. The embed script injects Google Fonts `<link>` tags into the host document's `<head>`, making fonts available everywhere including the shadow root.

---

## Widget Attributes

| Attribute | Required | Default | Description |
|-----------|----------|---------|-------------|
| `hotel` | ✅ | — | Hotel slug (e.g. `hotel-rosa`) |
| `max` | | `6` | Max experiences to show |
| `button-label` | | `See all experiences` | CTA button text |
| `hide-title` | | `false` | Hide the title/subtitle block |

---

## Legacy Compatibility

The old embed pattern is still supported:

```html
<div id="traverum-widget"></div>
<script src="https://book.traverum.com/embed.js" data-hotel="hotel-slug" data-mode="section"></script>
```

The script detects this pattern and automatically converts it to the Web Component.

---

## File Map

| File | Purpose |
|------|---------|
| `public/embed.js` | Shadow DOM widget script (served as static file) |
| `src/app/api/embed/[hotelSlug]/route.ts` | JSON API endpoint for widget data |
| `src/app/[hotelSlug]/...` | Full booking flow (Next.js pages) |
| `src/app/dashboard/(protected)/embed/page.tsx` | Dashboard page where hotels get their embed code |

---

## Browser Support

Shadow DOM is supported in all modern browsers:
- Chrome 53+ / Edge 79+
- Firefox 63+
- Safari 10+
- All mobile browsers (iOS Safari, Chrome Android)

No polyfill needed for any browser released after 2018.
