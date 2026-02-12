# Traverum Dashboard Design Principles
## Lightweight Reference for Implementation

**Philosophy:** "Nothing unnecessary, everything functional" - A predictive, minimal dashboard that knows what users need before they ask.

---

## Core Principles

### 1. Visual Over Text
- **Users SEE, not read** - Visual indicators (badges, icons, colors) communicate state
- **Icon with count:** Bell icon + red dot (not "You have notifications" text)
- **Color coding:** Status colors communicate immediately
- **Minimize labels** - Text appears only when essential or on hover

### 2. Hover Tooltips for Explanations
- **"?" icon** with tooltip for explanations (not always-visible helper text)
- **Hover to reveal** - Information appears on demand
- **Subtle subtitles** only when absolutely necessary
- **Be careful not to clutter** - Every text element must justify its space

### 2a. Icons Only - NO EMOJIS
- **Lucide icons only** - Use `lucide-react` for all icons
- **NO EMOJIS EVER** - Especially not ✨ or any other emoji
- **Professional appearance** - Icons maintain consistent style and sizing
- **Empty states:** Minimal cognitive load. Text only — no icons for passive/negative empty states (e.g., "No X yet"). Icons draw attention; avoid them when nothing requires action.

### 3. Warm White Background (Unified)
- **Background:** `#FEFCF9` (HSL: 40 20% 99%) - warm white, almost pure white
- **Why:** Reduces eye strain, creates cozy professional atmosphere
- **Unified Background:** Same warm white everywhere (`bg-background` or `bg-background-alt`)
  - Cards: Same warm white (`bg-card`)
  - Sidebar: Same warm white (`bg-sidebar-background`)
  - Header: Same warm white
  - Page: Same warm white (`bg-background-alt` for main content areas)
- **Distinction:** Subtle borders (like Notion) instead of shadows or color differences
- **Border:** `rgba(55, 53, 47, 0.09)` (very subtle, creates separation)
- **No background color differentiation** - borders create all visual separation

### 4. Muted "Old Money" Color Palette
- **Primary Accent:** Traverum teal `#0D9488` (HSL: 173 79% 26%) - ONLY vibrant color, used sparingly
- **Semantic Colors (All Muted):**
  - Success: `#6B8E6B` (HSL: 120 20% 55%) - muted sage green
  - Warning: `#C9A961` (HSL: 40 45% 55%) - muted gold
  - Error/Destructive: `#B8866B` (HSL: 20 45% 60%) - muted terracotta
  - Info: `#7A9CC6` (HSL: 210 35% 60%) - muted blue-gray
- **Semantic Color Usage:**
  - **Status indicators:** Small dots (`w-2 h-2 rounded-full`) with semantic colors
  - **Tinted backgrounds:** Use opacity variants like `bg-success/10`, `bg-warning/10` for subtle status indication
  - **Text colors:** Direct semantic colors for status text (e.g., `text-[#6B8E6B]` for success)
- **No bright, saturated colors** - Everything else is warm grays/beiges
- **"Old money" aesthetic** - Sophisticated, timeless, understated

### 5. 8px Grid System
- **Base unit:** 8px (all spacing multiples of 8)
- **Half-steps:** 4px for fine-tuning only
- **No arbitrary values** - Systematic spacing eliminates guesswork

### 6. Fast Transitions
- **UI feedback:** 20ms ease-in (`transition-ui` class) - buttons, hovers, toggles, card interactions
- **Color transitions:** `transition-colors` for hover states (default Tailwind timing)
- **State changes:** 150ms ease (`transition-state` class) - modals, drawers
- **Page transitions:** 300ms ease-in-out
- **Feels instant** - Users notice speed, not animation
- **Common pattern:** `transition-ui hover:bg-accent/50` for interactive cards

### 7. Borderless Inputs
- **No borders** - Background color differentiation
- **Background:** `rgba(242, 241, 238, 0.6)` - subtle beige tint
- **Height:** `h-8` (32px) for standard inputs, `h-9` (36px) for selects
- **Focus:** Inset box-shadow or ring (not outline)
- **Select inputs:** Same borderless style with `bg-[rgba(242,241,238,0.6)]`
- **Status selects:** Can use tinted backgrounds like `bg-success/10 text-success` for status indicators
- **Cleaner aesthetic** - Less visual noise

### 8. Compact Component Sizes
- **Buttons:** 
  - Default: `h-7` (28px), `px-3 py-1` (4px 12px padding - 1.5:1 ratio), `rounded-sm` (3px)
  - Small: `h-7` (28px)
  - Large: `h-8` (32px)
- **Inputs:** 
  - Standard: `h-8` (32px), `rounded-sm` (3px), borderless
  - Selects: `h-9` (36px), borderless with beige background
- **Cards:** 
  - Padding: `p-3` (12px) or `p-4` (16px) or `pt-4` for top padding
  - Radius: `rounded-sm` (4px) or implicit from Card component
  - Border: `border border-border` (subtle Notion-style)
- **Tabs:** `h-9` (36px), `text-sm` labels
- **Sidebar:** 224px width
- **Header:** 45px height (if applicable)
- **Container:** `container max-w-6xl mx-auto px-4 py-6` for main content

### 9. Border System (Notion-Style)
- **Cards:** `border border-border` (1px solid rgba(55, 53, 47, 0.09)) - subtle border for distinction
- **Card sections:** `border-t border-border` for section dividers within cards
- **Sidebar:** Right border `border-r border-border` (subtle separation)
- **Header:** Bottom border `border-b border-border` (subtle separation)
- **No shadows for distinction** - Borders create separation (like Notion)
- **Unified background** - Same warm white everywhere, borders provide distinction
- **Hover effects:** `hover:bg-accent/50` for cards (subtle background change, not shadow)
- **Modals:** Still use shadows (for elevation, not distinction)
- **Autosave indicator:** `border border-border/50` with backdrop blur for floating elements

### 10. Systematic Border Radius
- **3px (`rounded-sm`):** Buttons, inputs, standard form elements
- **4px (`rounded` or implicit):** Cards, containers
- **6px (`rounded-md`):** Autosave indicators, floating elements
- **8px (`rounded-lg`):** Modals, larger containers
- **Full (`rounded-full`):** Status dots (`w-2 h-2`), pill badges, circular elements
- **Never mix randomly** - Use systematic scale

### 11. Predictive UI
- **Show what users need before they ask**
- **Context-aware suggestions** - Based on current page and data
- **Pattern-based recommendations** - Learn from user behavior
- **Proactive notifications** - Subtle banners, not intrusive modals
- **Smart defaults** - Pre-fill based on previous entries

### 12. Minimal Information Architecture
- **Remove everything that doesn't serve a function**
- **Hide complexity until needed** - Progressive disclosure
- **Show only what's relevant now**
- **Priority-based layout:**
  - Primary: What needs attention (top-left)
  - Secondary: Quick metrics (top-right)
  - Tertiary: Everything else (below)

---

## Component Specifications

### Buttons
- **Height:** 28px (medium), 24px (small), 32px (large)
- **Padding:** `4px 12px` (1.5:1 ratio, not equal)
- **Radius:** 3px
- **Primary:** Traverum teal `#0D9488`
- **Transition:** 20ms ease-in
- **No scale animations** - Color change only

### Inputs
- **Height:** `h-8` (32px) for standard inputs, `h-9` (36px) for selects
- **Padding:** `4px 10px` (varies by component)
- **Radius:** `rounded-sm` (3px)
- **Border:** None (borderless)
- **Background:** `bg-[rgba(242,241,238,0.6)]` - subtle beige tint
- **Focus:** Ring or inset box-shadow (component-dependent)
- **Select inputs:** Same borderless style, can have status-specific backgrounds like `bg-success/10 text-success`

### Cards
- **Padding:** `p-3` (12px), `p-4` (16px), or `pt-4` (top padding) with `space-y-4` for content
- **Radius:** `rounded-sm` (4px) or implicit from Card component
- **Border:** `border border-border` (1px solid rgba(55, 53, 47, 0.09)) - subtle border, like Notion
- **Shadow:** None (border creates distinction)
- **Background:** Same warm white as page (`bg-card` = `#FEFCF9`)
- **Hover:** `hover:bg-accent/50` - subtle background change on interactive cards
- **Interactive cards:** `cursor-pointer transition-ui hover:bg-accent/50`
- **Section dividers:** `border-t border-border` for internal sections

### Navigation
- **Sidebar width:** 224px
- **Sidebar background:** Same warm white as page (`#FEFCF9` or `#FAF8F5`)
- **Sidebar border:** Right border `1px solid rgba(55, 53, 47, 0.09)` (subtle separation)
- **Item height:** 28px
- **Item padding:** `4px 10px`
- **Item radius:** 8px (hover)
- **Icon size:** 22px
- **Text:** `text-sm font-medium`
- **Badge:** Right-aligned, subtle background

### Badges/Indicators
- **Visual first** - Number/icon prominent
- **Text secondary** - Only if needed
- **Colors:** Muted semantic colors (not bright)
  - Use semantic classes: `bg-success`, `bg-warning`, `bg-destructive`
  - Or direct hex: `text-[#6B8E6B]` for success, `text-[#B8866B]` for error
- **Status dots:** `w-2 h-2 rounded-full` with semantic colors (`bg-success`, `bg-warning`, etc.)
- **Radius:** `rounded-full` (pills), `rounded-sm` (badges)
- **Padding:** `px-1.5 py-0.5` or `px-2 py-1` depending on size
- **Status badges:** Positioned absolutely on cards (`absolute top-2 right-2`)

---

## Text Minimization Rules

### Always Prefer:
- ✅ Badge with number and one word explanation (red "3 requests" badge)
- ✅ Color coding (status colors)
- ✅ Hover tooltip ("?" icon)
- ✅ Visual hierarchy (size, weight, color)

### Avoid:
- ❌ Always-visible helper text
- ❌ Redundant labels ("Pending Requests" when badge shows count)
- ❌ Long descriptions (use tooltips)
- ❌ Multiple text sizes in same area
- ❌ Text that repeats visual information

### When Text is Needed:
- **Subtle subtitle:** Only for complex sections
- **Hover tooltip:** For explanations
- **Minimal labels:** When icon isn't self-explanatory
- **Be careful not to clutter** - Every word must justify its space

---

## Color System Quick Reference

```css
/* Backgrounds (All Same Warm White) */
--background: 40 20% 99%; /* #FEFCF9 - HSL format for Tailwind */
--background-alt: 40 20% 99%; /* Same warm white */
--card: 40 20% 99%; /* Same warm white */
--sidebar-background: 40 20% 99%; /* Same warm white */

/* Text (Warm Gray) */
--foreground: 0 0% 22%; /* rgb(55, 53, 47) */
--muted-foreground: 0 0% 40%; /* rgba(55, 53, 47, 0.4) */
/* Custom utilities: */
.text-secondary: rgba(55, 53, 47, 0.65);
.text-muted: rgba(55, 53, 47, 0.4);

/* Primary Accent (ONLY Vibrant) */
--primary: 173 79% 26%; /* #0D9488 - Traverum teal (HSL) */

/* Muted Semantic Colors (HSL format) */
--success: 120 20% 55%; /* #6B8E6B - muted sage green */
--warning: 40 45% 55%; /* #C9A961 - muted gold */
--destructive: 20 45% 60%; /* #B8866B - muted terracotta */
--info: 210 35% 60%; /* #7A9CC6 - muted blue-gray */

/* Semantic Color Usage */
bg-success / bg-warning / bg-destructive /* Full color backgrounds */
bg-success/10 / bg-warning/10 /* Tinted backgrounds (10% opacity) */
text-[#6B8E6B] / text-[#B8866B] /* Direct hex for status text */

/* Borders for Distinction (Like Notion) */
--border: 0 0% 22% / 0.09; /* rgba(55, 53, 47, 0.09) */
border-border /* Tailwind class for subtle borders */

/* Input Background */
bg-[rgba(242,241,238,0.6)] /* Subtle beige tint for borderless inputs */
```

---

## Spacing Quick Reference

```
4px (half-step), 8px, 12px, 16px, 24px, 32px, 48px, 64px
Always multiples of 8px (or 4px for fine-tuning)

Common Patterns:
- gap-2 (8px) - Small gaps between related items
- gap-3 (12px) - Medium gaps (card grids, horizontal lists)
- gap-4 (16px) - Standard gaps (form fields, sections)
- space-y-4 (16px vertical) - Standard vertical spacing in cards
- p-3 (12px) - Compact card padding
- p-4 (16px) - Standard card padding
- px-4 py-6 - Container padding (16px horizontal, 24px vertical)
```

---

## Animation Quick Reference

```
UI Feedback: 20ms ease-in (transition-ui class)
Color Transitions: transition-colors (default Tailwind)
State Changes: 150ms ease (transition-state class)
Page Transitions: 300ms ease-in-out
Loading: 1.5s linear (shimmer)

Common Patterns:
- transition-ui hover:bg-accent/50 (interactive cards)
- transition-colors (text color changes on hover)
- animate-spin (loading spinners)
- animate-pulse (skeleton loaders)
```

---

## Anti-Patterns to Avoid

- ❌ Pure white background → ✅ Warm white/beige
- ❌ Bright colors → ✅ Muted "old money" palette
- ❌ Text labels everywhere → ✅ Visual indicators
- ❌ Always-visible helper text → ✅ Hover tooltips
- ❌ "3 pending requests" text → ✅ Red badge "3"
- ❌ 300ms transitions → ✅ 20ms for UI feedback
- ❌ Equal button padding → ✅ 1.5:1 ratio
- ❌ Mixed border radius → ✅ Systematic scale
- ❌ Heavy shadows → ✅ Subtle borders for distinction (Notion-style)
- ❌ Different background colors → ✅ Unified warm white everywhere
- ❌ Shadows for cards → ✅ Borders create separation
- ❌ Border on inputs → ✅ Borderless with inset shadow
- ❌ **EMOJIS (especially ✨ star emoji)** → ✅ **Lucide icons only - NO EMOJIS EVER**

---

## Predictive UI Examples

**Instead of:**
- "You have 3 pending requests" (text)

**Show:**
- Badge with count on Requests nav item
- Urgent badge (`bg-destructive`) on request cards
- Visual indicator, not text description

**Instead of:**
- "Connect your Stripe account to receive payments" (always visible)

**Show:**
- Warning icon + "?" tooltip (`HelpCircle` icon)
- Hover reveals explanation
- Action button is primary communication

**Instead of:**
- "This field is required" (always visible)

**Show:**
- Asterisk (*) for required fields
- Error appears only on validation
- Tooltip explains why if needed

**Status Indicators:**
- Small dots (`w-2 h-2 rounded-full`) with semantic colors
- Status selects with tinted backgrounds (`bg-success/10 text-success`)
- Autosave indicator: Fixed position, backdrop blur, subtle border
- Character counts: Color-coded (`text-[#6B8E6B]` for valid, `text-[#B8866B]` for invalid)

---

## Implementation Checklist

When building any component:

1. ✅ **Background:** Warm white (`bg-background` or `bg-background-alt` = `#FEFCF9`)
2. ✅ **Colors:** Muted "old money" palette (teal only vibrant)
3. ✅ **Spacing:** 8px grid system (`gap-3`, `space-y-4`, `p-4`)
4. ✅ **Transitions:** `transition-ui` (20ms) for UI feedback, `transition-colors` for hovers
5. ✅ **Visual over text:** Badges, icons, status dots, colors first
6. ✅ **Tooltips:** Hover for explanations (`HelpCircle` icon with tooltip)
7. ✅ **Minimal text:** Only when essential (`text-sm` labels, `text-xs` helpers)
8. ✅ **Borderless inputs:** `bg-[rgba(242,241,238,0.6)]`, `h-8` or `h-9`
9. ✅ **Compact sizes:** `h-7` buttons, `h-8` inputs, `h-9` selects/tabs
10. ✅ **Predictive:** Show what user needs before they ask
11. ✅ **Cards:** `border border-border`, `p-3` or `p-4`, `hover:bg-accent/50`
12. ✅ **Status indicators:** Small dots (`w-2 h-2 rounded-full`) with semantic colors
13. ✅ **Container:** `container max-w-6xl mx-auto px-4 py-6` for main content
14. ✅ **Autosave:** Fixed position, backdrop blur, subtle border, `rounded-md`
15. ✅ **NO EMOJIS:** Use Lucide icons only - absolutely no emojis, especially not ✨
16. ✅ **Empty states:** Minimal cognitive load — text only for passive/negative states. No icons (they draw attention). No subtitles.

---

## Specific Component Patterns (From Experience Dashboard)

### Autosave Indicator
- **Position:** Fixed top-right (`fixed top-4 right-4 z-50`)
- **Style:** `bg-background/95 backdrop-blur-sm border border-border/50 rounded-md px-2.5 py-1 shadow-sm`
- **Text:** `text-xs`
- **Icons:** `w-3 h-3` with semantic colors
- **States:** Saving (spinner), Saved (check icon `#6B8E6B`), Error (alert icon `#B8866B`)

### Tabs
- **Height:** `h-9` (36px)
- **Labels:** `text-sm`
- **Container:** `flex-1` width, `space-y-4` for content spacing
- **Content:** Cards with `border-border`, `pt-4 space-y-4` padding

### Status Select/Dropdown
- **Height:** `h-9` (36px)
- **Background:** `bg-[rgba(242,241,238,0.6)]` (borderless)
- **Status variants:**
  - Active: `bg-success/10 text-success border-success/20`
  - Draft: `bg-warning/10 text-warning border-warning/20`
  - Archived: `bg-muted text-muted-foreground`
- **Status dot:** `w-2 h-2 rounded-full` with semantic color

### Form Layout
- **Container:** `container max-w-6xl mx-auto px-4 py-6`
- **Card structure:** `Card` with `border-border`, `CardContent` with `pt-4 space-y-4`
- **Section dividers:** `border-t border-border` between sections
- **Grid layouts:** `grid grid-cols-2 gap-4` for side-by-side fields
- **Labels:** `text-sm` with optional `font-medium` for emphasis

### Interactive Cards
- **Base:** `border border-border bg-card cursor-pointer transition-ui`
- **Hover:** `hover:bg-accent/50`
- **Horizontal scroll:** `flex gap-3 overflow-x-auto pb-2 scrollbar-hide`
- **Fade overlay:** `absolute right-0 top-0 bottom-2 w-16 bg-gradient-to-l from-background to-transparent`

### Status Badges on Cards
- **Position:** `absolute top-2 right-2`
- **Size:** `text-xs font-medium`
- **Colors:** `bg-success`, `bg-warning`, `bg-muted-foreground`
- **Text:** Capitalized status (`status.charAt(0).toUpperCase() + status.slice(1)`)

### Character Counters
- **Position:** Next to label, `text-xs`
- **Valid:** `text-[#6B8E6B]` (success color)
- **Invalid:** `text-[#B8866B]` (error color)
- **Format:** `{count}/50` or similar

### Empty States
- **Minimal cognitive load** — for passive/negative states (e.g., "No X yet"), use text only. No icons — they draw attention when nothing requires action.
- **Card:** `border border-border`
- **Content:** `p-6 text-center`
- **Text:** `text-sm text-muted-foreground` — single short phrase only

---

**Version:** 2.0  
**Last Updated:** 2025-01-27  
**Use Case:** Reference for design implementation prompts  
**Based on:** Actual Experience Dashboard implementation
