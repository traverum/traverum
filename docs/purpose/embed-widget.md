# Widget Embed System

## Purpose

The embed system is how Traverum becomes invisible. Hotels paste a snippet on their website and a beautiful, branded experience section appears — looking like it belongs to the hotel, not a third party.

**For the hotel:** Copy-paste setup. No code knowledge. Works in WordPress, Squarespace, Wix, any CMS. The widget matches their brand automatically.

**For the guest:** Seamless. Browsing experiences on the hotel website feels native. Clicking a card opens the full booking flow in a new tab — still branded to the hotel.

**What should never happen:**
- Hotel's CSS breaks the widget or vice versa
- The widget looks foreign on the hotel's page
- Setup requires more than pasting a code snippet

## Key decisions

### Shadow DOM, not iframe

The widget uses a Shadow DOM Web Component. This was a deliberate choice over iframes:
- Looks like a native section on the hotel page (not a boxed iframe)
- Full CSS isolation — hotel styles can't break widget, widget can't break hotel
- Tiny footprint (~15 KB gzipped, no React in the embed)
- Works in any CMS without special iframe handling

### Two delivery modes

| Mode | URL | Use case |
|------|-----|----------|
| Full-page | `book.traverum.com/{hotelSlug}` | QR codes, email links, direct traffic |
| Section embed | Shadow DOM widget on hotel site | Embedded on hotel website pages |

Both use the same Next.js app. The embed shows cards only; clicks open the full booking flow in a new tab.

### Theming

Each hotel has custom colors, fonts, and spacing configured in `hotel_configs`. The embed API returns theme values. Hotels can also override via CSS custom properties (`--trv-accent`, `--trv-font-heading`, etc.).

Hotels can override via CSS custom properties on the `<traverum-widget>` element:
- `--trv-accent` — accent color
- `--trv-text` — text color
- `--trv-bg` — background color
- `--trv-radius` — border radius
- `--trv-font-heading` — heading font family
- `--trv-font-body` — body font family

Google Fonts are injected into the host page's `<head>` (fonts need host-level injection for Shadow DOM to work).

### Navigation and return URLs

When a guest clicks a card in the embed, `embed.js` captures the current hotel page URL and passes it as `returnUrl`. This is preserved across all internal navigation so the header "back to hotel" button always works. Fallback: `website_url` from `hotel_configs`.

### Legacy support

The old `<div id="traverum-widget">` embed pattern still works and auto-converts to the Web Component.

## Reference

- Full architecture: `docs/technical/embed-architecture.md`
- Theming guide: `docs/technical/widget-theming-onboarding.md`
- Cursor rule: `.cursor/rules/widget-conventions.mdc`
- Code: `apps/widget/public/embed.js`, `apps/widget/src/app/api/embed/[hotelSlug]/route.ts`
