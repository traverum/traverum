# Experience Data Migration & Cleanup Plan

## Executive Summary

**Problem**: Existing experiences in the database have outdated data structures:
- **Categories**: Using old tag values (`"Boat Tour"`, `"Wine Tasting"`) instead of new category IDs (`"food"`, `"culture"`, etc.)
- **Location**: 92% of experiences have `meeting_point` text but no coordinates, breaking hotel radius filtering

**Impact**: 
- Hotel experience selection can't filter by distance
- Category filtering doesn't work properly
- Some experiences may not appear in searches

**Solution**: 
1. **Category Migration**: Auto-map old tags to new categories with manual review for ambiguous cases
2. **Location Migration**: Geocode existing `meeting_point` values to populate `location_address` and `location` coordinates
3. **UI Improvements**: Add warnings and bulk update tools for suppliers

**Timeline**: 3 weeks (Category → Location → Validation)

## Overview

This document outlines the plan for handling outdated experience data, specifically:
- **Categories/Tags**: Old tag-based system vs. new category system
- **Meeting Points**: Legacy `meeting_point` field vs. new location system (`location_address` + `location` coordinates)

## Current Data Analysis

### Statistics (as of analysis)
- **Total experiences**: 12
- **Experiences with tags**: 12 (100%)
- **Experiences with old meeting_point only**: 11 (92%)
- **Experiences with new location system**: 1 (8%)

### Category/Tag Issues

**Old Tag Values Found:**
- `Boat Tour` (7 experiences)
- `Wine Tasting` (3 experiences)
- `Food` (2 experiences)
- `food` (1 experience - lowercase variant)
- `Historical Tour` (1 experience)
- `Photography` (1 experience)

**New Category System:**
- `food` - Food & Drink 🍷
- `culture` - Culture & History 🏛️
- `nature` - Nature & Outdoors 🌲
- `adventure` - Adventure & Sports ⛷️
- `wellness` - Wellness & Relaxation 🧘
- `nightlife` - Nightlife & Entertainment 🎭

**Issues:**
1. Old tags don't match new category IDs
2. Some experiences have multiple tags (new system expects single category)
3. Case sensitivity issues (`Food` vs `food`)
4. No mapping exists between old tags and new categories

### Location/Meeting Point Issues

**Current State:**
- 11 experiences have `meeting_point` text but no `location_address` or `location` coordinates
- Only 1 experience has the new location system with coordinates
- Without coordinates, experiences can't be filtered by radius for hotels

**Impact:**
- Hotel experience selection can't show distance
- Radius filtering doesn't work for 92% of experiences
- Location-based features are broken

## Migration Strategy

### Phase 1: Category Migration

#### 1.1 Create Tag-to-Category Mapping

Create a mapping function to convert old tags to new categories:

```typescript
const TAG_TO_CATEGORY_MAP: Record<string, string> = {
  // Direct matches
  'food': 'food',
  'Food': 'food',
  
  // Wine & Food experiences
  'Wine Tasting': 'food',
  'Cooking Class': 'food',
  'Food Tour': 'food',
  'Olive Oil Tasting': 'food',
  
  // Culture & History
  'Historical Tour': 'culture',
  'Art & Museum': 'culture',
  
  // Nature & Outdoors
  'Hiking': 'nature',
  'Cycling': 'nature',
  'Truffle Hunting': 'nature',
  
  // Adventure & Sports
  'Boat Tour': 'adventure',
  'Water Sports': 'adventure',
  'Skiing': 'adventure',
  'Vespa Tour': 'adventure',
  'Photography': 'adventure', // Could also be culture, but adventure fits better
  
  // Wellness
  'Wellness & Spa': 'wellness',
  
  // Nightlife
  'Night Tour': 'nightlife',
};
```

#### 1.2 Migration Options

**Option A: Automatic Migration (Recommended)**
- Create a migration script that:
  1. Maps old tags to new categories using the mapping
  2. Takes the first tag if multiple exist
  3. Defaults to `culture` if no mapping exists
  4. Updates all experiences in one go

**Option B: Manual Review Required**
- Flag experiences with unmapped tags
- Show in dashboard for supplier to update
- Don't auto-migrate

**Option C: Hybrid Approach (Recommended)**
- Auto-migrate clear matches
- Flag ambiguous cases for manual review
- Provide UI for suppliers to review and confirm

#### 1.3 Implementation Steps

1. **Create Migration Script**
   - File: `apps/dashboard/supabase/migrations/[timestamp]_migrate_experience_categories.sql`
   - Map old tags to new categories
   - Update `tags` array to single category ID

2. **Add Validation**
   - Ensure all experiences have valid category after migration
   - Set default category for any that don't match

3. **Update Application Code**
   - Remove old `TagSelector` component usage
   - Ensure `CategorySelector` is used everywhere
   - Add validation to prevent invalid categories

### Phase 2: Location Migration

#### 2.1 Migration Strategy

**Option A: Geocode Existing Meeting Points (Recommended)**
- Use geocoding API to convert `meeting_point` text to coordinates
- Copy `meeting_point` to `location_address`
- Create `location` geography point from geocoded coordinates
- Handle failures gracefully (flag for manual review)

**Option B: Manual Update Required**
- Flag experiences without location
- Require suppliers to update via UI
- Show warning/error in dashboard

**Option C: Hybrid Approach (Recommended)**
- Attempt to geocode all `meeting_point` values
- For successful geocoding: auto-migrate
- For failures: flag for manual review
- Show migration status in dashboard

#### 2.2 Geocoding Implementation

1. **Create Geocoding Migration Script**
   - File: `apps/dashboard/supabase/migrations/[timestamp]_migrate_experience_locations.sql`
   - Use Supabase Edge Function or external API
   - Process experiences with `meeting_point` but no `location`

2. **Geocoding Logic**
   ```sql
   -- Pseudo-code for migration
   FOR each experience WITH meeting_point BUT NO location:
     - Geocode meeting_point text
     - IF geocoding succeeds:
       - SET location_address = meeting_point
       - SET location = POINT(lng, lat)
     - ELSE:
       - Flag for manual review
       - Log error
   ```

3. **Handle Edge Cases**
   - Vague meeting points ("Stresa port" - might need city context)
   - Multiple locations mentioned
   - Invalid addresses
   - International addresses

#### 2.3 Manual Review UI

Create a dashboard page for suppliers to:
- See experiences flagged for location review
- Update location using LocationAutocomplete component
- Verify geocoded locations
- Bulk update if needed

### Phase 3: Data Validation & Cleanup

#### 3.1 Validation Rules

**Categories:**
- ✅ Must have exactly one category from `EXPERIENCE_CATEGORIES`
- ✅ Category must be valid ID (`food`, `culture`, `nature`, `adventure`, `wellness`, `nightlife`)
- ❌ No empty tags array
- ❌ No multiple tags (except during transition)

**Location:**
- ✅ Active experiences should have `location` coordinates
- ✅ `location_address` should match or complement `meeting_point`
- ⚠️ Draft experiences can have incomplete location (but warn)

#### 3.2 Cleanup Tasks

1. **Remove Duplicate Data**
   - After migration, `meeting_point` can be deprecated
   - Keep for backwards compatibility during transition
   - Eventually remove or make it computed from `location_address`

2. **Data Consistency Checks**
   - Ensure all active experiences have valid category
   - Ensure all active experiences have location (for radius filtering)
   - Flag inconsistencies for review

3. **Archive Old Tags**
   - Keep old tag values in migration log for reference
   - Don't delete, but mark as deprecated

## UI/UX Improvements

### 1. Experience Dashboard Warnings

Add visual indicators for experiences needing attention in `ExperienceDashboard.tsx`:

```tsx
// Check if category is valid
const hasValidCategory = category && EXPERIENCE_CATEGORIES.some(c => c.id === category);

// Check if location exists
const hasLocation = locationAddress && locationLat !== null && locationLng !== null;

// Show warnings at top of experience dashboard
{(!hasValidCategory || !hasLocation) && (
  <Card className="border-warning/50 bg-warning/5 mb-4">
    <CardContent className="p-4">
      <div className="flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-warning mt-0.5" />
        <div className="flex-1 space-y-2">
          <h4 className="font-medium text-foreground">Data needs attention</h4>
          {!hasValidCategory && (
            <p className="text-sm text-muted-foreground">
              This experience has an outdated category. Please select a new category from the Basic Info tab.
            </p>
          )}
          {!hasLocation && (
            <p className="text-sm text-muted-foreground">
              This experience needs a location for hotel radius filtering. Add a location in the Location tab.
            </p>
          )}
        </div>
      </div>
    </CardContent>
  </Card>
)}
```

### 1.1 Location Tab Improvements

In the Location tab of `ExperienceDashboard.tsx`:
- Show `meeting_point` value if it exists but `location_address` is empty
- Pre-fill `location_address` from `meeting_point` with a "Use meeting point" button
- Show warning if `meeting_point` exists but no coordinates
- Add "Geocode from meeting point" button to auto-populate location

### 1.2 Category Display Updates

Update category display throughout the app:
- **ExperienceSelection.tsx**: Show category badge, handle invalid categories gracefully
- **ExperienceDashboard.tsx**: Show current category, highlight if invalid
- **Widget pages**: Use `getCategoryLabel()` and `getCategoryIcon()` from shared package

### 2. Experience List Indicators

Show badges in experience list (`/supplier/experiences`):

```tsx
// In ExperienceCard or ExperienceList component
{!hasValidCategory && (
  <Badge variant="warning" className="text-xs">
    Needs category
  </Badge>
)}
{!hasLocation && experience.experience_status === 'active' && (
  <Badge variant="destructive" className="text-xs">
    Missing location
  </Badge>
)}
```

**Visual Indicators:**
- 🟡 "Needs category" - Invalid or missing category
- 🔴 "Missing location" - Active experience without coordinates (critical for hotels)
- ✅ "Complete" - All data valid (no badge shown)

### 3. Bulk Update Tools

For suppliers with many experiences, create a new page: `/supplier/data-migration`

**Features:**
- List all experiences with data issues
- Bulk category update (select multiple, assign category)
- Bulk location geocoding (attempt to geocode all meeting_points)
- Export CSV for manual fixes
- Progress indicators for bulk operations
- Filter by issue type (category, location, both)

**UI Layout:**
```
┌─────────────────────────────────────────┐
│ Data Migration & Cleanup               │
├─────────────────────────────────────────┤
│ Filter: [All] [Category] [Location]     │
│                                         │
│ ⚠️  Wine Tasting Alto Piemonte         │
│     Issues: Invalid category, Missing location
│     [Fix Category] [Add Location]      │
│                                         │
│ ⚠️  Borromean Island guided tour       │
│     Issues: Invalid category, Missing location
│     [Fix Category] [Add Location]       │
│                                         │
│ [Bulk Actions ▼]                        │
│   - Geocode all meeting points         │
│   - Set default category for all       │
└─────────────────────────────────────────┘
```

### 4. Widget Display Updates

Update widget pages to handle both old and new location data:

**Current Usage:**
- `meeting_point` is displayed in:
  - Experience detail page (`[experienceSlug]/page.tsx`)
  - Confirmation page (`confirmation/[id]/page.tsx`)

**Recommended Changes:**
1. **Priority**: Show `location_address` if available, fallback to `meeting_point`
2. **Future**: Deprecate `meeting_point` display, use only `location_address`
3. **Map Integration**: Use `location` coordinates for map display (future enhancement)

```tsx
// In widget experience pages
const displayLocation = experience.location_address || experience.meeting_point;

{displayLocation && (
  <div>
    <h3>Meeting point</h3>
    <p>{displayLocation}</p>
  </div>
)}
```

## Implementation Plan

### Step 1: Category Migration (Week 1)

1. ✅ Create tag-to-category mapping
2. ✅ Write migration SQL script
3. ✅ Test migration on staging
4. ✅ Run migration on production
5. ✅ Update application to validate categories
6. ✅ Add UI warnings for invalid categories

### Step 2: Location Migration (Week 2)

1. ✅ Set up geocoding service (if not already)
2. ✅ Create location migration script
3. ✅ Test geocoding accuracy
4. ✅ Run migration (auto-migrate successful, flag failures)
5. ✅ Create manual review UI
6. ✅ Notify suppliers of experiences needing location

### Step 3: Validation & Cleanup (Week 3)

1. ✅ Add validation rules
2. ✅ Create data consistency checks
3. ✅ Add UI indicators
4. ✅ Create migration status page
5. ✅ Document new data requirements

### Step 4: Deprecation (Future)

1. ⏳ Mark `meeting_point` as deprecated
2. ⏳ Update all code to use `location_address` + `location`
3. ⏳ Remove `meeting_point` field (after sufficient transition period)

## Database Migration Scripts

### Category Migration

```sql
-- apps/dashboard/supabase/migrations/[timestamp]_migrate_experience_categories.sql

-- Create function to map old tags to new categories
CREATE OR REPLACE FUNCTION map_tag_to_category(tag_text text)
RETURNS text AS $$
BEGIN
  RETURN CASE
    WHEN tag_text IN ('food', 'Food', 'Wine Tasting', 'Cooking Class', 'Food Tour', 'Olive Oil Tasting') THEN 'food'
    WHEN tag_text IN ('Historical Tour', 'Art & Museum') THEN 'culture'
    WHEN tag_text IN ('Hiking', 'Cycling', 'Truffle Hunting') THEN 'nature'
    WHEN tag_text IN ('Boat Tour', 'Water Sports', 'Skiing', 'Vespa Tour', 'Photography') THEN 'adventure'
    WHEN tag_text = 'Wellness & Spa' THEN 'wellness'
    WHEN tag_text = 'Night Tour' THEN 'nightlife'
    ELSE 'culture' -- Default fallback
  END;
END;
$$ LANGUAGE plpgsql;

-- Migrate tags to categories
UPDATE experiences
SET tags = ARRAY[map_tag_to_category(tags[1])]
WHERE tags IS NOT NULL 
  AND array_length(tags, 1) > 0
  AND tags[1] NOT IN ('food', 'culture', 'nature', 'adventure', 'wellness', 'nightlife');

-- Ensure all experiences have at least one category
UPDATE experiences
SET tags = ARRAY['culture']
WHERE tags IS NULL OR array_length(tags, 1) IS NULL OR array_length(tags, 1) = 0;
```

### Location Migration

```sql
-- apps/dashboard/supabase/migrations/[timestamp]_migrate_experience_locations.sql

-- This will be handled by an Edge Function or application-level script
-- that uses geocoding API, as PostGIS doesn't have built-in geocoding

-- After geocoding, update experiences:
-- UPDATE experiences
-- SET 
--   location_address = meeting_point,
--   location = ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography
-- WHERE meeting_point IS NOT NULL 
--   AND location IS NULL;
```

## Testing Plan

### Category Migration Tests

1. Test with various old tag values
2. Test with multiple tags (should take first)
3. Test with empty tags (should default)
4. Test with invalid tags (should default to culture)
5. Verify all experiences have valid category after migration

### Location Migration Tests

1. Test geocoding with various address formats
2. Test with vague addresses (e.g., "Stresa port")
3. Test with international addresses
4. Test error handling for failed geocoding
5. Verify coordinates are valid
6. Test radius filtering works after migration

## Rollback Plan

### Category Migration Rollback

- Keep backup of original tags before migration
- Can restore from backup if needed
- Migration is non-destructive (only updates, doesn't delete)

### Location Migration Rollback

- Geocoding is additive (adds location, doesn't remove meeting_point)
- Can safely rollback by setting location to NULL
- Original meeting_point data preserved

## Success Metrics

- ✅ 100% of experiences have valid category
- ✅ 100% of active experiences have location coordinates
- ✅ 0 experiences with old tag values
- ✅ Hotel radius filtering works for all active experiences
- ✅ Suppliers can easily update flagged experiences

## Future Considerations

1. **Category System Evolution**: Plan for adding new categories without breaking existing data
2. **Location Accuracy**: Consider allowing suppliers to adjust geocoded locations
3. **Multiple Locations**: Some experiences might need multiple locations (e.g., pickup + dropoff)
4. **Location History**: Track location changes for analytics
5. **Meeting Point Deprecation**: Plan for removing `meeting_point` field entirely
