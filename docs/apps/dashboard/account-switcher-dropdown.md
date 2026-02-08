Updated by Elias on 07-02-2026

# Account Switcher Dropdown

## Purpose

The account dropdown (top-left of sidebar) is the control center for managing organizations. It makes clear what belongs to which company and provides quick access to add capabilities or create new businesses.

## Location & Appearance

- **Position**: Top-left of the sidebar, directly below the sidebar toggle button
- **Trigger**: Shows the name of the currently active organization
- **Visual**: Button with organization name + chevron down icon
- **Width**: 224px (full sidebar width)

## Dropdown Structure

The dropdown appears in sections, each visible only when relevant:

### 1. Organizations Section
**When visible**: User has 2 or more organizations

**What it shows**:
- List of all organizations the user owns
- Checkmark (✓) next to the currently active organization
- Organization names are truncated if too long

**What happens when clicked**:
- Clicking a different organization switches the active context
- User is redirected to `/dashboard` (which smart-redirects based on capabilities)
- All sidebar sections, dashboard content, and data views update to show that organization's data
- Complete data isolation — you only see what belongs to the selected organization

**Example**:
```
Organizations
  ✓ Lake Como Adventures
    Grand Hotel Lago
    Milan Boat Tours
```

### 2. Views Section
**When visible**: Active organization has BOTH supplier and hotel capabilities

**What it shows**:
- "Experiences" — navigate to supplier dashboard view
- "Hotels" — navigate to hotel dashboard view

**What happens when clicked**:
- Switches the dashboard view within the same organization
- No data change — just a different perspective on the same business
- Useful when an organization runs both experiences and hotels

**Example**:
```
Views
  Experiences
  Hotels
```

### 3. Add Hotel Property
**When visible**: Always (when user has at least one organization)

**What it does**:
- Opens a dialog to add a hotel property to the **current organization**
- User enters hotel name (slug auto-generated)
- Creates a new hotel property under the same company
- Organization gains hotel capability automatically (if it didn't have it)
- Hotel sidebar sections appear after adding

**Important distinction**: This adds to the current company, not a new company.

**Use cases**:
- Supplier wants to add a hotel property to their business
- Hotel chain owner adding their second, third, or fourth property
- Any organization expanding into hotel operations

### 4. New Organization
**When visible**: Always (when user has at least one organization)

**What it does**:
- Opens the "Add Business" flow (type selection → name)
- Creates a completely separate organization
- New organization appears in the Organizations list
- Automatically switches to the new organization after creation
- Complete data isolation from other organizations

**Important distinction**: This creates a new company, separate from the current one.

**Use cases**:
- Entrepreneur with separate hotel company and separate tour company
- Someone running multiple independent businesses
- Different legal entities that need separate Stripe accounts, reporting, etc.

### 5. Sign Out
**When visible**: Always

**What it does**:
- Logs the user out
- Redirects to login page

## Key Distinctions

### Adding to Current Organization vs. Creating New Organization

**Add Hotel Property** (stays in current company):
- Adds a hotel property under the active organization
- Everything stays together — same Stripe account, same reporting, same data
- Organization name doesn't change
- Use when: "I want to add another hotel to my existing business"

**New Organization** (creates separate company):
- Creates a brand new organization with its own name
- Completely separate — different Stripe, different data, different everything
- Appears as a separate item in the Organizations list
- Use when: "I want to create a completely different business"

### Visual Hierarchy

The dropdown uses clear visual separation:
- **Sections** are labeled with subtle gray text
- **Separators** (horizontal lines) divide major sections
- **Active state** is indicated by checkmark and background highlight
- **Hover states** provide feedback on clickable items

## User Mental Model

Users should understand:
1. **One organization = one company** — everything under it belongs together
2. **Multiple hotel properties** = multiple hotels under one organization (hotel chain)
3. **Multiple organizations** = completely separate companies
4. **Switching organizations** = switching between different businesses
5. **Adding capabilities** = expanding what the current organization can do

## Edge Cases

**User with 1 organization**:
- No "Organizations" section (nothing to switch between)
- "Add Hotel Property" and "New Organization" still visible
- "Views" section appears if org has both capabilities

**User with 0 organizations**:
- Dropdown doesn't appear (user is in onboarding flow)
- Dashboard shows inline type selection instead

**Organization with both capabilities**:
- "Views" section appears
- User can toggle between Experiences and Hotels views
- Both views show data from the same organization

## Future Considerations

**Not yet built**:
- Organization settings (edit name, delete org)
- User profile settings (change password, email)
- Bulk operations across organizations
