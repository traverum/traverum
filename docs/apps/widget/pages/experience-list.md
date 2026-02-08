Updated by Elias on 07-02-2026

# Experience List (Hotel Landing Page)

## What & Why

**WHAT:** Grid of experience cards for a specific hotel. First page guests see.

**WHY:** Guests need to browse what's available and pick something interesting.

**Route:** `/{hotelSlug}` (e.g. `/hotel-rosa`)

---

## Page Structure

### Header (full-page mode only)
- Hotel logo + name (clickable, returns to hotel website via `returnUrl`)
- Sticky at top

### Title Section (configurable)
- **Title** — e.g. "Local Experiences" (configurable per hotel via `widget_title`)
- **Subtitle** — e.g. "Curated by the team at Hotel Rosa" (supports `{{hotel_name}}` placeholder)
- Can be hidden via `widget_title_enabled = false`
- Alignment, spacing, padding all configurable per hotel

### Category Filter (full-page mode only)
- Horizontal scrollable tabs: "All" + category tabs
- Categories pulled from first tag of each experience
- Only shows categories that have experiences
- Animated transitions on filter change

### Experience Grid
- **Full mode:** 3-column grid (1 on mobile)
- **Section mode:** 3-column grid (1 on mobile, 2 on tablet)
- Cards show cover image with gradient overlay + title

### "See All" Button (section mode only)
- Shown when hotel has more than 3 experiences
- Opens full-page experience list in new tab

---

## Experience Card

Each card shows:
- **Cover image** (4:3 aspect ratio, lazy loaded)
- **Title** (overlaid on image with gradient)
- Entire card is clickable → navigates to experience detail

**No price or duration on card** — kept minimal for browsing.

---

## Section Embed Mode

When embedded (`?embed=section`):
- No header
- Max 3 experience cards
- "See all X experiences" button if more available
- Resize script posts height to parent (for iframe auto-sizing)

---

## What's NOT Here

- No search bar
- No sorting options
- No price or rating display on cards
- No pagination (all experiences load at once)
