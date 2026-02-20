# Traverum Dashboard — Technical Design Specs

Technical implementation reference for building dashboard interfaces. For brand identity, color palette, and typography, see [Brand Essence](./brand-essence.md).

---

## Guiding Rules

1. **Nothing unnecessary.** Every element must serve a function. Hide complexity until needed. Progressive disclosure over information overload.
2. **Visual over text.** Badges, icons, status dots, and color communicate state. Text appears only when essential or on hover.
3. **Unified background.** One warm white surface everywhere — cards, sidebar, header, page. Borders create distinction, never shadows or background color variation.
4. **Icons only.** Lucide (`lucide-react`) for all icons. No emojis, ever.
5. **Compact and precise.** Small components, tight spacing, fast feedback. Respect the user's screen and time.

---

## Layout

### Unified Surface

Everything sits on the same background. No visual separation through color — borders handle all distinction (Notion-style).

| Element | Background | Token |
|---------|-----------|-------|
| Page | Warm white | `bg-background` / `bg-background-alt` |
| Cards | Same warm white | `bg-card` |
| Sidebar | Same warm white | `bg-sidebar-background` |
| Header | Same warm white | `bg-background` |

**Exception:** Modals use shadows for elevation.

### Information Architecture

- **Primary:** What needs attention (top-left)
- **Secondary:** Quick metrics (top-right)
- **Tertiary:** Everything else (below)
- **Container:** `container max-w-6xl mx-auto px-4 py-6`

### 8px Grid

- **Base unit:** 8px — all spacing in multiples
- **Half-steps:** 4px for fine-tuning only
- **No arbitrary values**

```
gap-2 (8px)    — Small gaps between related items
gap-3 (12px)   — Medium gaps (card grids, horizontal lists)
gap-4 (16px)   — Standard gaps (form fields, sections)
space-y-4      — Standard vertical rhythm in cards
p-3 (12px)     — Compact padding
p-4 (16px)     — Standard padding
px-4 py-6      — Container padding
```

---

## Border System

Notion-style. Subtle, warm, consistent.

| Element | Class |
|---------|-------|
| Cards | `border border-border` |
| Card section dividers | `border-t border-border` |
| Sidebar | `border-r border-border` |
| Header | `border-b border-border` |
| Floating elements | `border border-border/50` with `backdrop-blur` |

### Border Radius Scale

| Size | Token | Usage |
|------|-------|-------|
| 3px | `rounded-sm` | Buttons, inputs, form elements |
| 4px | `rounded` | Cards, containers |
| 6px | `rounded-md` | Floating elements (autosave, tooltips) |
| 8px | `rounded-lg` | Modals, large containers |
| Full | `rounded-full` | Status dots, pill badges |

Never mix randomly. Use the systematic scale.

---

## Color Usage

Colors are defined in [Brand Essence](./brand-essence.md). This section documents *how* to apply them in the dashboard.

### Primary Accent

Use `primary` for the single interactive accent: primary buttons, active navigation, focused states. Sparingly — it should stand out *because* it's rare.

### Semantic Colors

For communicating state. Always muted, never bright.

| State | Background | Tinted background | Text |
|-------|-----------|-------------------|------|
| Success | `bg-success` | `bg-success/10` | `text-success` |
| Warning | `bg-warning` | `bg-warning/10` | `text-warning` |
| Error | `bg-destructive` | `bg-destructive/10` | `text-destructive` |
| Info | `bg-info` | `bg-info/10` | `text-info` |

**Status dots:** `w-2 h-2 rounded-full` with semantic background (e.g. `bg-success`).

**Status selects:** Tinted background + text color (e.g. `bg-success/10 text-success border-success/20`).

**Character counters:** Semantic text color for valid/invalid feedback.

### Text

- **Primary:** `text-foreground`
- **Secondary:** `text-secondary` (65% opacity)
- **Muted:** `text-muted-foreground` (40% opacity)
- **Body:** `text-sm` default in dashboard context
- **Helpers/counters:** `text-xs`

### Hover & Interactive States

- **Cards:** `hover:bg-accent/50` — subtle background shift, not shadow
- **Buttons:** Color transition only, no scale animation
- **Links/nav:** `transition-colors` on hover

---

## Components

### Buttons

| Property | Value |
|----------|-------|
| Default height | `h-7` (28px) |
| Large height | `h-8` (32px) |
| Padding | `px-3 py-1` — 1.5:1 horizontal-to-vertical ratio, not equal |
| Radius | `rounded-sm` (3px) |
| Transition | `transition-ui` (20ms ease-in) |
| Animation | Color change only, no scale |

### Inputs

| Property | Value |
|----------|-------|
| Standard height | `h-8` (32px) |
| Select height | `h-9` (36px) |
| Border | None — borderless |
| Background | `bg-[rgba(242,241,238,0.6)]` — subtle beige tint |
| Radius | `rounded-sm` (3px) |
| Focus | Ring or inset box-shadow (not outline) |
| Status variant | Tinted semantic background (e.g. `bg-success/10 text-success`) |

### Cards

| Property | Value |
|----------|-------|
| Padding | `p-3` (12px) or `p-4` (16px) |
| Radius | `rounded` (4px) or implicit from Card component |
| Border | `border border-border` |
| Shadow | None |
| Background | `bg-card` (same as page) |
| Section dividers | `border-t border-border` |
| Interactive | `cursor-pointer transition-ui hover:bg-accent/50` |

### Navigation (Sidebar)

| Property | Value |
|----------|-------|
| Width | 224px |
| Background | `bg-sidebar-background` (same as page) |
| Border | `border-r border-border` |
| Item height | 28px |
| Item padding | `4px 10px` |
| Item hover radius | 8px |
| Icon size | 22px |
| Text | `text-sm font-medium` |
| Badge | Right-aligned, subtle background |

### Tabs

| Property | Value |
|----------|-------|
| Height | `h-9` (36px) |
| Labels | `text-sm` |
| Content spacing | `space-y-4` |

### Badges & Status Indicators

- **Status dots:** `w-2 h-2 rounded-full` with semantic color
- **Pill badges:** `rounded-full`, `px-1.5 py-0.5`
- **Card badges:** `absolute top-2 right-2`, `text-xs font-medium`
- **Visual first** — number/icon prominent, text secondary

### Status Select/Dropdown

| Property | Value |
|----------|-------|
| Height | `h-9` (36px) |
| Background | Borderless (same as inputs) |
| Active state | `bg-success/10 text-success border-success/20` |
| Draft state | `bg-warning/10 text-warning border-warning/20` |
| Archived state | `bg-muted text-muted-foreground` |
| Status dot | `w-2 h-2 rounded-full` inline |

### Empty States

- **Text only** for passive/negative states ("No X yet")
- **No icons** — they draw attention when nothing requires action
- **No subtitles**
- **Layout:** `p-6 text-center`, `text-sm text-muted-foreground`, single short phrase

### Autosave Indicator

| Property | Value |
|----------|-------|
| Position | `fixed top-4 right-4 z-50` |
| Style | `bg-background/95 backdrop-blur-sm border border-border/50 rounded-md px-2.5 py-1 shadow-sm` |
| Text | `text-xs` |
| Icon size | `w-3 h-3` |
| States | Saving (spinner), Saved (check, success color), Error (alert, destructive color) |

### Form Layout

| Property | Value |
|----------|-------|
| Container | `container max-w-6xl mx-auto px-4 py-6` |
| Card structure | `Card` > `CardContent` with `pt-4 space-y-4` |
| Section dividers | `border-t border-border` |
| Side-by-side fields | `grid grid-cols-2 gap-4` |
| Labels | `text-sm`, optional `font-medium` |

### Interactive Card Lists

- **Base:** `border border-border bg-card cursor-pointer transition-ui`
- **Hover:** `hover:bg-accent/50`
- **Horizontal scroll:** `flex gap-3 overflow-x-auto pb-2 scrollbar-hide`
- **Fade overlay:** `absolute right-0 top-0 bottom-2 w-16 bg-gradient-to-l from-background to-transparent`

---

## Transitions

| Context | Duration | Class |
|---------|----------|-------|
| UI feedback (buttons, hovers, toggles) | 20ms ease-in | `transition-ui` |
| Color changes | Default Tailwind | `transition-colors` |
| State changes (modals, drawers) | 150ms ease | `transition-state` |
| Page transitions | 300ms ease-in-out | — |
| Loading shimmer | 1.5s linear | — |
| Spinners | — | `animate-spin` |
| Skeleton loaders | — | `animate-pulse` |

UI feedback should feel instant. Users notice speed, not animation.

---

## Text Rules

### Prefer

- Badge with number over written-out count
- Color coding over status labels
- Hover tooltip over always-visible helper text
- Visual hierarchy (size, weight, color) over more words

### Avoid

- Always-visible helper text
- Redundant labels when badge shows count
- Long descriptions (use tooltips)
- Multiple text sizes in same area
- Text that repeats visual information

### When Text is Needed

- **Subtle subtitle:** Only for complex sections
- **Hover tooltip:** `HelpCircle` icon for explanations
- **Minimal labels:** Only when icon isn't self-explanatory
- **Required fields:** Asterisk (*), error on validation only

---

## Predictive UI Patterns

**Notifications:** Badge with count on nav item + urgent badge on cards. Not "You have 3 pending requests" text.

**Setup prompts:** Warning icon + tooltip on hover. Not always-visible instruction text.

**Validation:** Error appears on submit/blur only. Tooltip explains why if needed.

**Defaults:** Pre-fill based on previous entries and context. Reduce decisions.

---

## Anti-Patterns

- Text labels where visuals suffice
- Always-visible helper text (use hover tooltips)
- Different background colors for different areas (unified surface)
- Shadows for card distinction (use borders)
- Borders on inputs (borderless with beige fill)
- Equal button padding (use 1.5:1 ratio)
- Mixed border radius (use systematic scale)
- Slow transitions for UI feedback (20ms, not 300ms)
- Emojis (Lucide icons only)

---

**Version:** 3.0
**Last Updated:** 2026-02-20
**Companion:** [Brand Essence](./brand-essence.md) — colors, typography, brand identity
