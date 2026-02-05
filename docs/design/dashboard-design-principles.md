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

### 3. Warm White/Beige Background
- **Background:** `#FEFCF9` or `#FAF8F5` (almost pure white, slightly warmer)
- **Why:** Reduces eye strain, creates cozy professional atmosphere
- **Cards:** Same warm white background (not separate color)
- **Sidebar:** Same warm white background (not separate color)
- **Header:** Same warm white background (not separate color)
- **Distinction:** Subtle borders (like Notion) instead of shadows or color differences
- **Border:** `rgba(55, 53, 47, 0.09)` (very subtle, creates separation)

### 4. Muted "Old Money" Color Palette
- **Primary Accent:** Traverum teal `#0D9488` (ONLY vibrant color, used sparingly)
- **Semantic Colors (All Muted):**
  - Success: `#6B8E6B` (muted sage green)
  - Warning: `#C9A961` (muted gold)
  - Error: `#B8866B` (muted terracotta)
  - Info: `#7A9CC6` (muted blue-gray)
- **No bright, saturated colors** - Everything else is warm grays/beiges
- **"Old money" aesthetic** - Sophisticated, timeless, understated

### 5. 8px Grid System
- **Base unit:** 8px (all spacing multiples of 8)
- **Half-steps:** 4px for fine-tuning only
- **No arbitrary values** - Systematic spacing eliminates guesswork

### 6. 20ms Transitions
- **UI feedback:** 20ms ease-in (buttons, hovers, toggles)
- **State changes:** 150ms ease (modals, drawers)
- **Page transitions:** 300ms ease-in-out
- **Feels instant** - Users notice speed, not animation

### 7. Borderless Inputs
- **No borders** - Background color differentiation
- **Focus:** Inset box-shadow (not outline)
- **Cleaner aesthetic** - Less visual noise

### 8. Compact Component Sizes
- **Buttons:** 28px height, 3px radius, `4px 12px` padding
- **Inputs:** 32px height, 3px radius, borderless
- **Cards:** 16px padding, 4px radius
- **Sidebar:** 224px width
- **Header:** 45px height

### 9. Border System (Notion-Style)
- **Cards:** `1px solid rgba(55, 53, 47, 0.09)` (subtle border for distinction)
- **Sidebar:** Right border `1px solid rgba(55, 53, 47, 0.09)` (subtle separation)
- **Header:** Bottom border `1px solid rgba(55, 53, 47, 0.09)` (subtle separation)
- **No shadows for distinction** - Borders create separation (like Notion)
- **Unified background** - Same warm white everywhere, borders provide distinction
- **Modals:** Still use shadows (for elevation, not distinction)

### 10. Systematic Border Radius
- **3px:** Buttons, inputs
- **4px:** Cards
- **8px:** Modals
- **14px:** Pills/tags
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
- **Height:** 32px
- **Padding:** `4px 10px`
- **Radius:** 3px
- **Border:** None (borderless)
- **Background:** `rgba(242, 241, 238, 0.6)`
- **Focus:** Inset box-shadow `inset 0 0 0 1px rgba(35, 131, 226, 0.57)`

### Cards
- **Padding:** 16px (not 24px)
- **Radius:** 4px
- **Border:** `1px solid rgba(55, 53, 47, 0.09)` (subtle border, like Notion)
- **Shadow:** None (border creates distinction)
- **Background:** Same warm white as page (`#FEFCF9` or `#FAF8F5`)

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
- **Radius:** 14px (pill) or 4px (badge)
- **Padding:** `4px 8px`

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
--bg-page: #FEFCF9; /* almost pure white, slightly warmer */
--bg-sidebar: #FEFCF9; /* same as page */
--bg-card: #FEFCF9; /* same as page */
--bg-header: #FEFCF9; /* same as page */

/* Borders for Distinction (Like Notion) */
--border-card: rgba(55, 53, 47, 0.09); /* subtle card border */
--border-sidebar: rgba(55, 53, 47, 0.09); /* right border for sidebar */
--border-header: rgba(55, 53, 47, 0.09); /* bottom border for header */

/* Text (Warm Gray) */
--text-primary: rgb(55, 53, 47);
--text-secondary: rgba(55, 53, 47, 0.65);
--text-muted: rgba(55, 53, 47, 0.4);

/* Primary Accent (ONLY Vibrant) */
--accent-primary: #0D9488; /* Traverum teal */

/* Muted Semantic Colors */
--success: #6B8E6B; /* sage green */
--warning: #C9A961; /* muted gold */
--error: #B8866B; /* terracotta */
--info: #7A9CC6; /* blue-gray */
```

---

## Spacing Quick Reference

```
4px (half-step), 8px, 12px, 16px, 24px, 32px, 48px, 64px
Always multiples of 8px (or 4px for fine-tuning)
```

---

## Animation Quick Reference

```
UI Feedback: 20ms ease-in
State Changes: 150ms ease
Page Transitions: 300ms ease-in-out
Loading: 1.5s linear (shimmer)
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

---

## Predictive UI Examples

**Instead of:**
- "You have 3 pending requests" (text)

**Show:**
- Red badge with "3" on Requests nav item
- Icon changes color when urgent
- Visual indicator, not text description

**Instead of:**
- "Connect your Stripe account to receive payments" (always visible)

**Show:**
- Warning icon + "?" tooltip
- Hover reveals explanation
- Action button is primary communication

**Instead of:**
- "This field is required" (always visible)

**Show:**
- Asterisk (*) for required fields
- Error appears only on validation
- Tooltip explains why if needed

---

## Implementation Checklist

When building any component:

1. ✅ **Background:** Warm white/beige (`#FEFCF9`)
2. ✅ **Colors:** Muted "old money" palette (teal only vibrant)
3. ✅ **Spacing:** 8px grid system
4. ✅ **Transitions:** 20ms for UI feedback
5. ✅ **Visual over text:** Badges, icons, colors first
6. ✅ **Tooltips:** Hover for explanations
7. ✅ **Minimal text:** Only when essential
8. ✅ **Borderless inputs:** Inset focus shadow
9. ✅ **Compact sizes:** 28px buttons, 32px inputs
10. ✅ **Predictive:** Show what user needs before they ask

---

**Version:** 1.0  
**Last Updated:** 2025-01-24  
**Use Case:** Reference for design implementation prompts
