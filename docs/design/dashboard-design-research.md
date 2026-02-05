# Modern SaaS Dashboard Design Research
## Traverum Supplier Dashboard - Design Best Practices & Implementation Guide

**Purpose:** Comprehensive research on modern SaaS dashboard design patterns, visual hierarchies, components, and UX principles to create a professional, intuitive supplier dashboard that avoids "vibe coded" aesthetics.

**Target:** Traverum's supplier dashboard for experience providers and hotels managing bookings, experiences, and multi-organization workflows.

---

## Executive Summary

Modern SaaS dashboards follow specific design principles that create professional, trustworthy interfaces. This research synthesizes industry best practices from leading platforms (Stripe, Linear, Vercel, Notion, GitHub) and applies them to Traverum's unique multi-organization, booking-focused context.

**Notion-Inspired Minimalism:** Notion's design philosophy—"nothing unnecessary, everything functional"—aligns perfectly with Traverum's goal of a predictive, minimal dashboard. Key Notion principles integrated:
- **8px Grid System:** Systematic spacing eliminates guesswork
- **20ms Transitions:** Ultra-fast interactions feel instant and responsive
- **Borderless Inputs:** Cleaner aesthetic, inset focus shadows
- **Warm Gray Palette:** Subtle, professional, reduces visual noise
- **Minimal Shadows:** Layered rgba shadows (opacity < 0.15) for depth without heaviness
- **Compact Radius:** 3-4px border radius for compact, purposeful feel
- **Predictive UI:** Show what users need before they ask

**Key Findings:**
- **Visual Hierarchy:** Information density with clear scanning patterns
- **Component Library:** Consistent, purpose-built components over generic UI kits
- **Color System:** Warm gray palette (Notion-inspired) with strategic accent usage
- **Spacing & Typography:** 8px grid system, generous whitespace, clear type scale
- **Micro-interactions:** 20ms transitions (Notion-speed) for instant feedback
- **Empty States:** Contextual, action-oriented guidance
- **Navigation:** Persistent, predictable patterns
- **Predictive Design:** Proactive suggestions, context-aware actions

---

## 1. Visual Hierarchy Principles

### 1.1 Information Architecture

**F-Pattern Scanning:**
- Users scan in F-pattern: horizontal top, shorter horizontal middle, vertical left
- **Application:** 
  - Primary actions in top-right
  - Navigation in left sidebar
  - Content flows top-to-bottom, left-to-right
  - Most important metrics in top-left of content area

**Z-Pattern for Landing:**
- Empty states and onboarding follow Z-pattern
- **Application:**
  - Logo/brand (top-left)
  - Primary CTA (top-right)
  - Secondary info (bottom-left)
  - Secondary action (bottom-right)

### 1.2 Visual Weight Distribution

**Hierarchy Levels:**
1. **Primary:** Largest, boldest, highest contrast (page titles, primary CTAs)
2. **Secondary:** Medium weight (section headers, cards)
3. **Tertiary:** Lighter weight (body text, metadata)
4. **Quaternary:** Subtle (hints, timestamps, labels)

**Size Scale (Recommended):**
- Page Title: `text-3xl` (30px) / `font-semibold` (600)
- Section Header: `text-xl` (20px) / `font-medium` (500)
- Card Title: `text-lg` (18px) / `font-medium` (500)
- Body Text: `text-base` (16px) / `font-normal` (400)
- Metadata: `text-sm` (14px) / `font-normal` (400)
- Labels: `text-xs` (12px) / `font-medium` (500)

**Contrast Ratios (WCAG AA minimum):**
- Primary text: 4.5:1 against background
- Secondary text: 3:1 against background
- Interactive elements: 3:1 against background
- Focus states: 3:1 with 2px outline

### 1.3 Content Grouping

**Proximity Principle:**
- Related items grouped together (8-16px spacing)
- Unrelated items separated (24-32px spacing)
- Sections separated by 48px+ vertical spacing

**Card-Based Layout (Notion-Style with Borders):**
- Use cards for distinct content blocks
- **Card padding:** 16px (Notion standard - more compact than typical 24px)
- **Card border:** `1px solid rgba(55, 53, 47, 0.09)` (subtle border for distinction)
- **Card shadow:** None (border creates distinction, not shadow)
- **Card radius:** 4px (compact, purposeful - not playful 8px)
- **Card background:** Same warm white as page (`#FEFCF9` or `#FAF8F5`)
- **Hover:** Very subtle background change `rgba(55, 53, 47, 0.04)` (optional)
- **Notion-style:** Border creates separation, unified background color

**Grid Systems:**
- 12-column grid (desktop)
- 4-column grid (tablet)
- Single column (mobile)
- Gutter: 24px (desktop), 16px (tablet/mobile)

---

## 2. Component Design Patterns

### 2.1 Navigation Components

**Text Minimization Principle:**
- **Icons first, text secondary** - Navigation items show icon prominently
- **Hover tooltips** - Full text appears on hover (not always visible)
- **Badges for counts** - Red dot or number badge (not "3 pending requests" text)
- **Visual indicators** - Colors, icons, badges communicate state
- **Subtle labels only** - Text appears only when space allows or on hover

**Sidebar Navigation (Notion-Style with Borders):**
- **Width:** 224px (Notion standard - more compact than typical 256px)
- **Background:** Same warm white as page (`#FEFCF9` or `#FAF8F5`) - unified color
- **Border:** Right border `1px solid rgba(55, 53, 47, 0.09)` (subtle separation, like Notion)
- **Padding:** 12px 8px (vertical horizontal)
- **Item Spacing:** 4px vertical between items
- **Item Height:** 28px (Notion compact)
- **Item Padding:** 4px 10px (vertical horizontal)
- **Item Radius:** 8px (larger than button radius for friendlier feel)
- **Active State:** 
  - Background: `rgba(55, 53, 47, 0.08)` (hover background, not accent)
  - Text: `text-primary` (same as inactive)
  - No left border (cleaner, more minimal)
- **Hover State:** `rgba(55, 53, 47, 0.08)` (same as active - subtle)
- **Icon Size:** 22px (Notion standard, slightly larger than typical)
- **Icon Position:** Left-aligned, centered vertically
- **Text:** `text-sm` (14px), `font-medium` (500)
- **Badge/Count:** Right-aligned, subtle background `rgba(135, 131, 120, 0.15)`
- **Transition:** `20ms ease-in` (instant feedback)

**Top Navigation (Header - Notion-Style with Borders):**
- **Height:** 45px (Notion compact - not typical 64px)
- **Background:** Same warm white as page (`#FEFCF9` or `#FAF8F5`) - unified color
- **Border:** Bottom border `1px solid rgba(55, 53, 47, 0.09)` (subtle separation, like Notion)
- **Padding:** 0 12px (horizontal only, vertical auto)
- **Content Layout:**
  - Left: Logo/brand (optional) or page title
  - Center: Breadcrumbs or context (if needed)
  - Right: Account dropdown, notifications, actions
- **Sticky:** Yes, `sticky top-0 z-50`
- **Shadow:** None (border provides separation, not shadow)
- **Items:** All 28px height (matches sidebar items)

**Account Dropdown (Notion-Style):**
- **Trigger:** User avatar or email, right-aligned, 28px height
- **Dropdown Width:** 180px minimum, 320px maximum
- **Padding:** 6px 0 (vertical horizontal)
- **Item Height:** Auto (28px minimum)
- **Item Padding:** 4px 14px (vertical horizontal)
- **Item Margin:** 0 4px (horizontal margin for rounded hover)
- **Item Radius:** 3px (hover background creates rounded corners)
- **Section Separators:** 1px border `rgba(55, 53, 47, 0.09)`, margin 6px 14px
- **Icon Size:** 16px
- **Hover:** `rgba(55, 53, 47, 0.08)` (subtle, not accent)
- **Shadow:** Layered rgba (three levels for depth)
- **Transition:** `20ms ease-in`

### 2.2 Button Patterns

**Primary Button (Notion-Style):**
- **Background:** Primary color (`rgb(46, 170, 220)` - Notion blue, or Traverum teal)
- **Text:** White
- **Padding:** 4px 12px (Notion ratio: 1.5:1 horizontal-to-vertical, not 2:1)
- **Border Radius:** 3px (compact, purposeful - not playful)
- **Font:** `font-medium`, `text-sm` (14px)
- **Height:** 28px (Notion standard - more compact than typical 40px)
- **Transition:** `20ms ease-in` (ultra-fast, feels instant)
- **Hover:** Slightly darker: `rgb(35, 150, 200)`
- **Active:** Pressed: `rgb(30, 130, 180)`
- **Disabled:** `opacity: 0.4` + `cursor: not-allowed`
- **Loading:** Spinner replaces text, same size

**Why 20ms Transitions:**
- Feels instant and responsive
- No perceived delay
- Professional, polished feel
- Users notice speed, not animation

**Secondary Button:**
- **Background:** Transparent
- **Border:** 1px solid `border`
- **Text:** `text-foreground`
- **Hover:** `bg-muted`
- **Same dimensions as primary**

**Ghost Button:**
- **Background:** Transparent
- **Text:** `text-muted-foreground`
- **Hover:** `bg-muted`
- **Used for:** Less important actions, icon-only buttons

**Button Sizes (Notion Scale):**
- **Small:** 24px height, `text-xs` (12px), padding 0 6px, radius 3px
- **Medium:** 28px height, `text-sm` (14px), padding 4px 8px, radius 3px (default)
- **Large:** 32px height, `text-sm` (14px), padding 6px 12px, radius 4px
- **Icon:** 28px × 28px square (matches medium button), icon centered

**Padding Ratio Rule:**
- Always use 1.5:1 to 2:1 horizontal-to-vertical ratio
- Never equal padding (looks amateur)
- Example: 4px vertical → 6-8px horizontal

**Button Placement:**
- **Primary CTA:** Top-right of relevant section
- **Form Actions:** Bottom-right, primary on right
- **Card Actions:** Bottom of card, right-aligned
- **Inline Actions:** Right of related content

### 2.3 Card Components

**Standard Card (Notion-Style with Borders):**
- **Padding:** 16px (Notion standard - more compact)
- **Border:** `1px solid rgba(55, 53, 47, 0.09)` (subtle border for distinction)
- **Radius:** 4px (compact, purposeful)
- **Background:** Same warm white as page (`#FEFCF9` or `#FAF8F5`) - unified color
- **Shadow:** None (border creates distinction, not shadow)
- **Hover:** Very subtle background change `rgba(55, 53, 47, 0.04)` (optional)

**Why Borders Instead of Shadows:**
- Border creates subtle separation (Notion-style)
- Unified background color everywhere
- Cleaner, more minimal aesthetic
- No shadow layers needed for distinction
- Opacity stays below 0.15 (not heavy)
- More sophisticated than single shadow
- Creates depth without visual weight

**Card Header:**
- **Padding:** 24px 24px 16px 24px
- **Border Bottom:** 1px solid `border` (if body content exists)
- **Title:** `text-lg font-semibold`
- **Subtitle:** `text-sm text-muted-foreground`

**Card Content:**
- **Padding:** 16px 24px 24px 24px (or 24px if no header)

**Card Footer:**
- **Padding:** 16px 24px 24px 24px
- **Border Top:** 1px solid `border`
- **Actions:** Right-aligned button group

**Stat Card (Dashboard Metrics - Visual First):**
- **Number:** `text-3xl font-semibold` (large, prominent)
- **Label:** `text-sm text-muted-foreground` (subtle, minimal - only if needed)
- **Change Indicator:** Small badge with color (not text like "+5%")
- **Icon:** Optional, top-right, subtle (visual context)
- **Visual Priority:** Number is primary, label is secondary
- **Badge for Urgency:** Red dot or badge (not "Action needed" text)
- **Rule:** Users should SEE the state (color, number, icon) before reading text

### 2.4 Form Components

**Text Minimization in Forms:**
- **Labels:** Only when necessary, `text-sm font-medium`
- **Helper Text:** Use hover tooltip (question mark icon) instead of always-visible text
- **Placeholders:** Minimal, just hint (not full instructions)
- **Error Messages:** Show on error only, not preemptively
- **Subtle Subtitles:** Only for complex sections, be careful not to clutter
- **Icon Hints:** Use "?" icon with tooltip for explanations (not inline text)

**Notion-Style Borderless Inputs:**
Notion uses borderless inputs with background color differentiation and inset focus shadows. This creates a cleaner, more minimal aesthetic.

**Input Fields:**
- **Height:** 32px (Notion standard - more compact)
- **Padding:** 4px 10px
- **Border:** None (borderless design)
- **Radius:** 3px (compact, purposeful)
- **Background:** `rgba(242, 241, 238, 0.6)` (light) / `rgba(55, 53, 47, 0.1)` (dark)
- **Focus:** Inset box-shadow: `inset 0 0 0 1px rgba(35, 131, 226, 0.57)` (not outline)
- **Error:** Inset shadow with red: `inset 0 0 0 1px rgba(239, 68, 68, 0.5)`
- **Label:** Above input, `text-sm font-medium`, 8px margin-bottom
- **Helper Text:** Below input, `text-xs text-muted-foreground`, 4px margin-top
- **Placeholder:** `rgba(55, 53, 47, 0.4)` (muted text color)

**Why Borderless:**
- Cleaner visual appearance
- Less visual noise
- Focus state is more subtle and refined
- Matches Notion's minimal philosophy

**Textarea:**
- **Min Height:** 80px
- **Resize:** Vertical only
- **Same styling as input**

**Select/Dropdown:**
- **Same dimensions as input**
- **Chevron Icon:** Right side, 16px, `text-muted-foreground`
- **Options:** Max height 240px, scrollable

**Checkbox/Radio:**
- **Size:** 16px × 16px
- **Border:** 2px solid `border`
- **Checked:** Primary color fill
- **Label:** Left of input, `text-sm`, 8px gap

**Switch/Toggle:**
- **Width:** 44px
- **Height:** 24px
- **Thumb:** 20px circle
- **Active:** Primary color
- **Inactive:** `bg-muted`

### 2.5 Data Display Components

**Table:**
- **Header:** `bg-muted`, `text-xs font-medium`, uppercase, 12px padding
- **Row:** `border-b`, hover `bg-muted/50`
- **Cell Padding:** 16px vertical, 24px horizontal
- **Alternating Rows:** Optional, very subtle
- **Actions Column:** Right-aligned, icon buttons (no text labels)

**List (Vertical):**
- **Item Padding:** 16px
- **Item Border:** Bottom border, 1px, subtle
- **Last Item:** No border
- **Hover:** `bg-muted/50`

**Badge/Tag (Visual Indicators - Not Text):**
- **Padding:** 4px 8px (compact)
- **Radius:** 14px (pill shape for tags)
- **Font:** `text-xs font-medium` (only if text needed)
- **Visual Priority:** Badge/icon first, text secondary
- **Variants (Muted "Old Money" Colors):**
  - Default: `bg-muted text-muted-foreground` (warm gray)
  - Primary: `bg-[#0D9488] text-white` (Traverum teal - only vibrant color)
  - Success: `bg-[#6B8E6B] text-white` (muted sage green)
  - Warning: `bg-[#C9A961] text-white` (muted gold)
  - Destructive: `bg-[#B8866B] text-white` (muted terracotta)
  - Info: `bg-[#7A9CC6] text-white` (muted blue-gray)

**Visual Indicators Over Text:**
- **Badge with number:** "3" in red badge (not "3 pending requests" text)
- **Icon with count:** Bell icon + red dot (not "You have notifications" text)
- **Color coding:** Status colors (not status text labels)
- **Users SEE, not read** - visual communication first

**Empty State:**
- **Icon:** 64px, centered, `text-muted-foreground`, 50% opacity
- **Title:** `text-lg font-medium`, centered, 16px margin-top (minimal text)
- **Description:** `text-sm text-muted-foreground`, centered, max-width 400px, 8px margin-top (only if essential)
- **Action Button:** Primary (Traverum teal), centered, 24px margin-top
- **Rule:** Minimize text - use visual elements (icons, colors) to communicate

---

## 3. Color System

### 3.1 Base Palette

**Notion-Inspired Warm Gray System:**
Notion uses `rgb(55, 53, 47)` as the base with varying alpha channels. This creates a cohesive, warm, professional feel.

**Background Colors (Unified Warm White System):**
- **Primary Background:** `#FEFCF9` or `#FAF8F5` (almost pure white, slightly warmer - not pure white to avoid eye strain)
- **Sidebar Background:** Same as page (`#FEFCF9` or `#FAF8F5`) - unified color
- **Card Background:** Same as page (`#FEFCF9` or `#FAF8F5`) - unified color
- **Header Background:** Same as page (`#FEFCF9` or `#FAF8F5`) - unified color
- **Input Background:** `rgba(242, 241, 238, 0.6)` (warm beige tint for differentiation)
- **Hover Background:** `rgba(55, 53, 47, 0.08)` (subtle, maintains warmth)
- **Active Background:** `rgba(55, 53, 47, 0.16)` (slightly more pronounced)
- **Dark Mode:** `#2F3437` (warm dark gray, not cool black)

**Distinction via Borders (Notion-Style):**
- **Cards:** `1px solid rgba(55, 53, 47, 0.09)` (subtle border, not shadow)
- **Sidebar:** Right border `1px solid rgba(55, 53, 47, 0.09)` (subtle separation)
- **Header:** Bottom border `1px solid rgba(55, 53, 47, 0.09)` (subtle separation)
- **No shadows for distinction** - borders create separation (like Notion)

**Why Unified Warm White:**
- Reduces eye strain (not harsh pure white, but almost pure)
- Creates seamless, cohesive feel
- Borders provide subtle distinction (Notion-style)
- "Old money" aesthetic - sophisticated, timeless
- Warmer than pure white, more inviting

**Text Colors (Warm Gray System):**
- **Primary Text:** `rgb(55, 53, 47)` (light) / `rgba(255, 255, 255, 0.9)` (dark)
- **Secondary Text:** `rgba(55, 53, 47, 0.65)` (light) / `rgba(255, 255, 255, 0.6)` (dark)
- **Muted Text:** `rgba(55, 53, 47, 0.4)` (light) / `rgba(255, 255, 255, 0.4)` (dark)
- **Disabled Text:** `rgba(55, 53, 47, 0.35)` (light) / `rgba(255, 255, 255, 0.35)` (dark)

**Border Colors:**
- **Light Border:** `rgba(55, 53, 47, 0.09)` (light) / `rgba(255, 255, 255, 0.09)` (dark)
- **Medium Border:** `rgba(55, 53, 47, 0.16)` (light) / `rgba(255, 255, 255, 0.16)` (dark)

**Why Warm Grays:**
- More inviting than cool grays
- Reduces eye strain
- Creates cohesive, professional feel
- Less "tech-y", more approachable

### 3.2 Accent Colors

**Primary (Traverum Teal):**
- **Base:** `#0D9488` (teal-600) - **ONLY accent color for buttons and primary actions**
- **Light:** `#14B8A6` (teal-500) - Hover state
- **Dark:** `#0F766E` (teal-700) - Active/pressed state
- **Usage:** Primary CTAs, active states, links, brand elements
- **Rule:** Use sparingly - maximum 10% of interface

**Muted "Old Money" Semantic Colors:**
- **Success:** `#6B8E6B` (muted sage green - not bright green)
- **Warning:** `#C9A961` (muted gold/amber - not bright yellow)
- **Error:** `#B8866B` (muted terracotta - not bright red)
- **Info:** `#7A9CC6` (muted blue-gray - not bright blue)

**Color Philosophy:**
- **No bright, saturated colors** - everything muted and sophisticated
- **"Old money" aesthetic** - timeless, refined, understated
- **Warm undertones** - complements beige background
- **Low saturation** - professional, not playful
- **Traverum teal** - only vibrant color, used strategically

**Usage Guidelines:**
- **Primary (Teal):** Use sparingly, maximum 10% of interface - only for primary CTAs and critical actions
- **Semantic (Muted):** Only for status, alerts, feedback - always muted, never bright
- **Neutral (Warm Grays):** 90% of interface should be warm grays/beiges
- **No bright colors** - everything else is muted, sophisticated, "old money" palette
- **Background:** Warm white/beige (`#FEFCF9` or `#FAF8F5`) - not pure white

### 3.3 Color Application

**Interactive Elements:**
- **Links:** Primary color, underline on hover
- **Buttons:** Primary color for primary actions
- **Focus Rings:** Primary color, 2px width
- **Active States:** Primary color background or border

**Status Indicators:**
- **Success:** Green (completed, approved, active)
- **Warning:** Amber (pending, attention needed)
- **Error:** Red (failed, declined, urgent)
- **Info:** Blue (informational, in progress)

**Data Visualization:**
- Use primary color for main metric
- Use semantic colors for comparisons
- Maintain 4.5:1 contrast ratio

---

## 4. Typography System

### 4.1 Font Family

**Primary Font:** Poppins (as per Traverum brand)
- **Weights:** 400 (regular), 500 (medium), 600 (semibold)
- **Fallback:** `system-ui, -apple-system, sans-serif`

**Monospace Font:** For code, IDs, references
- **Family:** `'JetBrains Mono', 'Fira Code', monospace`
- **Usage:** Booking references (TRV-XXXXXX), timestamps in logs

### 4.2 Type Scale

| Element | Size | Weight | Line Height | Usage |
|---------|------|--------|-------------|-------|
| Page Title | 30px | 600 | 1.2 | Main page heading |
| Section Title | 20px | 500 | 1.3 | Section headers |
| Card Title | 18px | 500 | 1.4 | Card headings |
| Body Large | 16px | 400 | 1.5 | Primary body text |
| Body | 14px | 400 | 1.5 | Secondary text, descriptions |
| Small | 12px | 400 | 1.4 | Metadata, labels, captions |
| Tiny | 11px | 400 | 1.3 | Timestamps, fine print |

### 4.3 Typography Rules

**Headings:**
- Use semantic HTML (`h1`, `h2`, `h3`)
- Only one `h1` per page
- Maintain hierarchy (don't skip levels)
- Sufficient contrast (4.5:1 minimum)

**Body Text:**
- Max line length: 65-75 characters (readability)
- Line height: 1.5 (comfortable reading)
- Paragraph spacing: 16px minimum

**Lists:**
- Bullet spacing: 8px
- List item spacing: 4px
- Nested lists: Indent 16px

**Code/References:**
- Monospace font
- Background: `bg-muted`
- Padding: 2px 6px
- Radius: 4px

---

## 5. Spacing System

### 5.1 Spacing Scale

**Base Unit:** 8px (Notion's grid system - all spacing multiples of 8)

| Token | Value | Usage |
|-------|-------|-------|
| `space-0.5` | 4px | Half-step for fine-tuning (icon to text) |
| `space-1` | 8px | Small gaps (form elements, list items) |
| `space-1.5` | 12px | Medium-small (button padding) |
| `space-2` | 16px | Standard spacing (cards, sections) |
| `space-3` | 24px | Large spacing (sections, card padding) |
| `space-4` | 32px | Extra large (major sections) |
| `space-6` | 48px | Huge (page sections) |
| `space-8` | 64px | Massive (page-level separation) |

**Notion's 8px Grid Benefits:**
- Eliminates decision fatigue (always use multiples of 8)
- Creates visual rhythm and consistency
- Easier for developers (no arbitrary values)
- Professional, systematic appearance

### 5.2 Spacing Application

**Component Internal:**
- Card padding: 24px
- Button padding: 10px 20px
- Input padding: 10px 14px
- Icon to text: 8px

**Component External:**
- Card to card: 16px (grid gap)
- Section to section: 48px
- Page edge: 24px (desktop), 16px (mobile)

**Content Spacing:**
- Paragraph to paragraph: 16px
- Heading to content: 12px
- List items: 8px

---

## 6. Micro-interactions & Animations

### 6.1 Animation Principles

**Notion's Ultra-Fast Philosophy:**
Notion uses **20ms transitions** for most interactions. This creates an instant, responsive feel where users notice speed, not animation.

**Purpose-Driven:**
- Every animation should have a purpose
- Guide attention, provide feedback, show state changes
- Never animate for decoration
- If it's not essential, remove it

**Performance:**
- Use CSS transforms (GPU-accelerated)
- Avoid animating `width`, `height`, `top`, `left`
- Prefer `opacity` and `transform`
- Duration: **20ms** (Notion standard for UI feedback), 150ms (page transitions), 300ms (modals)

**Easing:**
- **Ease-in:** For most interactions (20ms ease-in feels instant)
- **Ease-out:** For entrances (feels natural)
- **Ease-in-out:** For state changes (150ms+)
- **Linear:** For loading animations only

**Notion's Transition Scale:**
- **Fast (UI feedback):** 20ms ease-in (buttons, hovers, toggles)
- **Normal (state changes):** 150ms ease (modals, drawers)
- **Slow (page transitions):** 300ms ease-in-out (route changes)

### 6.2 Specific Animations

**Button Hover (Notion-Style):**
- Background color change only (no scale)
- Duration: **20ms**
- Easing: `ease-in`
- No transform animations (feels more instant)

**Button Click:**
- Background color change (darker shade)
- Duration: **20ms**
- Easing: `ease-in`
- Optional: Very subtle scale `scale(0.99)` if needed, but color change is primary

**Card Hover (Notion-Style):**
- Shadow: Add third shadow layer (no transform)
- Duration: **20ms**
- Easing: `ease-in`
- No translateY (keeps layout stable, feels more instant)

**Modal/Drawer Entrance:**
- Fade in: `opacity 0 → 1`
- Scale: `scale(0.98) → scale(1)` (subtle, not 0.95)
- Duration: 150ms (faster than typical 200-300ms)
- Easing: `ease-out`
- Backdrop: Fade in simultaneously (60% opacity light, 80% dark)

**Loading States:**
- Spinner: Continuous rotation, 1s duration, linear
- Skeleton: Pulse animation, 1.5s duration, ease-in-out
- Progress bar: Width animation, ease-out

**Toast Notifications:**
- Entrance: Slide from top + fade
- Duration: 300ms
- Exit: Fade out, 200ms
- Auto-dismiss: 5 seconds

**Form Validation:**
- Error shake: `translateX(-4px) → translateX(4px) → 0`
- Duration: 400ms
- Show error message: Fade in, 200ms

**Page Transitions:**
- Fade: `opacity 0 → 1`
- Duration: 200ms
- Only on route changes (not on scroll)

### 6.3 Animation Guidelines

**Don't Animate:**
- Text content (distracting)
- Critical information (slows comprehension)
- Large layout shifts
- On reduced motion preference (respect `prefers-reduced-motion`)

**Do Animate:**
- State changes (hover, active, focus)
- Loading indicators
- Success/error feedback
- Modal/drawer entrances
- Subtle hover effects

---

## 7. Empty States

### 7.1 Empty State Principles

**Contextual:**
- Empty state should match the context
- Different empty states for different scenarios
- Clear about what's missing and why

**Action-Oriented:**
- Always provide a clear next action
- Primary CTA should be obvious
- Secondary actions can be subtle

**Encouraging:**
- Positive tone (not "error" or "failure")
- Explain value of taking action
- Show progress if applicable

### 7.2 Empty State Components

**Visual Element:**
- Icon or illustration (64px minimum)
- Centered, subtle color (50% opacity)
- Not too playful (maintains professionalism)

**Content:**
- **Title:** `text-lg font-medium`, 16px margin-top
- **Description:** `text-sm text-muted-foreground`, max-width 400px, 8px margin-top
- **Action:** Primary button, 24px margin-top

**Layout:**
- Centered vertically and horizontally
- Minimum 120px padding from edges
- Max-width: 500px for text

### 7.3 Traverum-Specific Empty States

**No Experiences:**
- Icon: Sparkles or map pin
- Title: "Create your first experience"
- Description: "Start by adding an experience to make it available for booking"
- Action: "Create Experience" (primary)

**No Sessions:**
- Icon: Calendar
- Title: "No sessions yet"
- Description: "Create sessions to make this experience bookable"
- Action: "Add Session" (primary)

**No Bookings:**
- Icon: Receipt or shopping bag
- Title: "No bookings yet"
- Description: "Bookings will appear here once guests book your experiences"
- Action: None (informational only)

**No Organizations:**
- Icon: Building or plus
- Title: "Add your first business"
- Description: "Start by adding a business to get started with Traverum"
- Action: "Add Business" (primary)

---

## 8. Navigation Patterns

### 8.1 Sidebar Navigation

**Structure:**
- Persistent (always visible on desktop)
- Collapsible (icon-only on mobile or when collapsed)
- Grouped by function:
  - Primary actions (Dashboard, Experiences)
  - Secondary actions (Sessions, Requests)
  - Settings (Payouts, Settings)

**Visual Hierarchy:**
- Active item: Highlighted background + left border
- Hover: Subtle background change
- Icons: Left-aligned, consistent size
- Labels: Right of icons, truncated if needed

**Badges/Counts:**
- Right-aligned
- Small, rounded badge
- Only show if > 0
- Red for urgent (pending requests)

### 8.2 Breadcrumbs

**Usage:**
- For deep navigation (3+ levels)
- Show path: Dashboard > Experiences > [Experience Name]
- Last item: Current page (not clickable)
- Separator: `/` or `›`

**Styling:**
- `text-sm text-muted-foreground`
- Links: Primary color on hover
- Spacing: 8px between items

### 8.3 Context Switching

**Organization Switcher:**
- In header (top-left or top-right)
- Dropdown trigger: Current org name + chevron
- Dropdown: List of organizations
- Each item: Name + type badge
- Active item: Checkmark indicator

**Visual Design:**
- Trigger: Button style, `text-sm font-medium`
- Dropdown: 240px width, max-height 400px
- Item height: 48px
- Hover: `bg-accent`

---

## 9. Data Visualization

### 9.1 Charts & Graphs

**Color Usage:**
- Primary metric: Primary color
- Secondary metrics: Neutral grays
- Comparisons: Semantic colors (if meaningful)
- Max 5-6 colors per chart

**Chart Types:**
- **Line:** Trends over time
- **Bar:** Comparisons
- **Area:** Cumulative data
- **Pie:** Avoid (hard to compare)

**Accessibility:**
- Color + pattern/texture
- Sufficient contrast
- Labels, not just tooltips
- Alt text for screen readers

### 9.2 Metrics Display

**Stat Cards:**
- Large number: `text-3xl font-semibold`
- Label: `text-sm text-muted-foreground`
- Change indicator: Small badge, right-aligned
- Icon: Optional, subtle

**Comparison:**
- Show change: +X% or -X%
- Color: Green (positive), Red (negative)
- Context: "vs last month" or "vs last year"

---

## 10. Responsive Design

### 10.1 Breakpoints

| Breakpoint | Width | Usage |
|-----------|-------|-------|
| Mobile | < 640px | Single column, stacked layout |
| Tablet | 640px - 1024px | 2-column grid, sidebar collapsed |
| Desktop | > 1024px | Full layout, sidebar visible |

### 10.2 Mobile Adaptations

**Navigation:**
- Sidebar: Hidden, accessible via hamburger menu
- Header: Simplified, essential actions only
- Bottom nav: Optional for primary actions (Future)

**Cards:**
- Full width, no grid
- Reduced padding: 16px
- Stack vertically

**Forms:**
- Full width inputs
- Stacked labels (above inputs)
- Larger touch targets (44px minimum)

**Tables:**
- Convert to cards (one row = one card)
- Or horizontal scroll
- Or stacked layout

---

## 11. Accessibility

### 11.1 Keyboard Navigation

**Tab Order:**
- Logical flow (top to bottom, left to right)
- Skip links for main content
- Focus indicators: 2px outline, primary color

**Keyboard Shortcuts:**
- `Esc`: Close modals/drawers
- `Enter`: Submit forms, activate buttons
- `Arrow keys`: Navigate lists, menus
- `/`: Focus search (Future)

### 11.2 Screen Readers

**Semantic HTML:**
- Use proper headings (`h1-h6`)
- Use `nav`, `main`, `aside` landmarks
- Use `button` for actions, `a` for navigation
- Use `label` for form inputs

**ARIA Labels:**
- Icon-only buttons: `aria-label`
- Loading states: `aria-live="polite"`
- Error messages: `aria-live="assertive"`
- Modal: `role="dialog"`, `aria-modal="true"`

### 11.3 Color Contrast

**Text:**
- Normal text: 4.5:1 minimum
- Large text (18px+): 3:1 minimum
- Interactive elements: 3:1 minimum

**Visual Indicators:**
- Don't rely on color alone
- Use icons, patterns, text labels
- Status: Color + text ("Active", "Pending")

---

## 12. Predictive & Proactive UI Design

### 12.1 Context-Aware Suggestions

**Goal:** Dashboard "knows before the user what they want to do"

**Notion's Philosophy Applied:**
- Show only what's needed, when it's needed
- Remove everything that doesn't serve a function
- Predict user intent based on context and patterns
- Proactive, not reactive

**Implementation Patterns:**

**Smart Empty States:**
- Don't just say "No experiences yet"
- Show: "Create your first experience" + contextual suggestion
- Example: "Most suppliers create experiences in the morning. Ready to add yours?"
- Example: "You just signed up. Let's create your first experience." (time-based)
- Example: "You have 3 experiences but no sessions. Add sessions to make them bookable." (pattern-based)

**Proactive Notifications (Minimal, Not Intrusive):**
- **Banner Style:** Subtle top banner, dismissible
- **Content:** Action-oriented, time-sensitive
- Examples:
  - "3 pending requests - respond within 12 hours" (urgent)
  - "Your next session is tomorrow - add more sessions?" (suggestive)
  - "Stripe setup incomplete - finish in 2 minutes" (onboarding)
- **Design:** Warm gray background, subtle border, no heavy styling

**Contextual Actions (Show After Actions):**
- After creating experience: "Add your first session?" (prominent CTA, appears inline)
- After session created: "This experience is now bookable" + subtle link to widget
- After booking: "Guest paid - experience confirmed" + next steps (what to do next)
- After approving request: "Payment link sent. Guest has 24 hours to pay."

**Predictive Navigation:**
- Highlight likely next actions in sidebar (subtle badge or indicator)
- Show shortcuts to frequently accessed pages (top of sidebar)
- Remember user patterns: "You usually check requests first" → highlight Requests
- Context-aware menu items (show/hide based on current state)

**Smart Defaults:**
- Pre-fill forms based on previous entries
- Suggest session times based on availability rules
- Auto-select common options
- Remember user preferences (view mode, filters, etc.)

### 12.2 Minimal Information Architecture

**Notion's Philosophy Applied:**
- Remove everything that doesn't serve a function
- Hide complexity until needed
- Show only what's relevant now
- Progressive disclosure (expand when needed)
- **Nothing unnecessary, everything functional**

**Dashboard Layout (Priority-Based):**
- **Primary (Top-Left):** What needs attention now (pending requests, urgent actions)
- **Secondary (Top-Right):** Quick metrics (upcoming sessions, bookings count)
- **Tertiary (Below):** Everything else (experiences list, recent activity)
- **Hidden:** Settings, advanced features (accessible but not prominent)

**Card Priority:**
- Most important cards: Top-left (F-pattern)
- Less important: Bottom-right
- **Remove cards that don't drive action** (if it's just informational, question if it's needed)
- **Collapsible sections:** Hide less-used content, expand on demand

**Progressive Disclosure:**
- Start with minimal view
- Expand sections as needed
- Collapsible form sections (already implemented)
- Hide advanced options until needed
- Show "Show more" for long lists

**Contextual Hiding:**
- Hide navigation items user never uses (learn from behavior)
- Hide features not relevant to current organization type
- Show shortcuts for frequently accessed pages
- Adapt sidebar based on user role and patterns

### 12.3 Conversational OS Integration

**Notion-Style AI Integration:**
Notion's AI is contextual and minimal - it appears when needed, not as a persistent element.

**AI Assistant Placement (Contextual, Not Persistent):**
- **Inline Suggestions:** In empty states, forms, and content areas
- **Command Palette:** `Cmd+K` or `/` to trigger (not always visible)
- **Contextual Help:** Small "?" icon that reveals AI help when clicked
- **Floating Action Button:** Only show when relevant (not always visible)

**Chat Interface (When Activated):**
- Slide-up drawer from bottom
- Height: 400px (default), expandable to 80vh
- Header: Minimal, just "Assistant" + close
- Input: Bottom, fixed, borderless (Notion-style)
- Messages: Scrollable area, minimal styling
- Typing indicator: Subtle animated dots
- Background: Same as page (not separate card)

### 12.4 Conversational Patterns

**Context Awareness:**
- Assistant knows current page and data
- Can reference current experience, session, booking
- Suggests actions based on context and user patterns
- Remembers user's workflow preferences

**Quick Actions (Command Palette Style):**
- `Cmd+K` or `/` to open
- Type to search: "create experience", "pending requests", "revenue"
- Shows most likely actions first
- Learns from user behavior

**Natural Language:**
- Understands Traverum terminology (experiences, sessions, bookings)
- Can explain features in context
- Provides proactive guidance ("You usually create sessions on Mondays")
- Suggests optimizations ("You have 5 experiences but only 2 have sessions")

**Predictive Suggestions (Proactive, Not Intrusive):**
- **Pattern-Based:** "Based on your patterns, you usually create sessions on Mondays. Want to add sessions now?"
- **Comparison-Based:** "Similar suppliers also add seasonal availability. Consider adding summer hours."
- **Performance-Based:** "Your most popular experience needs more sessions. Add sessions to capture more bookings."
- **Time-Based:** "It's 9 AM - most suppliers check requests first thing. You have 3 pending."
- **Workflow-Based:** "You just created an experience. Next step: Add sessions to make it bookable."

**Implementation:**
- Show as subtle banner (not modal)
- Dismissible with X button
- Contextual (only when relevant)
- Action-oriented (always includes CTA)
- Learn from dismissals (don't show again if user dismisses)

### 12.5 Visual Design (Notion-Minimal)

**Assistant UI:**
- Clean, minimal chat interface (borderless, warm gray)
- User messages: Right-aligned, subtle background `rgba(55, 53, 47, 0.08)`
- Assistant messages: Left-aligned, no background (just text)
- Timestamps: Hidden by default, show on hover
- Loading: Subtle typing indicator (3 dots, minimal animation)
- No heavy borders or cards (just text on background)
- Input: Borderless, inset focus shadow (matches form inputs)

**Integration Points:**
- **Inline suggestions:** In forms, show as subtle text below input (`text-xs text-muted`)
- **Contextual help:** Small "?" icon (16px), reveals tooltip on hover (20ms)
- **Command palette:** `Cmd+K` overlay, minimal styling, fast (20ms open), warm gray background
- **Empty states:** AI suggestion as secondary action (not primary CTA)
- **Proactive notifications:** Subtle banner at top, dismissible, warm gray background

**Notion's AI Philosophy Applied:**
- AI is helpful, not intrusive
- Appears when needed, hidden when not
- Minimal visual weight (no heavy UI)
- Fast interactions (20ms transitions)
- Contextual, not generic
- **Predictive:** Knows what user needs before they ask
- **Functional:** Every AI interaction serves a purpose

---

## 13. Loading States

### 13.1 Skeleton Screens (Notion Shimmer)

**Purpose:**
- Show structure while loading
- Better than spinners for content
- Maintains layout stability
- Creates sense of progress

**Design (Notion Shimmer Animation):**
- Background: `linear-gradient(90deg, rgba(55, 53, 47, 0.09) 40%, rgba(55, 53, 47, 0.05) 50%, rgba(55, 53, 47, 0.09) 60%)`
- Background size: `300% 100%`
- Animation: `skeleton-shimmer 1.5s linear infinite`
- Border radius: 4px (matches cards)
- **Not pulse** - shimmer creates more polished feel

**Usage:**
- Lists: Skeleton rows (32px height, matches table rows)
- Cards: Skeleton card shapes (match actual card dimensions)
- Forms: Skeleton input fields (32px height, matches inputs)
- Text: 14px height (matches body text)
- Avoid for fast loads (< 200ms) - use spinner instead

**Why Shimmer Over Pulse:**
- More sophisticated appearance
- Feels faster (continuous motion)
- Less distracting
- Matches Notion's polished feel

### 13.2 Spinners (Minimal, Notion-Style)

**Usage:**
- Button loading states (replace text)
- Full-page loading (initial load)
- Inline loading (small actions)

**Design:**
- Circular, primary color (Traverum teal)
- **Size:** Match context exactly (16px for buttons, 20px for inline, 32px for pages)
- **Stroke width:** 2px (not heavy)
- **Duration:** 1s rotation, linear
- **Background:** Transparent (no background circle)
- **Position:** Centered in container

**Notion Philosophy:**
- Minimal visual weight
- Only show when necessary
- Match container size exactly
- Fast rotation (feels responsive)

**Placement:**
- Center of container
- Replace button text when loading
- Overlay for full-page (with backdrop)

### 13.3 Progress Indicators

**Usage:**
- Multi-step processes
- File uploads
- Long-running operations

**Design:**
- Linear bar, primary color
- Show percentage if known
- Animated fill (ease-out)
- Label: "Uploading... 45%"

---

## 14. Error Handling

### 14.1 Error States

**Inline Errors:**
- Red border on input
- Error message below input
- Icon: Alert circle, 16px
- Text: `text-sm text-destructive`
- Shake animation (optional)

**Toast Errors:**
- Red background or border
- Icon: Alert circle
- Message: Clear, actionable
- Auto-dismiss: 5 seconds
- Manual dismiss: X button

**Page Errors:**
- Centered, large icon
- Title: "Something went wrong"
- Description: User-friendly message
- Action: "Try again" button
- Support link (optional)

### 14.2 Validation

**Real-time:**
- Validate on blur (not on every keystroke)
- Show errors immediately
- Clear errors on correction

**Form Submission:**
- Validate all fields
- Scroll to first error
- Focus first error field
- Show summary (optional)

---

## 15. Professional Polish

### 15.1 Avoiding "Vibe Coded" Aesthetics

**Critical Anti-Patterns (Notion-Inspired):**

**Don't:**
- Overuse gradients (never on dashboard components)
- Excessive shadows (opacity > 0.15 looks amateur)
- Playful illustrations (in wrong context)
- Inconsistent spacing (use 8px grid, no arbitrary values)
- Too many colors (warm gray + one accent only)
- Generic UI kit look (customize everything)
- Mixed border radius (don't use 4px, 8px, 12px, 16px randomly)
- Drop shadows on everything (use layered shadows sparingly)
- Slow transitions (150ms+ feels sluggish - use 20ms for UI)
- Equal button padding (use 1.5:1 or 2:1 ratio)
- Heavy borders (use subtle rgba borders or shadows)
- Outline focus rings (use inset box-shadow)
- **Unnecessary text/icons** (clutters interface, takes space)
- **Bright, saturated colors** (use muted "old money" palette)
- **Pure white backgrounds** (use warm white/beige)

**Do:**
- **8px grid system** (systematic, no guesswork)
- **20ms transitions** for UI feedback (feels instant)
- **Layered rgba shadows** (opacity < 0.15, creates depth without weight)
- **3-4px border radius** (compact, purposeful - not playful)
- **Borderless inputs** with inset focus shadows
- **Warm gray + beige palette** (cohesive, professional, "old money")
- **Warm white background** (`#FEFCF9` or `#FAF8F5` - not pure white)
- **Traverum teal** - only vibrant color, used strategically
- **Muted semantic colors** - sage green, muted gold, terracotta, blue-gray
- **1.5:1 button padding ratio** (horizontal:vertical)
- **Consistent spacing** (multiples of 8px)
- **Minimal color usage** (warm gray/beige + teal accent + muted semantics)
- **Predictive UI** (show what users need before they ask)
- **Visual indicators over text** (badges, icons, colors - users SEE, not read)
- **Hover tooltips for explanations** (no unnecessary labels)
- **Subtle subtitles only when needed** (be careful not to clutter)

### 15.2 Professional Details

**Consistency:**
- Same components used consistently
- Same spacing throughout
- Same colors for same purposes
- Same animations for same actions

**Attention to Detail:**
- Proper alignment (use grid)
- Consistent icon sizes
- Proper text truncation
- Loading states everywhere
- Error states everywhere
- Empty states everywhere

**Performance:**
- Fast page loads (< 2s)
- Smooth animations (60fps)
- No layout shift
- Optimized images
- Lazy loading

---

## 16. Implementation Recommendations for Traverum

### 16.1 Design System (Notion-Inspired)

**Component Library:**
- Use shadcn/ui as base (already in use)
- **Customize to Notion-style:** Borderless inputs, 20ms transitions, warm grays
- Extend with Traverum-specific components
- Document all components with exact specifications

**Design Tokens (CSS Variables):**
```css
:root {
  /* Notion-Inspired Warm Gray System */
  --text-primary: rgb(55, 53, 47);
  --text-secondary: rgba(55, 53, 47, 0.65);
  --text-muted: rgba(55, 53, 47, 0.4);
  --bg-page: #ffffff;
  --bg-sidebar: #f7f6f3;
  --bg-hover: rgba(55, 53, 47, 0.08);
  --bg-active: rgba(55, 53, 47, 0.16);
  --border-light: rgba(55, 53, 47, 0.09);
  --border-medium: rgba(55, 53, 47, 0.16);
  
  /* Traverum Accent */
  --accent-primary: #0D9488; /* Teal */
  --focus-ring: rgba(35, 131, 226, 0.57);
  
  /* Spacing (8px grid) */
  --space-1: 8px;
  --space-2: 16px;
  --space-3: 24px;
  --space-4: 32px;
  
  /* Border Radius */
  --radius-sm: 3px;
  --radius-md: 4px;
  --radius-lg: 8px;
  
  /* Transitions */
  --transition-fast: 20ms ease-in;
  --transition-normal: 150ms ease;
}
```

**Tailwind Configuration:**
- Extend default theme with Notion tokens
- Override shadcn defaults to match Notion style
- Use 8px spacing scale
- Use warm gray color palette

### 16.2 Specific Improvements

**Dashboard Page:**
- Implement stat cards with proper hierarchy
- Add loading skeletons
- Improve empty states
- Add hover states to cards

**Experience Form:**
- Better section organization
- Improved validation feedback
- Progress indicator (optional)
- Auto-save (Future)

**Sessions Calendar:**
- Professional calendar component
- Clear availability indicators
- Smooth date navigation
- Mobile-friendly touch interactions

**Navigation:**
- Implement proper sidebar
- Add breadcrumbs for deep pages
- Improve organization switcher
- Add keyboard shortcuts (Future)

### 16.3 Conversational OS

**Phase 1 (MVP):**
- FAB in bottom-right
- Basic chat interface
- Context-aware suggestions
- Quick actions

**Phase 2:**
- Command palette (`Cmd+K`)
- Inline suggestions
- Advanced queries
- Multi-turn conversations

---

## 17. Competitive Analysis

### 17.1 Reference Platforms

**Stripe Dashboard:**
- Clean, minimal design
- Excellent empty states
- Clear information hierarchy
- Professional color usage

**Linear:**
- Fast, responsive
- Excellent keyboard navigation
- Clean typography
- Subtle animations

**Vercel:**
- Modern, professional
- Great data visualization
- Clear status indicators
- Excellent documentation

**Notion:**
- **Ultra-minimal design** - nothing unnecessary
- **8px grid system** - systematic spacing
- **20ms transitions** - instant, responsive feel
- **Warm gray palette** - cohesive, professional
- **Borderless inputs** - cleaner aesthetic
- **Layered shadows** - depth without weight
- **Predictive UI** - shows what you need before you ask
- **Functional minimalism** - every element serves a purpose

**GitHub:**
- Excellent navigation
- Clear data presentation
- Good use of badges
- Professional color system

### 17.2 Key Takeaways

**Common Patterns:**
- Sidebar navigation (left, 224px width)
- Top header (fixed, compact 45px height)
- Card-based layouts (unified warm white background, subtle borders for distinction)
- Warm gray color palettes (not cool grays)
- 8px grid system (systematic spacing)
- 20ms transitions (ultra-fast UI feedback)
- Borderless inputs (inset focus shadows)
- Minimal, functional design (nothing unnecessary)
- Clear typography hierarchy
- Predictive, context-aware UI

**Traverum Differentiation:**
- Multi-organization management
- Booking-focused workflows
- Experience/session management
- Conversational OS integration (future)

---

## 18. Conclusion

Modern SaaS dashboards succeed through:

1. **Clear Visual Hierarchy:** Guide users' attention effectively
2. **Consistent Components:** Build trust through predictability
3. **Professional Aesthetics:** Muted colors, generous spacing, clean design
4. **Purposeful Interactions:** Every animation serves a purpose
5. **Comprehensive States:** Loading, empty, error states everywhere
6. **Accessibility:** Usable by everyone
7. **Performance:** Fast, smooth, responsive

**For Traverum specifically:**
- **Notion-Inspired Minimalism:** Nothing unnecessary, everything functional
- **8px Grid System:** Systematic spacing eliminates decision fatigue
- **20ms Transitions:** Ultra-fast interactions feel instant
- **Warm Gray Palette:** Professional, cohesive, less "tech-y"
- **Borderless Inputs:** Cleaner aesthetic, inset focus shadows
- **Predictive UI:** Show what users need before they ask
- **Context-Aware:** Dashboard adapts to user patterns
- **Multi-Organization:** Seamless context switching
- **Booking-Focused:** Optimize for booking workflows
- **Conversational OS Ready:** AI appears when needed, hidden when not

**Next Steps:**
1. Audit current dashboard against these principles
2. Create design tokens (colors, spacing, typography)
3. Build component library (extend shadcn/ui)
4. Implement improvements page by page
5. Add conversational OS (phase 2)

---

## Appendix: Quick Reference

### Color Tokens (Unified Warm White + Muted "Old Money" Palette)
```css
/* Background (Unified Warm White - Almost Pure White, Slightly Warmer) */
--bg-page: #FEFCF9; /* or #FAF8F5 - almost pure white, slightly warmer */
--bg-sidebar: #FEFCF9; /* same as page - unified color */
--bg-card: #FEFCF9; /* same as page - unified color */
--bg-header: #FEFCF9; /* same as page - unified color */

/* Text Colors (Warm Gray) */
--text-primary: rgb(55, 53, 47);
--text-secondary: rgba(55, 53, 47, 0.65);
--text-muted: rgba(55, 53, 47, 0.4);
--text-disabled: rgba(55, 53, 47, 0.35);

/* Interactive States */
--bg-hover: rgba(55, 53, 47, 0.08);
--bg-active: rgba(55, 53, 47, 0.16);
--bg-input: rgba(242, 241, 238, 0.6); /* warm beige tint */

/* Borders (For Distinction - Notion-Style) */
--border-light: rgba(55, 53, 47, 0.09); /* subtle borders for cards, sidebar, header */
--border-medium: rgba(55, 53, 47, 0.16); /* slightly more visible when needed */
--border-card: rgba(55, 53, 47, 0.09); /* card border */
--border-sidebar: rgba(55, 53, 47, 0.09); /* sidebar right border */
--border-header: rgba(55, 53, 47, 0.09); /* header bottom border */

/* Primary Accent (ONLY Vibrant Color) */
--accent-primary: #0D9488; /* Traverum teal - buttons, primary CTAs */
--accent-primary-hover: #14B8A6; /* lighter teal for hover */
--accent-primary-active: #0F766E; /* darker teal for active */
--focus-ring: rgba(13, 148, 136, 0.57); /* teal focus ring */

/* Muted "Old Money" Semantic Colors */
--color-success: #6B8E6B; /* muted sage green */
--color-warning: #C9A961; /* muted gold/amber */
--color-error: #B8866B; /* muted terracotta */
--color-info: #7A9CC6; /* muted blue-gray */
```

### Spacing Scale (8px Grid)
```
4px (half-step), 8px, 12px, 16px, 24px, 32px, 48px, 64px
Always use multiples of 8px (or 4px for fine-tuning)
```

### Typography Scale
```
12px (labels), 14px (body, buttons), 16px (body large), 
18px (card titles), 20px (section headers), 24px (H2), 32px (H1)
```

### Animation Durations (Notion-Speed)
```
UI Feedback: 20ms ease-in (buttons, hovers, toggles)
State Changes: 150ms ease (modals, drawers)
Page Transitions: 300ms ease-in-out (route changes)
Loading: 1.5s linear (skeleton shimmer)
```

### Component Sizes (Notion-Compact)
```
Button (medium): 28px height, 4px 12px padding, 3px radius
Input: 32px height, 4px 10px padding, 3px radius, borderless
Card padding: 16px (not 24px)
Card radius: 4px (not 8px)
Card border: 1px solid rgba(55, 53, 47, 0.09) (not shadow)
Card background: Same warm white as page
Section spacing: 24px (not 48px)
Sidebar width: 224px
Sidebar background: Same warm white as page
Sidebar border: Right border 1px solid rgba(55, 53, 47, 0.09)
Header background: Same warm white as page
Header border: Bottom border 1px solid rgba(55, 53, 47, 0.09)
```

### Border System (Notion-Style - No Shadows for Cards)
```css
/* Cards - Border for Distinction */
border: 1px solid rgba(55, 53, 47, 0.09);
background: #FEFCF9; /* same as page */
/* No shadow - border creates distinction */

/* Sidebar - Right Border */
border-right: 1px solid rgba(55, 53, 47, 0.09);
background: #FEFCF9; /* same as page */

/* Header - Bottom Border */
border-bottom: 1px solid rgba(55, 53, 47, 0.09);
background: #FEFCF9; /* same as page */

/* Modal - Still Uses Shadow (Elevation) */
box-shadow: rgba(15, 15, 15, 0.05) 0px 0px 0px 1px,
            rgba(15, 15, 15, 0.1) 0px 5px 10px,
            rgba(15, 15, 15, 0.2) 0px 15px 40px;
```

### Border Radius System
```
2px (xs), 3px (sm - buttons, inputs), 4px (md - cards), 
8px (lg - modals), 14px (pill - tags)
Never mix randomly - use systematic scale
```

### Anti-Patterns Checklist
- ❌ Button padding: `16px 16px` (equal) → ✅ `4px 12px` (1.5:1 ratio)
- ❌ Shadow opacity: `0.4` → ✅ `0.1` (below 0.15)
- ❌ Transition: `300ms` → ✅ `20ms` (UI feedback)
- ❌ Border radius: Mixed 4px, 12px, 20px → ✅ Systematic 3px, 4px, 8px
- ❌ Input border: `1px solid` → ✅ Borderless with inset shadow
- ❌ Focus ring: `outline: blue` → ✅ `inset box-shadow`
- ❌ Background: Pure white `#FFFFFF` → ✅ Warm white/beige `#FEFCF9`
- ❌ Colors: Bright, saturated → ✅ Muted "old money" palette
- ❌ Text labels everywhere → ✅ Visual indicators (badges, icons, colors)
- ❌ Always-visible helper text → ✅ Hover tooltips with "?" icon
- ❌ "3 pending requests" text → ✅ Red badge with "3" (visual, not text)

---

**Document Version:** 1.0  
**Last Updated:** 2025-01-24  
**Author:** AI Research Synthesis  
**Status:** Ready for Implementation
