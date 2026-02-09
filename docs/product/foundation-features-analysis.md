# Foundation Features Analysis

**Created:** 2026-02-10

This document identifies the foundational features that must be built first to enable all other features.

---

## 🔴 CRITICAL FOUNDATION (Build First)

### 1. Hotel Location Settings UI (Feature #4) ⭐⭐⭐
**Why it's critical:** This is THE foundational feature that enables everything location-based.

**Dependencies it unlocks:**
- ✅ Receptionist Booking Route (#7) - needs hotel location to use `get_experiences_within_radius()`
- ✅ Product-First Website Phase 1 (#16) - needs location to show experiences
- ✅ Hotel Invitation System (#6) - needs location to find hotels
- ✅ Supplier "Find Hotels" (#9) - needs location to find hotels near experiences
- ✅ Auto-Create Distribution (#3) - works with receptionist route

**Current state:**
- Location currently stored in `partners` table
- Need to move to `hotel_configs` for multi-property support
- `get_experiences_within_radius()` function already exists but needs hotel location from `hotel_configs`

**Effort:** 3-4 hours
**Impact:** Enables 5+ other features

---

### 2. Self-Owned Experience Commission Fix (Feature #1) ⭐⭐⭐
**Why it's critical:** Critical bug fix - prevents hotels from paying themselves commission.

**Dependencies:** None - can be built immediately
**Effort:** 2-4 hours
**Impact:** Prevents financial bugs

---

### 3. Track Booking Creator (Feature #5) ⭐⭐⭐
**Why it's foundational:** Simple database change that enables analytics for all future features.

**Dependencies:** None - can be built immediately
**Effort:** 1 hour
**Impact:** Enables analytics tracking

---

## 🟡 SECONDARY FOUNDATION (Build After #4)

### 4. Receptionist Booking Route (Feature #7) ⭐⭐
**Why it's foundational:** Core receptionist feature that enables other receptionist features.

**Dependencies:**
- ✅ Requires: Hotel Location (#4) - to use `get_experiences_within_radius()`

**Dependencies it unlocks:**
- ✅ Auto-Create Distribution (#3) - works with receptionist bookings
- ✅ Supplier Contact Info (#2) - shows in receptionist mode
- ✅ Product-First Website Phase 1 (#16) - reuses receptionist view

**Effort:** 6-8 hours
**Impact:** Enables receptionist workflow

---

### 5. Auto-Create Distribution (Feature #3) ⭐⭐⭐
**Why it's foundational:** Removes friction for receptionist flow.

**Dependencies:**
- ✅ Requires: Receptionist Booking Route (#7) - needs receptionist mode to exist

**Effort:** 2-3 hours
**Impact:** Removes booking friction

---

### 6. Supplier Contact Info in Receptionist Mode (Feature #2) ⭐⭐⭐
**Why it's foundational:** Enables direct communication.

**Dependencies:**
- ✅ Requires: Receptionist Booking Route (#7) - needs `isReceptionistMode` flag

**Effort:** 1-2 hours
**Impact:** Enables communication

---

## 🟢 GROWTH FEATURES (Build After Foundation)

### 7. Hotel Invitation System (Feature #6) ⭐⭐
**Dependencies:**
- ✅ Requires: Hotel Location (#4) - to find hotels by location

**Effort:** 8-12 hours

---

### 8. Product-First Website Phase 1 (Feature #16) ⭐⭐
**Dependencies:**
- ✅ Requires: Hotel Location (#4) - to show experiences in radius
- ✅ Requires: Receptionist Booking Route (#7) - reuses receptionist view

**Effort:** 8-12 hours

---

### 9. Supplier "Find Hotels" (Feature #9) ⭐⭐
**Dependencies:**
- ✅ Requires: Hotel Location (#4) - to find hotels near experiences

**Effort:** 6-8 hours

---

## 📊 Dependency Graph

```
Feature #4 (Hotel Location)
    ↓
    ├─→ Feature #7 (Receptionist Route)
    │       ↓
    │       ├─→ Feature #3 (Auto-Create Distribution)
    │       └─→ Feature #2 (Supplier Contact Info)
    │
    ├─→ Feature #6 (Hotel Invitations)
    ├─→ Feature #9 (Supplier Find Hotels)
    └─→ Feature #16 Phase 1 (Product-First Website)
            ↓ (also depends on #7)
```

---

## 🎯 Recommended Build Order

### Week 1: Critical Foundation
1. **Hotel Location to hotel_configs (#4)** - 3-4 hours ⚠️ **START HERE**
2. **Self-Owned Commission Fix (#1)** - 2-4 hours
3. **Track Booking Creator (#5)** - 1 hour

**Total:** 6-9 hours

### Week 2: Receptionist MVP
4. **Receptionist Booking Route (#7)** - 6-8 hours
5. **Auto-Create Distribution (#3)** - 2-3 hours
6. **Supplier Contact Info (#2)** - 1-2 hours

**Total:** 9-13 hours

### Week 3+: Growth Features
7. Product-First Website Phase 1 (#16) - 8-12 hours
8. Hotel Invitation System (#6) - 8-12 hours
9. Supplier "Find Hotels" (#9) - 6-8 hours

---

## 🚨 Why Start with Feature #4?

**Feature #4 (Hotel Location to hotel_configs) is the single most important feature because:**

1. **Enables location-based discovery** - Without it, you can't find experiences near hotels
2. **Required by 5+ features** - Receptionist route, product-first website, invitation systems
3. **Database migration needed** - Must be done before other features use location
4. **Low effort, high impact** - Only 3-4 hours but unlocks everything
5. **No dependencies** - Can be built immediately

**Without Feature #4:**
- ❌ Receptionist route can't show experiences in radius
- ❌ Product-first website can't work
- ❌ Hotel invitation system can't find hotels
- ❌ Supplier "Find Hotels" can't work

**With Feature #4:**
- ✅ All location-based features become possible
- ✅ Foundation for growth features is laid
- ✅ Multi-property support enabled

---

## 💡 Key Insight

**The entire product roadmap depends on hotel location being in `hotel_configs`.** 

This is not just a nice-to-have feature - it's the foundation that makes location-based features possible. Without it, you're building on sand.

**Start here:** Feature #4 (Hotel Location to hotel_configs)
