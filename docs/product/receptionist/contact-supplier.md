# Contact Supplier

## Goal

No dedicated route — this lives inside the BookingPanel on `/receptionist/`.

Receptionists need to contact experience suppliers for logistics questions: "Where exactly is the meeting point?", "Can they accommodate a wheelchair?", "Is the tour still running despite the rain?" This should be instant — one tap to WhatsApp, call, or email. Additionally, suppliers can leave hotel-only operational notes that help the receptionist answer common guest questions without needing to contact the supplier at all.

## For whom

Receptionists fielding guest questions about logistics that go beyond what's shown in the experience listing. The guest is at the desk asking questions — the receptionist needs answers fast, either from the hotel notes or by reaching the supplier directly.

## Key stories

- Guest asks about meeting point details — receptionist sees the meeting point address and Google Maps link in the BookingPanel, shows the guest on their screen or gives directions
- Guest has a special dietary requirement for a food tour — receptionist taps WhatsApp to message the supplier, message is pre-filled with hotel name and experience title
- Receptionist wants to confirm availability before booking — taps Call to ring the supplier directly
- Supplier has left hotel notes about dress code and arrival time — receptionist reads the "Message from supplier" block and relays to the guest without needing to contact anyone
- Supplier phone number is missing — WhatsApp and Call buttons show as disabled, email remains available
- Receptionist needs to email the supplier about a group booking — taps Email, subject line is pre-filled with the experience title

## Design decisions

### Three contact channels

Displayed as a three-button grid in the BookingPanel:

1. **WhatsApp** — opens WhatsApp with a pre-filled message including the hotel name and experience title. Green accent styling. Only active if the supplier has a phone number on file.
2. **Call** — direct `tel:` link to the supplier's phone. Only active if the supplier has a phone number.
3. **Email** — `mailto:` link with pre-filled subject line (experience title). Always available since email is required for all suppliers.

Disabled channels show as muted with a dash icon — not hidden. This keeps the layout consistent regardless of what contact data is available.

### Hotel notes (US2 — Information for Hotels)

- Stored in `experiences.hotel_notes` column
- Displayed in an accent-colored bordered block in the BookingPanel, labeled "Message from supplier"
- **Visible only** in the receptionist tool and hotel dashboard — never on the guest-facing widget
- Typical content: meeting logistics, dress codes, recommended arrival times, guest requirements, seasonal notes, capacity warnings
- If no hotel notes exist for an experience, the block is not shown

### Supplier contact visibility

- Supplier email: always visible in the BookingPanel (shown in a bordered row below contact buttons)
- Supplier phone: accessible via Call and WhatsApp buttons (not displayed as raw text)
- All contact info is only available to authenticated receptionist, owner, or admin users — never exposed to guests

## Not yet implemented

- **Dedicated WhatsApp integration** beyond pre-filled `wa.me` links (e.g., in-app messaging, delivery receipts)
- **Contact history or message logging** — no record of supplier communications is kept in the system
- **In-tool chat** with suppliers — currently all communication happens outside the tool via WhatsApp, phone, or email

## References

- BookingPanel contact section: `apps/widget/src/components/receptionist/BookingPanel.tsx`
- Experience data with supplier contact and hotel notes: `apps/widget/src/lib/receptionist/experiences.ts`
- DB column: `experiences.hotel_notes` (migration `20260313140000_receptionist_support.sql`)
