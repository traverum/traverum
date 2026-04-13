# 2026-03-23_receptionist-booking-panel-ui

## Goal

Improve receptionist `BookingPanel` UX: correct guest preview link, clearer labels, contact block, details layout, form hierarchy, and visual polish.

## Blast Radius

`apps/widget` — `receptionist/BookingPanel.tsx`, `ParticipantSelector.tsx` (optional `labelClassName` only; guest widget unchanged by default).

## Done

- Guest preview: always `/experiences/{slug}`; label **Open guest view**; logged product rule in `product-context.md`.
- **Experience location** label (vs meeting point); location row styling aligned with guest preview card.
- Contact supplier: single phone row + WhatsApp when possible; fixed email row; no duplicate phone/email.
- Details: replaced inline meta row with structured `<dl>` card; label/value grid (reverted stacked variant per preference).
- Guest preview + experience location: split section titles, shared inset card pattern (`rounded-xl`).
- Form hierarchy: shared `formEyebrow` / `insetCard` / `formInput`; reference block vs booking block (`border-t` before When); **Guest details** eyebrow; total price emphasis; focus rings on primary actions; success buttons `h-12`.
- Header/title: `font-light` title; header separator restored as very light rule (`border-foreground/[0.06]`).
- `ParticipantSelector`: optional `labelClassName` for receptionist eyebrow alignment.

## Decisions

- Guest preview URL policy → `docs/memory/product-context.md` (Veyond direct, not hotel widget).

## Open Items

- [ ] (Optional) Align `SessionPicker` outer chrome to same `rounded-xl` inset language — deferred (shared widget blast radius).

## Notes

-
